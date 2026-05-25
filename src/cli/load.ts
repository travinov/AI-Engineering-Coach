/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { findLogsDirs, parseAllLogs } from '../core/parser';
import { parseGigaCodeSessions } from '../core/parser-gigacode';
import { Session } from '../core/types';
import { CliOptions, getGigaCodeProjectsDirs } from './options';

export function loadCliSessions(options: CliOptions): Session[] {
  if (options.harness === 'all') {
    return parseAllLogs(findLogsDirs()).sessions;
  }

  const sessions: Session[] = [];
  for (const dir of getGigaCodeProjectsDirs(options)) {
    sessions.push(...parseGigaCodeSessions(dir));
  }
  return sessions;
}
