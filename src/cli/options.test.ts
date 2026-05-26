/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { describe, expect, it } from 'vitest';
import { findExecutableOnPath, getGigaCodeProjectsDirs, HELP_TEXT, parseCliArgs } from './options';

describe('CLI options', () => {
  it('defaults to a GigaCode summary in text format', () => {
    expect(parseCliArgs([])).toMatchObject({
      command: 'summary',
      harness: 'gigacode',
      format: 'text',
    });
  });

  it('parses explicit harness, format, output, and log path options', () => {
    expect(parseCliArgs(['export', '--harness', 'all', '--format', 'json', '--out', 'report.json', '--path', '/logs/gigacode'])).toMatchObject({
      command: 'export',
      harness: 'all',
      format: 'json',
      outFile: 'report.json',
      gigacodeProjectsPath: '/logs/gigacode',
    });
  });

  it('parses dashboard command with output file and open flag', () => {
    expect(parseCliArgs(['dashboard', '--harness', 'gigacode', '--out', 'gigacode-dashboard.html', '--open'])).toMatchObject({
      command: 'dashboard',
      harness: 'gigacode',
      outFile: 'gigacode-dashboard.html',
      open: true,
    });
  });

  it('shows Russian corporate CLI help by default', () => {
    expect(HELP_TEXT).toContain('AI Engineer Coach CLI');
    expect(HELP_TEXT).toContain('Анализируемый harness');
    expect(HELP_TEXT).toContain('Открыть HTML-дашборд');
  });

  it('uses an explicit GigaCode projects path before environment defaults', () => {
    expect(getGigaCodeProjectsDirs({
      command: 'summary',
      harness: 'gigacode',
      format: 'text',
      gigacodeProjectsPath: '/explicit/projects',
    }, {
      AI_ENGINEER_COACH_GIGACODE_PROJECTS: '/env/projects',
    })).toEqual([path.resolve('/explicit/projects')]);
  });

  it('supports environment-based GigaCode projects paths for non-interactive setup', () => {
    expect(getGigaCodeProjectsDirs({
      command: 'summary',
      harness: 'gigacode',
      format: 'text',
    }, {
      AI_ENGINEER_COACH_GIGACODE_PROJECTS: '/env/projects',
    })).toEqual([path.resolve('/env/projects')]);
  });

  it('can discover the GigaCode executable from PATH for diagnostics', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gigacode-path-test-'));
    const executable = path.join(root, process.platform === 'win32' ? 'gigacode.cmd' : 'gigacode');
    fs.writeFileSync(executable, '');
    fs.chmodSync(executable, 0o755);
    try {
      expect(findExecutableOnPath('gigacode', { PATH: root })).toBe(executable);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
