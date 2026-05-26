/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from '../core/types';
import { CliSummary, CliSummaryGroup, CliSummaryItem } from './summary';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNum(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, null, 2)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function groupRows(groups: CliSummaryGroup[]): string {
  if (groups.length === 0) return '<tr><td colspan="3" class="muted">Нет данных</td></tr>';
  return groups.map(group => `
    <tr>
      <td>${escapeHtml(group.name)}</td>
      <td>${formatNum(group.sessions)}</td>
      <td>${formatNum(group.requests)}</td>
    </tr>
  `).join('');
}

function itemRows(items: CliSummaryItem[]): string {
  if (items.length === 0) return '<tr><td colspan="2" class="muted">Нет данных</td></tr>';
  return items.map(item => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td>${formatNum(item.count)}</td>
    </tr>
  `).join('');
}

function recentSessionRows(sessions: Session[]): string {
  const recent = [...sessions]
    .sort((a, b) => (b.lastMessageDate || 0) - (a.lastMessageDate || 0))
    .slice(0, 25);

  if (recent.length === 0) return '<tr><td colspan="5" class="muted">Сессии не найдены</td></tr>';
  return recent.map(session => {
    const firstRequest = session.requests[0];
    const date = session.lastMessageDate ? new Date(session.lastMessageDate).toLocaleString() : '';
    const firstMessage = firstRequest?.messageText || '';
    return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>${escapeHtml(session.harness)}</td>
        <td>${escapeHtml(session.workspaceName)}</td>
        <td>${formatNum(session.requests.length)}</td>
        <td>${escapeHtml(firstMessage.slice(0, 180))}</td>
      </tr>
    `;
  }).join('');
}

function statCard(label: string, value: number): string {
  return `
    <div class="stat-card">
      <div class="stat-value">${formatNum(value)}</div>
      <div class="stat-label">${escapeHtml(label)}</div>
    </div>
  `;
}

export function renderHtmlDashboard(summary: CliSummary, sessions: Session[]): string {
  const data = {
    summary,
    sessions: sessions.map(session => ({
      sessionId: session.sessionId,
      workspaceName: session.workspaceName,
      harness: session.harness,
      requestCount: session.requests.length,
      creationDate: session.creationDate,
      lastMessageDate: session.lastMessageDate,
    })),
  };

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Дашборд AI Engineer Coach</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #17202a;
      --muted: #667085;
      --line: #d9dee7;
      --accent: #2563eb;
      --accent-soft: #e8f0ff;
    }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--bg);
      color: var(--text);
    }
    main {
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: flex-end;
      margin-bottom: 22px;
    }
    h1 {
      margin: 0;
      font-size: 28px;
      letter-spacing: 0;
    }
    h2 {
      margin: 0 0 12px;
      font-size: 17px;
    }
    .subtitle {
      margin-top: 6px;
      color: var(--muted);
      font-size: 13px;
    }
    .generated {
      color: var(--muted);
      font-size: 12px;
      white-space: nowrap;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin-bottom: 18px;
    }
    .stat-card, section {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
    }
    .stat-card {
      padding: 16px;
    }
    .stat-value {
      font-size: 27px;
      font-weight: 700;
      color: var(--accent);
    }
    .stat-label {
      margin-top: 4px;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 14px;
      margin-bottom: 14px;
    }
    section {
      padding: 16px;
      overflow: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 9px 8px;
      border-bottom: 1px solid var(--line);
      text-align: left;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-size: 11px;
      text-transform: uppercase;
      background: #fafbfc;
    }
    .muted {
      color: var(--muted);
    }
    .wide {
      margin-bottom: 14px;
    }
    .pill {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Дашборд AI Engineer Coach</h1>
        <div class="subtitle">
          <span class="pill">${summary.byHarness.map(h => escapeHtml(h.name)).join('</span><span class="pill">') || 'Нет данных по harness'}</span>
          Локальный HTML-отчет по разобранным логам сессий.
        </div>
      </div>
      <div class="generated">Сформировано: ${escapeHtml(summary.generatedAt)}</div>
    </header>

    <div class="stats">
      ${statCard('Сессии', summary.totals.sessions)}
      ${statCard('Запросы', summary.totals.requests)}
      ${statCard('Рабочие области', summary.totals.workspaces)}
      ${statCard('Измененные файлы', summary.totals.editedFiles)}
      ${statCard('Вызовы инструментов', summary.totals.tools)}
      ${statCard('Строки кода от AI', summary.totals.aiLinesOfCode)}
      ${statCard('Токены prompt', summary.totals.promptTokens)}
      ${statCard('Токены completion', summary.totals.completionTokens)}
    </div>

    <div class="grid">
      <section>
        <h2>По Harness</h2>
        <table>
          <thead><tr><th>Harness</th><th>Сессии</th><th>Запросы</th></tr></thead>
          <tbody>${groupRows(summary.byHarness)}</tbody>
        </table>
      </section>
      <section>
        <h2>Топ рабочих областей</h2>
        <table>
          <thead><tr><th>Рабочая область</th><th>Сессии</th><th>Запросы</th></tr></thead>
          <tbody>${groupRows(summary.topWorkspaces)}</tbody>
        </table>
      </section>
      <section>
        <h2>Топ инструментов</h2>
        <table>
          <thead><tr><th>Инструмент</th><th>Вызовы</th></tr></thead>
          <tbody>${itemRows(summary.topTools)}</tbody>
        </table>
      </section>
      <section>
        <h2>Топ измененных файлов</h2>
        <table>
          <thead><tr><th>Файл</th><th>Правки</th></tr></thead>
          <tbody>${itemRows(summary.topEditedFiles)}</tbody>
        </table>
      </section>
      <section>
        <h2>Модели</h2>
        <table>
          <thead><tr><th>Модель</th><th>Запросы</th></tr></thead>
          <tbody>${itemRows(summary.models)}</tbody>
        </table>
      </section>
    </div>

    <section class="wide">
      <h2>Последние сессии</h2>
      <table>
        <thead><tr><th>Последняя активность</th><th>Harness</th><th>Рабочая область</th><th>Запросы</th><th>Первый prompt</th></tr></thead>
        <tbody>${recentSessionRows(sessions)}</tbody>
      </table>
    </section>
  </main>
  <script id="dashboard-data" type="application/json">${safeJson(data)}</script>
</body>
</html>
`;
}
