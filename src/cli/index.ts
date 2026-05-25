/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as fs from 'fs';
import * as path from 'path';
import { loadCliSessions } from './load';
import { findExecutableOnPath, getGigaCodeProjectsDirs, HELP_TEXT, parseCliArgs } from './options';
import { formatCliSummary, summarizeSessions } from './summary';

function writeOutput(output: string, outFile: string | undefined): void {
  if (!outFile) {
    process.stdout.write(output);
    return;
  }
  const resolved = path.resolve(outFile);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, output, 'utf-8');
  process.stderr.write(`Wrote ${resolved}\n`);
}

function writeGigaCodeDiagnostics(sessionsCount: number, explicitPath: boolean): void {
  if (sessionsCount > 0 || explicitPath) return;

  const projectsDirs = getGigaCodeProjectsDirs({
    command: 'summary',
    harness: 'gigacode',
    format: 'text',
  });
  const executable = findExecutableOnPath('gigacode');
  const dirs = projectsDirs.length > 0 ? projectsDirs.join(', ') : '~/.gigacode/projects';
  const executableLine = executable ? `Found gigacode executable: ${executable}` : 'gigacode executable was not found in PATH.';
  process.stderr.write([
    'No GigaCode sessions were found.',
    `Checked projects directory: ${dirs}`,
    executableLine,
    'Use --path <dir> or AI_ENGINEER_COACH_GIGACODE_PROJECTS=<dir> if logs are stored elsewhere.',
    '',
  ].join('\n'));
}

export function main(argv = process.argv.slice(2)): number {
  try {
    const options = parseCliArgs(argv);
    if (options.help) {
      process.stdout.write(HELP_TEXT);
      return 0;
    }

    const sessions = loadCliSessions(options);
    const summary = summarizeSessions(sessions);
    const output = formatCliSummary(summary, options.format);
    writeOutput(output, options.outFile);

    if (options.harness === 'gigacode') {
      const explicitPath = Boolean(options.gigacodeProjectsPath || process.env.AI_ENGINEER_COACH_GIGACODE_PROJECTS);
      writeGigaCodeDiagnostics(sessions.length, explicitPath);
    }
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n${HELP_TEXT}`);
    return 1;
  }
}

if (require.main === module) {
  process.exitCode = main();
}
