/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as path from 'path';
import * as fs from 'fs';
import { findGigaCodeDirs } from '../core/parser-gigacode';
import { CliOutputFormat } from './summary';

export type CliCommand = 'summary' | 'export' | 'dashboard';
export type CliHarness = 'gigacode' | 'all';

export interface CliOptions {
  command: CliCommand;
  harness: CliHarness;
  format: CliOutputFormat;
  outFile?: string;
  gigacodeProjectsPath?: string;
  open?: boolean;
  help?: boolean;
}

const COMMANDS = new Set(['summary', 'export', 'dashboard']);
const HARNESSES = new Set(['gigacode', 'all']);
const FORMATS = new Set(['text', 'json', 'markdown']);

export const HELP_TEXT = `AI Engineer Coach CLI

Usage:
  ai-engineer-coach [summary|export|dashboard] [options]

Options:
  --harness <gigacode|all>   Harness to analyze. Default: gigacode
  --format <text|json|markdown>
                             Output format. Default: text
  --out <file>               Write output to a file instead of stdout
  --path <dir>               GigaCode projects directory, e.g. ~/.gigacode/projects
  --open                     Open generated dashboard HTML in the default browser
  --help                     Show this help

Environment:
  AI_ENGINEER_COACH_GIGACODE_PROJECTS
                             Default GigaCode projects directory for non-interactive setup
`;

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
  return value;
}

function parseCommand(value: string | undefined): CliCommand {
  if (!value || value.startsWith('--')) return 'summary';
  if (COMMANDS.has(value)) return value as CliCommand;
  throw new Error(`Unknown command: ${value}`);
}

export function parseCliArgs(args: string[]): CliOptions {
  const command = parseCommand(args[0]);
  const options: CliOptions = {
    command,
    harness: 'gigacode',
    format: 'text',
  };
  const startIndex = args[0] && !args[0].startsWith('--') ? 1 : 0;

  for (let i = startIndex; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--harness') {
      const value = readValue(args, i, arg);
      if (!HARNESSES.has(value)) throw new Error(`Unsupported harness: ${value}`);
      options.harness = value as CliHarness;
      i++;
    } else if (arg === '--format') {
      const value = readValue(args, i, arg);
      if (!FORMATS.has(value)) throw new Error(`Unsupported format: ${value}`);
      options.format = value as CliOutputFormat;
      i++;
    } else if (arg === '--out') {
      options.outFile = readValue(args, i, arg);
      i++;
    } else if (arg === '--path') {
      options.gigacodeProjectsPath = readValue(args, i, arg);
      i++;
    } else if (arg === '--open') {
      options.open = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

export function getGigaCodeProjectsDirs(options: CliOptions, env: NodeJS.ProcessEnv = process.env): string[] {
  const configuredPath = options.gigacodeProjectsPath || env.AI_ENGINEER_COACH_GIGACODE_PROJECTS;
  if (configuredPath) return [path.resolve(configuredPath)];
  return findGigaCodeDirs();
}

export function findExecutableOnPath(command: string, env: NodeJS.ProcessEnv = process.env): string | null {
  const pathValue = env.PATH || env.Path || '';
  if (!pathValue) return null;
  const extensions = process.platform === 'win32'
    ? (env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(';').filter(Boolean)
    : [''];

  for (const dir of pathValue.split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of extensions) {
      const candidate = path.join(dir, process.platform === 'win32' && !command.toLowerCase().endsWith(ext.toLowerCase()) ? `${command}${ext.toLowerCase()}` : command);
      try {
        fs.accessSync(candidate, process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK);
        return candidate;
      } catch {
        // Keep looking.
      }
    }
  }
  return null;
}
