/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { describe, expect, it } from 'vitest';
import { Session } from '../core/types';
import { summarizeSessions } from './summary';
import { renderHtmlDashboard } from './dashboard';

function request(overrides: Partial<Session['requests'][number]>): Session['requests'][number] {
  return {
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
    ...overrides,
  };
}

function session(overrides: Partial<Session>): Session {
  const requests = overrides.requests || [request({})];
  return {
    sessionId: 's1',
    workspaceId: 'gigacode-project',
    workspaceName: 'project',
    location: 'terminal',
    harness: 'GigaCode',
    creationDate: Date.parse('2026-05-21T10:00:00.000Z'),
    lastMessageDate: Date.parse('2026-05-21T10:05:00.000Z'),
    requestCount: requests.length,
    requests,
    ...overrides,
  };
}

describe('renderHtmlDashboard', () => {
  it('renders a standalone HTML dashboard with summary data', () => {
    const sessions = [session({})];
    const html = renderHtmlDashboard(summarizeSessions(sessions), sessions);

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('AI Engineer Coach Dashboard');
    expect(html).toContain('Sessions');
    expect(html).toContain('GigaCode');
    expect(html).toContain('project');
    expect(html).toContain('write_file');
    expect(html).toContain('<script id="dashboard-data" type="application/json">');
  });

  it('escapes log-derived text before writing HTML', () => {
    const sessions = [session({
      workspaceName: '<script>alert(1)</script>',
      requests: [request({ messageText: '<img src=x onerror=alert(1)>' })],
    })];
    const html = renderHtmlDashboard(summarizeSessions(sessions), sessions);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
  });
});
