/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/* GigaCode CLI session parser
 *
 * Data layout (macOS):
 *   ~/.gigacode/projects/<project-id>/chats/<session-id>.jsonl
 *
 * Lines have: uuid, parentUuid, sessionId, timestamp, type, cwd, version, message
 * type=user:        message.parts[].text
 * type=assistant:   message.parts[].text or message.parts[].functionCall, usageMetadata
 * type=tool_result: message.parts[].functionResponse
 * type=system:      runtime/telemetry events, ignored for request content
 */

import * as fs from 'fs';
import * as path from 'path';
import { Session, SessionRequest } from './types';
import { assertTrustedPath, createRequest, createSession, detectDevcontainerFromRequests, readFileSafe } from './parser-shared';
import { extractReasoningEffortFromModelId } from './helpers';

interface GigaCodeLine {
  uuid?: string;
  parentUuid?: string | null;
  sessionId?: string;
  timestamp?: string;
  type?: string;
  cwd?: string;
  model?: string;
  message?: GigaCodeMessage;
  usageMetadata?: GigaCodeUsage;
}

interface GigaCodeMessage {
  role?: string;
  parts?: GigaCodePart[];
}

interface GigaCodePart {
  text?: string;
  functionCall?: {
    id?: string;
    name?: string;
    args?: Record<string, unknown>;
  };
  functionResponse?: {
    id?: string;
    name?: string;
    response?: Record<string, unknown>;
  };
}

interface GigaCodeUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  totalTokenCount?: number;
  cachedContentTokenCount?: number;
}

interface GigaCodeTurnState {
  requestId: string;
  userText: string;
  userTs: number | null;
  responseTextParts: string[];
  toolsUsed: string[];
  editedFiles: string[];
  referencedFiles: string[];
  promptTokens: number | null;
  completionTokens: number | null;
  cacheReadTokens: number | null;
  modelId: string;
  lastTs: number | null;
}

const WRITE_TOOLS = new Set([
  'write', 'write_file', 'create_file', 'edit', 'edit_file',
  'replace', 'patch', 'apply_patch', 'multi_edit',
]);

const READ_TOOLS = new Set([
  'read', 'read_file', 'grep', 'grep_search', 'glob', 'list_directory', 'ls',
]);

export function findGigaCodeDirs(): string[] {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  const dirs: string[] = [];
  if (!home) return dirs;

  const projectsDir = path.join(home, '.gigacode', 'projects');
  if (fs.existsSync(projectsDir)) dirs.push(projectsDir);
  return dirs;
}

function parseJsonLine(rawLine: string): GigaCodeLine | null {
  try {
    const parsed: unknown = JSON.parse(rawLine);
    return typeof parsed === 'object' && parsed !== null ? parsed as GigaCodeLine : null;
  } catch {
    return null;
  }
}

function timestampMs(value: string | undefined): number | null {
  if (!value) return null;
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? ts : null;
}

