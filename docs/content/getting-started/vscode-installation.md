---
title: "VS Code Installation"
weight: 15
description: "Install AI Engineer Coach as a VS Code extension"
---

# VS Code Installation

Use this path when you need the interactive dashboard inside VS Code. If you only need terminal output, use the standalone CLI instead.

## What You Need

- VS Code 1.85 or later.
- Node.js and npm on the machine that builds the `.vsix`.
- Access to the local session logs you want to analyze, for example `~/.gigacode/projects` for GigaCode.

The VS Code extension is read-only. It scans local log files and renders the dashboard inside VS Code.

## Option 1: Build from GitHub ZIP

Use this when the corporate machine can download npm dependencies through an approved registry or proxy.

Download the branch ZIP:

```text
https://github.com/travinov/AI-Engineering-Coach/archive/refs/heads/codex/standalone-cli.zip
```

Unzip it and open a terminal in the extracted folder.

macOS / Linux / SberOS:

```bash
cd ~/Downloads/AI-Engineering-Coach-codex-standalone-cli
npm install
npm run package
```

Windows PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads\AI-Engineering-Coach-codex-standalone-cli"
npm install
npm run package
```

This creates:

```text
ai-engineer-coach-0.1.0.vsix
```

## Option 2: Offline VSIX Transfer

Use this when the corporate machine cannot download npm dependencies.

On a build machine with npm access:

```bash
npm install
npm run package
```

Transfer this file to the corporate machine:

```text
ai-engineer-coach-0.1.0.vsix
```

The corporate machine does not need to run `npm install` for this option.

## Install the VSIX

If the `code` command is available:

macOS / Linux / SberOS:

```bash
code --install-extension ai-engineer-coach-0.1.0.vsix --force
```

Windows PowerShell:

```powershell
code --install-extension .\ai-engineer-coach-0.1.0.vsix --force
```

If `code` is not available, install through the VS Code UI:

1. Open VS Code.
2. Open the Extensions panel.
3. Click the `...` menu.
4. Choose **Install from VSIX...**.
5. Select `ai-engineer-coach-0.1.0.vsix`.

## Open the Dashboard

After installation:

1. Open VS Code.
2. Open the Command Palette:
   - macOS: `Cmd+Shift+P`
   - Windows / Linux / SberOS: `Ctrl+Shift+P`
3. Run **AI Engineer Coach: Open Dashboard**.
4. If new sessions are created after the dashboard opens, run **AI Engineer Coach: Reload Data**.

## GigaCode Logs

For GigaCode analytics, the extension looks for:

| OS | Default GigaCode projects directory |
| --- | --- |
| macOS | `$HOME/.gigacode/projects` |
| Windows | `%USERPROFILE%\.gigacode\projects` |
| Linux / SberOS | `$HOME/.gigacode/projects` |

The extension does not need the path to the `gigacode` executable. It reads the JSONL session logs produced by GigaCode.

## Verify Installation

From a terminal:

```bash
code --list-extensions --show-versions | grep -i ai-engineer
```

Windows PowerShell:

```powershell
code --list-extensions --show-versions | Select-String -Pattern "ai-engineer"
```

Expected result:

```text
ai-engineer-coach.ai-engineer-coach@0.1.0
```

## When to Use CLI Instead

Use the standalone CLI when VS Code is not available or when you only need a terminal report:

```bash
node dist/cli.js summary --harness gigacode
```
