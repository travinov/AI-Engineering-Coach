/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { loadCliSessions } from './load';

function withGigaCodeProjects(run: (projectsDir: string) => void): void {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'aec-cli-load-test-'));
  const projectsDir = path.join(root, 'projects');
  const chatDir = path.join(projectsDir, '-Users-me-project', 'chats');
  fs.mkdirSync(chatDir, { recursive: true });
  fs.writeFileSync(path.join(chatDir, 'sess-1.jsonl'), [
    JSON.stringify({
      uuid: 'u1',
      sessionId: 'sess-1',
      timestamp: '2026-05-21T10:00:00.000Z',
      type: 'user',
      cwd: '/Users/me/project',
      message: { role: 'user', parts: [{ text: 'Hello' }] },
    }),
    JSON.stringify({
      uuid: 'a1',
      sessionId: 'sess-1',
      timestamp: '2026-05-21T10:00:01.000Z',
      type: 'assistant',
      cwd: '/Users/me/project',
      model: 'CodeChat',
      message: { role: 'model', parts: [{ text: 'Hi' }] },
    }),
  ].join('\n'), 'utf-8');

  try {
    run(projectsDir);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe('loadCliSessions', () => {
  it('loads GigaCode sessions from an explicit projects path', () => {
    withGigaCodeProjects((projectsDir) => {
      const sessions = loadCliSessions({
        command: 'summary',
        harness: 'gigacode',
        format: 'text',
        gigacodeProjectsPath: projectsDir,
      });

      expect(sessions).toHaveLength(1);
      expect(sessions[0].harness).toBe('GigaCode');
      expect(sessions[0].workspaceName).toBe('project');
    });
  });
});
