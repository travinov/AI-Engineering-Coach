<h1 align="center">AI Engineer Coach</h1>

<p align="center">
Анализ использования AI-ассистентов для разработки: VS Code, GitHub Copilot for Xcode, Claude, Codex, OpenCode, GigaCode и GitHub Copilot CLI.
</p>

<p align="center">
<a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
<img alt="VS Code 1.115+" src="https://img.shields.io/badge/VS%20Code-1.115%2B-007ACC">
</p>

## Русская корпоративная сборка

Эта ветка собирает расширение с русским интерфейсом по умолчанию. Переключателя языка нет: после установки `.vsix` команды, навигация, основные экраны и CLI/HTML dashboard отображаются на русском.

Расширение работает локально: читает файлы сессий, строит аналитику на машине пользователя и не отправляет телеметрию.

## Основные разделы

Интерфейс сгруппирован в три блока: **Наблюдение**, **Метрики** и **Улучшение**.

### Наблюдение

| Страница | Что показывает |
| --- | --- |
| **Дашборд** | Сводные показатели практик, дневную активность, разбивку по harness и топ рабочих областей |
| **Таймлайн** | Хронологию сессий, детализацию по дням, пересечения сессий и список для поиска |
| **Моменты кодинга** | Галерею скриншотов AI-сессий с фильтрацией по рабочим областям |

### Метрики

| Страница | Что показывает |
| --- | --- |
| **Результат** | Объем сгенерированного кода по языкам, рабочим областям, моделям и harness |
| **Бюджет** | Месячное потребление token budget и прогноз *(раздел может быть временно скрыт)* |
| **Паттерны** | Тепловую карту активности 7x24 и сигналы баланса рабочего времени |

### Улучшение

| Страница | Что показывает |
| --- | --- |
| **Антипаттерны** | Карточки практик, severity, конкретные действия и примеры prompt |
| **Поиск навыков** | Повторяющиеся prompt-паттерны, которые можно вынести в reusable skills |
| **Качество контекста** | Общий context score, readiness checklist и карту рабочих областей |
| **Rule Editor** | Создание и настройку правил детекции |
| **Rule Playground** | Интерактивную проверку DSL правил |
| **Data Explorer** | Просмотр полей сессий, распределений и ad-hoc фильтров |

### Развитие

| Страница | Что показывает |
| --- | --- |
| **Learning Center** | Персональные задания и сравнение кода по реальному использованию |
| **Achievements** | Прогресс XP и уровни Bronze, Silver, Gold, Diamond |
| **Agentic SDLC** | Как AI используется на этапах жизненного цикла разработки |
| **Share** | Генерацию карточки со статистикой |

## Поддерживаемые harness

| Harness | Расположение по умолчанию |
| --- | --- |
| **Local Agent** | macOS: `~/Library/Application Support/Code/User/workspaceStorage/`<br>Linux: `~/.config/Code/User/workspaceStorage/`<br>Windows: `%APPDATA%\Code\User\workspaceStorage\` |
| **Local Agent (Insiders)** | macOS: `~/Library/Application Support/Code - Insiders/User/workspaceStorage/`<br>Linux: `~/.config/Code - Insiders/User/workspaceStorage/`<br>Windows: `%APPDATA%\Code - Insiders\User\workspaceStorage\` |
| **Xcode Copilot Chat** | `~/.config/github-copilot/xcode/` (нужен `sqlite3`) |
| **Claude** | macOS/Linux: `~/.claude/projects/`<br>Windows: `%USERPROFILE%\.claude\projects\` |
| **Codex** | macOS/Linux: `~/.codex/sessions/`<br>Windows: `%USERPROFILE%\.codex\sessions\` |
| **OpenCode** | macOS/Linux: `~/.local/share/opencode/`<br>Windows: `%USERPROFILE%\.local\share\opencode\` |
| **GigaCode** | macOS/Linux: `~/.gigacode/projects/*/chats/*.jsonl` |
| **GitHub Copilot CLI** | `~/.copilot/session-state/` и `~/.copilot/history-session-state/` |

## Быстрый старт

1. Откройте Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`).
2. Запустите **AI Engineer Coach: Открыть дашборд**.
3. Используйте боковую навигацию. Фильтры рабочей области и harness находятся внизу sidebar.
4. Запустите **AI Engineer Coach: Обновить данные**, чтобы перечитать логи после новых сессий.

## Лицензия

[MIT](LICENSE)

## Disclaimer

Проект является open-source инициативой сотрудников Microsoft. Это не официальный продукт Microsoft, не часть сервиса или support offering Microsoft. Поставляется as-is, без гарантий.
