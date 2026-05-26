/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from '../core/types';

export type CliOutputFormat = 'text' | 'json' | 'markdown';

export interface CliSummaryItem {
  name: string;
  count: number;
}

export interface CliSummaryGroup {
  name: string;
  sessions: number;
  requests: number;
}

export interface CliSummary {
  generatedAt: string;
  totals: {
    sessions: number;
    requests: number;
    workspaces: number;
    editedFiles: number;
    tools: number;
    promptTokens: number;
    completionTokens: number;
    cacheReadTokens: number;
    aiLinesOfCode: number;
  };
  byHarness: CliSummaryGroup[];
  topWorkspaces: CliSummaryGroup[];
  topTools: CliSummaryItem[];
  topEditedFiles: CliSummaryItem[];
  models: CliSummaryItem[];
}

function addCount(map: Map<string, number>, key: string, increment = 1): void {
  if (!key) return;
  map.set(key, (map.get(key) || 0) + increment);
}

function sortedItems(map: Map<string, number>, limit: number): CliSummaryItem[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function sortedGroups(map: Map<string, CliSummaryGroup>, limit: number): CliSummaryGroup[] {
  return [...map.values()]
    .sort((a, b) => b.requests - a.requests || b.sessions - a.sessions)
    .slice(0, limit);
}

function addGroup(map: Map<string, CliSummaryGroup>, name: string, sessionRequests: number): void {
  const group = map.get(name) || { name, sessions: 0, requests: 0 };
  group.sessions += 1;
  group.requests += sessionRequests;
  map.set(name, group);
}

function sumNullable(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function summarizeSessions(sessions: Session[], limit = 10): CliSummary {
  const workspaceIds = new Set<string>();
  const editedFiles = new Set<string>();
  const tools = new Map<string, number>();
  const editedFileCounts = new Map<string, number>();
  const models = new Map<string, number>();
  const byHarness = new Map<string, CliSummaryGroup>();
  const byWorkspace = new Map<string, CliSummaryGroup>();

  let requests = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let cacheReadTokens = 0;
  let aiLinesOfCode = 0;

  for (const session of sessions) {
    workspaceIds.add(session.workspaceId);
    addGroup(byHarness, session.harness || 'Unknown', session.requests.length);
    addGroup(byWorkspace, session.workspaceName || 'Unknown', session.requests.length);
    requests += session.requests.length;

    for (const request of session.requests) {
      promptTokens += sumNullable(request.promptTokens);
      completionTokens += sumNullable(request.completionTokens);
      cacheReadTokens += sumNullable(request.cacheReadTokens);
      if (request.modelId) addCount(models, request.modelId);

      for (const tool of request.toolsUsed) addCount(tools, tool);
      for (const file of request.editedFiles) {
        editedFiles.add(file);
        addCount(editedFileCounts, file);
      }
      for (const block of request.aiCode) {
        aiLinesOfCode += block.loc;
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      sessions: sessions.length,
      requests,
      workspaces: workspaceIds.size,
      editedFiles: editedFiles.size,
      tools: [...tools.values()].reduce((sum, count) => sum + count, 0),
      promptTokens,
      completionTokens,
      cacheReadTokens,
      aiLinesOfCode,
    },
    byHarness: sortedGroups(byHarness, limit),
    topWorkspaces: sortedGroups(byWorkspace, limit),
    topTools: sortedItems(tools, limit),
    topEditedFiles: sortedItems(editedFileCounts, limit),
    models: sortedItems(models, limit),
  };
}

function formatGroupLines(groups: CliSummaryGroup[]): string[] {
  return groups.map(group => `  ${group.name}: ${group.sessions} сессий, ${group.requests} запросов`);
}

function formatItemLines(items: CliSummaryItem[]): string[] {
  return items.map(item => `  ${item.name}: ${item.count}`);
}

export function formatTextSummary(summary: CliSummary): string {
  const lines = [
    'Сводка AI Engineer Coach CLI',
    '',
    `Сформировано: ${summary.generatedAt}`,
    `Сессии: ${summary.totals.sessions}`,
    `Запросы: ${summary.totals.requests}`,
    `Рабочие области: ${summary.totals.workspaces}`,
    `Измененные файлы: ${summary.totals.editedFiles}`,
    `Вызовы инструментов: ${summary.totals.tools}`,
    `Строки кода от AI: ${summary.totals.aiLinesOfCode}`,
    `Токены prompt: ${summary.totals.promptTokens}`,
    `Токены completion: ${summary.totals.completionTokens}`,
    `Токены cache read: ${summary.totals.cacheReadTokens}`,
    '',
    'По harness:',
    ...formatGroupLines(summary.byHarness),
    '',
    'Топ рабочих областей:',
    ...formatGroupLines(summary.topWorkspaces),
    '',
    'Топ инструментов:',
    ...(summary.topTools.length > 0 ? formatItemLines(summary.topTools) : ['  нет данных']),
    '',
    'Топ измененных файлов:',
    ...(summary.topEditedFiles.length > 0 ? formatItemLines(summary.topEditedFiles) : ['  нет данных']),
  ];
  return `${lines.join('\n')}\n`;
}

function markdownGroupRows(groups: CliSummaryGroup[]): string[] {
  return groups.map(group => `| ${group.name} | ${group.sessions} | ${group.requests} |`);
}

function markdownItemRows(items: CliSummaryItem[]): string[] {
  return items.map(item => `| ${item.name} | ${item.count} |`);
}

export function formatMarkdownSummary(summary: CliSummary): string {
  const rows = [
    '# Сводка AI Engineer Coach CLI',
    '',
    `Сформировано: ${summary.generatedAt}`,
    '',
    '| Метрика | Значение |',
    '| --- | ---: |',
    `| Сессии | ${summary.totals.sessions} |`,
    `| Запросы | ${summary.totals.requests} |`,
    `| Рабочие области | ${summary.totals.workspaces} |`,
    `| Измененные файлы | ${summary.totals.editedFiles} |`,
    `| Вызовы инструментов | ${summary.totals.tools} |`,
    `| Строки кода от AI | ${summary.totals.aiLinesOfCode} |`,
    `| Токены prompt | ${summary.totals.promptTokens} |`,
    `| Токены completion | ${summary.totals.completionTokens} |`,
    `| Токены cache read | ${summary.totals.cacheReadTokens} |`,
    '',
    '## По Harness',
    '',
    '| Harness | Сессии | Запросы |',
    '| --- | ---: | ---: |',
    ...markdownGroupRows(summary.byHarness),
    '',
    '## Топ Рабочих Областей',
    '',
    '| Рабочая область | Сессии | Запросы |',
    '| --- | ---: | ---: |',
    ...markdownGroupRows(summary.topWorkspaces),
    '',
    '## Топ Инструментов',
    '',
    '| Инструмент | Количество |',
    '| --- | ---: |',
    ...markdownItemRows(summary.topTools),
  ];
  return `${rows.join('\n')}\n`;
}

export function formatCliSummary(summary: CliSummary, format: CliOutputFormat): string {
  if (format === 'json') return `${JSON.stringify(summary, null, 2)}\n`;
  if (format === 'markdown') return formatMarkdownSummary(summary);
  return formatTextSummary(summary);
}
