/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { Session } from '../core/types';
import { formatCliSummary, summarizeSessions } from './summary';

function session(overrides: Partial<Session>): Session {
  return {
    sessionId: 's1',
    workspaceId: 'gigacode-project',
    workspaceName: 'project',
    location: 'terminal',
    harness: 'GigaCode',
    creationDate: Date.parse('2026-05-21T10:00:00.000Z'),
    lastMessageDate: Date.parse('2026-05-21T10:05:00.000Z'),
    requestCount: 2,
    requests: [
      {
        requestId: 'r1',
        timestamp: Date.parse('2026-05-21T10:00:00.000Z'),
        messageText: 'Create app.py',
        responseText: 'Done',
        isCanceled: false,
        agentName: 'GigaCode',
        agentMode: 'agent',
        modelId: 'CodeChat',
        toolsUsed: ['write_file'],
        editedFiles: ['app.py'],
        referencedFiles: [],
        slashCommand: '',
        variableKinds: {},
        customInstructions: [],
        skillsUsed: [],
        firstProgress: null,
        totalElapsed: 1200,
        messageLength: 13,
        responseLength: 4,
        userCode: [],
        aiCode: [{ language: 'py', loc: 1 }],
        toolConfirmations: [],
        promptTokens: 120,
        completionTokens: 8,
        cacheReadTokens: 30,
        cacheWriteTokens: null,
        compaction: null,
        todoSnapshot: null,
        workType: 'feature',
      },
      {
        requestId: 'r2',
        timestamp: Date.parse('2026-05-21T10:02:00.000Z'),
        messageText: 'Read package',
        responseText: 'Done',
        isCanceled: false,
        agentName: 'GigaCode',
        agentMode: 'agent',
        modelId: 'CodeChat',
        toolsUsed: ['read_file'],
        editedFiles: [],
        referencedFiles: ['package.json'],
        slashCommand: '',
        variableKinds: {},
        customInstructions: [],
        skillsUsed: [],
        firstProgress: null,
        totalElapsed: 800,
        messageLength: 12,
        responseLength: 4,
        userCode: [],
        aiCode: [],
        toolConfirmations: [],
        promptTokens: 80,
        completionTokens: 4,
        cacheReadTokens: null,
        cacheWriteTokens: null,
        compaction: null,
        todoSnapshot: null,
        workType: 'analysis',
      },
    ],
    ...overrides,
  };
}

describe('CLI summary', () => {
  it('summarizes sessions into terminal-friendly totals and top lists', () => {
    const summary = summarizeSessions([session({})]);

    expect(summary.totals).toEqual({
      sessions: 1,
      requests: 2,
      workspaces: 1,
      editedFiles: 1,
      tools: 2,
      promptTokens: 200,
      completionTokens: 12,
      cacheReadTokens: 30,
      aiLinesOfCode: 1,
    });
    expect(summary.byHarness).toEqual([{ name: 'GigaCode', sessions: 1, requests: 2 }]);
    expect(summary.topWorkspaces).toEqual([{ name: 'project', sessions: 1, requests: 2 }]);
    expect(summary.topTools).toEqual([{ name: 'write_file', count: 1 }, { name: 'read_file', count: 1 }]);
  });

  it('formats text summaries for CLI output', () => {
    const output = formatCliSummary(summarizeSessions([session({})]), 'text');

    expect(output).toContain('Сводка AI Engineer Coach CLI');
    expect(output).toContain('Сессии: 1');
    expect(output).toContain('Запросы: 2');
    expect(output).toContain('Токены prompt: 200');
    expect(output).toContain('GigaCode: 1 сессий, 2 запросов');
    expect(output).toContain('project: 1 сессий, 2 запросов');
  });

  it('formats JSON summaries for machine consumption', () => {
    const output = formatCliSummary(summarizeSessions([session({})]), 'json');
    const parsed = JSON.parse(output) as ReturnType<typeof summarizeSessions>;

    expect(parsed.totals.sessions).toBe(1);
    expect(parsed.topTools[0].name).toBe('write_file');
  });
});
