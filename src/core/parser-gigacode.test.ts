/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect } from 'vitest';
import { parseGigaCodeSessions } from './parser-gigacode';

function withGigaCodeChat(lines: object[], run: (projectsDir: string) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gigacode-parser-test-'));
  const projectsDir = path.join(root, 'projects');
  const chatDir = path.join(projectsDir, '-Users-me-project', 'chats');
  fs.mkdirSync(chatDir, { recursive: true });
  fs.writeFileSync(
    path.join(chatDir, 'sess-1.jsonl'),
    lines.map(line => JSON.stringify(line)).join('\n'),
    'utf-8',
  );
  try {
    run(projectsDir);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe('parseGigaCodeSessions', () => {
  it('parses user, assistant, tool call, tool result, and token metadata from JSONL chats', () => {
    withGigaCodeChat([
      {
        uuid: 'u1',
        parentUuid: null,
        sessionId: 'sess-1',
        timestamp: '2026-05-21T16:13:37.886Z',
        type: 'user',
        cwd: '/Users/me/project',
        message: { role: 'user', parts: [{ text: 'Create app.py' }] },
      },
      {
        uuid: 'a-tool',
        parentUuid: 'u1',
        sessionId: 'sess-1',
        timestamp: '2026-05-21T16:13:38.000Z',
        type: 'assistant',
        cwd: '/Users/me/project',
        model: 'CodeChat',
        message: {
          role: 'model',
          parts: [{
            functionCall: {
              id: 'call-1',
              name: 'write_file',
              args: { path: 'app.py', content: 'print("hi")' },
            },
          }],
        },
      },
      {
        uuid: 'tool-result',
        parentUuid: 'a-tool',
        sessionId: 'sess-1',
        timestamp: '2026-05-21T16:13:39.000Z',
        type: 'tool_result',
        cwd: '/Users/me/project',
        message: {
          role: 'tool',
          parts: [{
            functionResponse: {
              id: 'call-1',
              name: 'write_file',
              response: { output: 'wrote app.py' },
            },
          }],
        },
      },
      {
        uuid: 'a1',
        parentUuid: 'tool-result',
        sessionId: 'sess-1',
        timestamp: '2026-05-21T16:13:40.720Z',
        type: 'assistant',
        cwd: '/Users/me/project',
        model: 'CodeChat',
        message: { role: 'model', parts: [{ text: 'Done.' }] },
        usageMetadata: {
          promptTokenCount: 120,
          candidatesTokenCount: 8,
          cachedContentTokenCount: 30,
        },
      },
    ], (projectsDir) => {
      const sessions = parseGigaCodeSessions(projectsDir);
      expect(sessions).toHaveLength(1);
      expect(sessions[0].harness).toBe('GigaCode');
      expect(sessions[0].workspaceName).toBe('project');
      expect(sessions[0].requests).toHaveLength(1);
      expect(sessions[0].requests[0].messageText).toBe('Create app.py');
      expect(sessions[0].requests[0].responseText).toContain('Done.');
      expect(sessions[0].requests[0].toolsUsed).toEqual(['write_file']);
      expect(sessions[0].requests[0].editedFiles).toEqual(['app.py']);
      expect(sessions[0].requests[0].promptTokens).toBe(120);
      expect(sessions[0].requests[0].completionTokens).toBe(8);
      expect(sessions[0].requests[0].cacheReadTokens).toBe(30);
    });
  });
});