function numberValue(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function projectNameFromCwd(cwd: string): string {
  return cwd.replaceAll('\\', '/').replace(/\/+$/, '').split('/').pop() || 'unknown';
}

function projectIdFromFilePath(filePath: string): string {
  return path.basename(path.dirname(path.dirname(filePath))) || 'unknown';
}

function textFromMessage(message: GigaCodeMessage | undefined): string {
  if (!message?.parts) return '';
  return message.parts
    .map(part => typeof part.text === 'string' ? part.text : '')
    .filter(Boolean)
    .join('\n');
}

function filePathFromArgs(args: Record<string, unknown>): string | null {
  for (const key of ['file_path', 'filePath', 'path', 'filename']) {
    const value = args[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function contentFromArgs(args: Record<string, unknown>): string | null {
  for (const key of ['content', 'code', 'new_string', 'newString']) {
    const value = args[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function addGeneratedContentForCodeScan(turn: GigaCodeTurnState, filePath: string, content: string | null): void {
  if (!content) return;
  const ext = filePath.split('.').pop() || 'text';
  turn.responseTextParts.push(`\n\`\`\`${ext}\n${content}\n\`\`\`\n`);
}

function applyFunctionCall(turn: GigaCodeTurnState, call: NonNullable<GigaCodePart['functionCall']>): void {
  const toolName = call.name || 'unknown';
  turn.toolsUsed.push(toolName);

  const args = call.args || {};
  const filePath = filePathFromArgs(args);
  if (!filePath) return;

  const normalizedTool = toolName.toLowerCase();
  if (WRITE_TOOLS.has(normalizedTool)) {
    turn.editedFiles.push(filePath);
    addGeneratedContentForCodeScan(turn, filePath, contentFromArgs(args));
  } else if (READ_TOOLS.has(normalizedTool)) {
    turn.referencedFiles.push(filePath);
  }
}

function applyAssistantLine(turn: GigaCodeTurnState, line: GigaCodeLine): void {
  const ts = timestampMs(line.timestamp);
  if (ts && (!turn.lastTs || ts > turn.lastTs)) turn.lastTs = ts;
  if (line.model) turn.modelId = line.model;

  for (const part of line.message?.parts || []) {
    if (typeof part.text === 'string' && part.text.length > 0) {
      turn.responseTextParts.push(part.text);
    }
    if (part.functionCall) applyFunctionCall(turn, part.functionCall);
  }

  const usage = line.usageMetadata;
  if (!usage) return;
  turn.promptTokens = (turn.promptTokens ?? 0) + numberValue(usage.promptTokenCount);
  turn.completionTokens = (turn.completionTokens ?? 0) + numberValue(usage.candidatesTokenCount);
  turn.cacheReadTokens = (turn.cacheReadTokens ?? 0) + numberValue(usage.cachedContentTokenCount);
}

function applyToolResultLine(turn: GigaCodeTurnState, line: GigaCodeLine): void {
  const ts = timestampMs(line.timestamp);
  if (ts && (!turn.lastTs || ts > turn.lastTs)) turn.lastTs = ts;

  for (const part of line.message?.parts || []) {
    const name = part.functionResponse?.name;
    if (name && !turn.toolsUsed.includes(name)) turn.toolsUsed.push(name);
  }
}

function newTurn(line: GigaCodeLine): GigaCodeTurnState {
  const userTs = timestampMs(line.timestamp);
  return {
    requestId: line.uuid || `${line.sessionId || 'gigacode'}-${line.timestamp || 'request'}`,
    userText: textFromMessage(line.message),
    userTs,
    responseTextParts: [],
    toolsUsed: [],
    editedFiles: [],
    referencedFiles: [],
    promptTokens: null,
    completionTokens: null,
    cacheReadTokens: null,
    modelId: '',
    lastTs: userTs,
  };
}

function buildRequest(turn: GigaCodeTurnState): SessionRequest {
  const cacheReadTokens = turn.cacheReadTokens && turn.cacheReadTokens > 0 ? turn.cacheReadTokens : null;
  return createRequest({
    requestId: turn.requestId,
    timestamp: turn.userTs,
    messageText: turn.userText,
    responseText: turn.responseTextParts.join('\n'),
    agentName: 'GigaCode',
    agentMode: 'agent',
    modelId: turn.modelId,
    toolsUsed: [...new Set(turn.toolsUsed)],
    editedFiles: [...new Set(turn.editedFiles)],
    referencedFiles: [...new Set(turn.referencedFiles)],
    totalElapsed: turn.userTs && turn.lastTs ? turn.lastTs - turn.userTs : null,
    promptTokens: turn.promptTokens,
    completionTokens: turn.completionTokens,
    cacheReadTokens,
    reasoningEffort: extractReasoningEffortFromModelId(turn.modelId),
  });
}

function findChatFiles(projectsDir: string): string[] {
  const files: string[] = [];
  try {
    assertTrustedPath(projectsDir);
    const projectEntries = fs.readdirSync(projectsDir, { withFileTypes: true });
    for (const projectEntry of projectEntries) {
      if (!projectEntry.isDirectory()) continue;
      const chatDir = path.join(projectsDir, projectEntry.name, 'chats');
      let chatEntries: fs.Dirent[];
      try {
        chatEntries = fs.readdirSync(chatDir, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const chatEntry of chatEntries) {
        if (chatEntry.isFile() && chatEntry.name.endsWith('.jsonl')) {
          files.push(path.join(chatDir, chatEntry.name));
        }
      }
    }
  } catch {
    return files;
  }
  return files;
}

function parseGigaCodeChat(filePath: string): Session | null {
  const content = readFileSafe(filePath);
  if (!content) return null;

  let currentTurn: GigaCodeTurnState | null = null;
  const requests: SessionRequest[] = [];
  let sessionId = path.basename(filePath, '.jsonl');
  let cwd = '';
  let firstTs: number | null = null;
  let lastTs: number | null = null;

  for (const rawLine of content.split(/\r?\n/)) {
    if (!rawLine.trim()) continue;
    const line = parseJsonLine(rawLine);
    if (!line?.type) continue;

    if (line.sessionId) sessionId = line.sessionId;
    if (line.cwd) cwd = line.cwd;
    const ts = timestampMs(line.timestamp);
    if (ts && (!firstTs || ts < firstTs)) firstTs = ts;
    if (ts && (!lastTs || ts > lastTs)) lastTs = ts;

    if (line.type === 'user') {
      if (currentTurn) requests.push(buildRequest(currentTurn));
      currentTurn = newTurn(line);
    } else if (line.type === 'assistant' && currentTurn) {
      applyAssistantLine(currentTurn, line);
    } else if (line.type === 'tool_result' && currentTurn) {
      applyToolResultLine(currentTurn, line);
    }
  }

  if (currentTurn) requests.push(buildRequest(currentTurn));
  if (requests.length === 0) return null;

  const projectId = projectIdFromFilePath(filePath);
  const workspaceName = cwd ? projectNameFromCwd(cwd) : projectId;
  return createSession({
    sessionId,
    workspaceId: `gigacode-${projectId}`,
    workspaceName,
    workspaceRootPath: cwd || undefined,
    location: 'terminal',
    harness: 'GigaCode',
    creationDate: firstTs,
    lastMessageDate: lastTs,
    requests,
    hasDevcontainer: detectDevcontainerFromRequests(requests, cwd),
  });
}

export function parseGigaCodeSessions(projectsDir: string): Session[] {
  const sessions: Session[] = [];
  for (const filePath of findChatFiles(projectsDir)) {
    const session = parseGigaCodeChat(filePath);
    if (session) sessions.push(session);
  }
  return sessions;
}
