/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Session } from '../core/types';
import { Analyzer } from '../core/analyzer';
import { CliSummary, CliSummaryGroup, CliSummaryItem } from './summary';

interface ToolCard {
  title: string;
  metric: string;
  detail: string;
}

interface ToolSection {
  group: string;
  cards: ToolCard[];
}

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

function safeRead<T>(read: () => T, fallback: T): T {
  try {
    return read();
  } catch {
    return fallback;
  }
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

function latestDateLabel(value: number | null | undefined): string {
  return value ? new Date(value).toLocaleString() : 'нет данных';
}

function firstNonEmpty(values: string[]): string {
  return values.find(value => value.length > 0) || 'нет данных';
}

function topWorkType(sessions: Session[]): string {
  const counts = new Map<string, number>();
  for (const session of sessions) {
    for (const request of session.requests) {
      const key = request.workType || 'unknown';
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  const [name] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || ['нет данных', 0];
  return name;
}

function languageSummary(labels: string[], values: number[]): string {
  const top = labels
    .map((label, index) => ({ label, value: values[index] || 0 }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map(item => `${item.label}: ${formatNum(item.value)}`);
  return top.length > 0 ? top.join(', ') : 'языки не определены';
}

function dailyRows(labels: string[], requests: number[], sessions: number[], loc: number[]): string {
  if (labels.length === 0) return '<tr><td colspan="4" class="muted">Нет данных</td></tr>';
  return labels.slice(-14).map((label, index, sliced) => {
    const originalIndex = labels.length - sliced.length + index;
    return `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td>${formatNum(requests[originalIndex] || 0)}</td>
        <td>${formatNum(sessions[originalIndex] || 0)}</td>
        <td>${formatNum(loc[originalIndex] || 0)}</td>
      </tr>
    `;
  }).join('');
}

function toolCard(card: ToolCard): string {
  return `
    <article class="tool-card">
      <h3>${escapeHtml(card.title)}</h3>
      <div class="tool-metric">${escapeHtml(card.metric)}</div>
      <p>${escapeHtml(card.detail)}</p>
    </article>
  `;
}

function toolSections(sections: ToolSection[]): string {
  return sections.map(section => `
    <section class="tool-section">
      <h2>${escapeHtml(section.group)}</h2>
      <div class="tool-grid">${section.cards.map(toolCard).join('')}</div>
    </section>
  `).join('');
}

export function renderHtmlDashboard(summary: CliSummary, sessions: Session[]): string {
  const analyzer = new Analyzer(sessions);
  const stats = safeRead(() => analyzer.getStats(), {
    totalSessions: summary.totals.sessions,
    totalWorkspaces: summary.totals.workspaces,
    totalRequests: summary.totals.requests,
  });
  const daily = safeRead(() => analyzer.getDailyActivity(), {
    labels: [],
    values: [],
    loc: [],
    sessions: [],
    workspaces: [],
    byHarness: [],
  });
  const workspaceBreakdown = safeRead(() => analyzer.getWorkspaceBreakdown(), { labels: [], values: [] });
  const codeProduction = safeRead(() => analyzer.getCodeProduction(), {
    summary: { totalAiLoc: summary.totals.aiLinesOfCode, totalUserLoc: 0, totalLoc: summary.totals.aiLinesOfCode, aiBlocks: 0, userBlocks: 0, aiRatio: 0, locCost2010: 0, costPerLoc: 0 },
    byLanguage: { labels: [], aiLoc: [], userLoc: [] },
    dailyTimeline: { labels: [], aiLoc: [], userLoc: [] },
    byWorkspace: { labels: [], aiLoc: [], userLoc: [] },
    dailyByWorkspace: {},
    dailyByModel: {},
    dailyByHarness: {},
  });
  const antiPatterns = safeRead(() => analyzer.getAntiPatterns(), {
    patterns: [],
    totalOccurrences: 0,
    weeklyTrend: { labels: [], counts: [] },
    groupScores: [],
    weeklyScores: { labels: [], series: [] },
  });
  const workflows = safeRead(() => analyzer.getWorkflowOptimization(), {
    clusters: [],
    totalRepetitions: 0,
    estimatedTimeSavedMins: 0,
    topWorkspaces: [],
  });
  const configHealth = safeRead(() => analyzer.getConfigHealth(), {
    workspaces: [],
    overallScore: 0,
    agenticReadiness: { score: 0, signals: [] },
    contextProvisionByHarness: {},
    suggestions: [],
    contextAntiPatterns: [],
  });
  const flow = safeRead(() => analyzer.getFlowState(), {
    days: [],
    overallFlowScore: 0,
    avgFollowUpSec: 0,
    avgBlockMin: 0,
    deepFlowDays: 0,
    totalDays: 0,
    weeklyTrend: { labels: [], scores: [] },
    hourlyFlow: [],
    suggestions: [],
  });
  const images = safeRead(() => analyzer.getImageGallery(), {
    moments: [],
    stories: [],
    journeys: [],
    qualityFlags: [],
    summary: {
      totalImages: 0,
      totalMoments: 0,
      totalSessions: 0,
      avgImagesPerMoment: 0,
      topWorkspace: '',
      topModel: '',
      dateRange: '',
      dailyImages: [],
    },
  });
  const latestSession = [...sessions].sort((a, b) => (b.lastMessageDate || 0) - (a.lastMessageDate || 0))[0];
  const tokenTotal = summary.totals.promptTokens + summary.totals.completionTokens + summary.totals.cacheReadTokens;
  const toolGroups: ToolSection[] = [
    {
      group: 'Наблюдение',
      cards: [
        { title: 'Дашборд', metric: `${formatNum(stats.totalRequests)} запросов`, detail: `${formatNum(stats.totalSessions)} сессий, ${formatNum(stats.totalWorkspaces)} рабочих областей.` },
        { title: 'Таймлайн', metric: `${formatNum(sessions.length)} сессий`, detail: `Последняя активность: ${latestDateLabel(latestSession?.lastMessageDate)}.` },
        { title: 'Моменты кодинга', metric: `${formatNum(images.summary.totalImages)} изображений`, detail: `${formatNum(images.summary.totalMoments)} моментов, ${formatNum(images.summary.totalSessions)} сессий с изображениями.` },
      ],
    },
    {
      group: 'Метрики',
      cards: [
        { title: 'Результат', metric: `${formatNum(codeProduction.summary.totalAiLoc)} AI LoC`, detail: languageSummary(codeProduction.byLanguage.labels, codeProduction.byLanguage.aiLoc) },
        { title: 'Бюджет', metric: `${formatNum(tokenTotal)} токенов`, detail: 'Локальная оценка по token-данным, найденным в логах сессий.' },
        { title: 'Паттерны', metric: `${formatNum(daily.labels.length)} активных дней`, detail: `Топ рабочая область: ${firstNonEmpty(workspaceBreakdown.labels)}.` },
      ],
    },
    {
      group: 'Улучшение',
      cards: [
        { title: 'Антипаттерны', metric: `${formatNum(antiPatterns.patterns.length)} правил`, detail: `${formatNum(antiPatterns.totalOccurrences)} срабатываний по локальным логам.` },
        { title: 'Поиск навыков', metric: `${formatNum(workflows.clusters.length)} кластеров`, detail: `${formatNum(workflows.totalRepetitions)} повторов, оценка экономии ${formatNum(workflows.estimatedTimeSavedMins)} мин.` },
        { title: 'Качество контекста', metric: `${formatNum(configHealth.overallScore)}/100`, detail: `${formatNum(configHealth.workspaces.length)} рабочих областей проверено.` },
        { title: 'Rule Editor', metric: `${formatNum(antiPatterns.patterns.length)} правил`, detail: 'Редактирование правил остается в VS Code, HTML показывает результаты анализа.' },
        { title: 'Rule Playground', metric: `${formatNum(summary.totals.requests)} записей`, detail: 'DSL playground остается интерактивным инструментом VS Code.' },
        { title: 'Data Explorer', metric: `${formatNum(summary.totals.requests)} запросов`, detail: 'В HTML вынесены ключевые поля: harness, workspace, tools, files, models.' },
      ],
    },
    {
      group: 'Развитие',
      cards: [
        { title: 'Learning Center', metric: `${formatNum(summary.models.length)} моделей`, detail: 'Материал для обучения строится по реальному использованию моделей и prompt.' },
        { title: 'Achievements', metric: `${formatNum(flow.overallFlowScore)}/100 flow`, detail: `${formatNum(flow.deepFlowDays)} deep-flow дней из ${formatNum(flow.totalDays)}.` },
        { title: 'Agentic SDLC', metric: topWorkType(sessions), detail: 'Доминирующий тип работы по классификации запросов.' },
        { title: 'Share', metric: `${formatNum(summary.totals.sessions)} / ${formatNum(summary.totals.requests)}`, detail: 'Сводные цифры можно использовать для карточки статистики.' },
      ],
    },
  ];
  const data = {
    summary,
    modules: toolGroups,
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
    .tool-section {
      margin-bottom: 14px;
    }
    .tool-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
    }
    .tool-card {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 14px;
      background: #fcfdff;
    }
    .tool-card h3 {
      margin: 0;
      font-size: 14px;
    }
    .tool-card p {
      margin: 7px 0 0;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.45;
    }
    .tool-metric {
      margin-top: 8px;
      font-size: 22px;
      font-weight: 700;
      color: var(--accent);
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

    ${toolSections(toolGroups)}

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
      <h2>Активность по дням</h2>
      <table>
        <thead><tr><th>Дата</th><th>Запросы</th><th>Сессии</th><th>AI LoC</th></tr></thead>
        <tbody>${dailyRows(daily.labels, daily.values, daily.sessions, daily.loc)}</tbody>
      </table>
    </section>

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
