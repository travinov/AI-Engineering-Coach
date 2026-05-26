/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({
  Uri: {
    joinPath: (...parts: unknown[]) => ({
      parts,
      toString(): string {
        return parts.map(String).join('/');
      },
    }),
  },
}));

describe('Russian corporate localization', () => {
  it('localizes VS Code command titles in the extension manifest', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as {
      description: string;
      contributes: { commands: Array<{ command: string; title: string }>; views: { aiEngineerCoach: Array<{ name: string }> } };
    };

    expect(packageJson.description).toContain('Анализирует использование AI-ассистентов');
    expect(packageJson.contributes.commands.find(c => c.command === 'aiEngineerCoach.open')?.title).toBe('AI Engineer Coach: Открыть дашборд');
    expect(packageJson.contributes.commands.find(c => c.command === 'aiEngineerCoach.reload')?.title).toBe('AI Engineer Coach: Обновить данные');
    expect(packageJson.contributes.views.aiEngineerCoach[0]?.name).toBe('Дашборд');
  });

  it('localizes the webview navigation and filters', async () => {
    const { getDashboardHtml } = await import('./panel-html');
    const webview = {
      cspSource: 'vscode-resource:',
      asWebviewUri(uri: { toString(): string }): { toString(): string } {
        return uri;
      },
    };
    const html = getDashboardHtml(webview as never, { toString: () => '/extension' } as never);

    expect(html).toContain('Наблюдение');
    expect(html).toContain('Дашборд');
    expect(html).toContain('Моменты кодинга');
    expect(html).toContain('Улучшение');
    expect(html).toContain('Рабочая область');
    expect(html).toContain('Все harness');
  });
});
