---
title: "Installation"
weight: 10
description: "Build and install the extension from source"
---

# Installation

The extension is not yet published on the VS Code Marketplace. Install it by building a `.vsix` package from source.

## Corporate Installation Overview

Corporate environments usually fall into one of two cases:

1. **GitHub ZIP is allowed and npm dependencies are available through a corporate registry or proxy.** Download the source ZIP, install dependencies, build, then install the CLI or VS Code extension.
2. **GitHub ZIP is allowed but npm dependency downloads are blocked.** Build the package on a machine with npm access, then transfer the generated `.tgz` for CLI installation or `.vsix` for VS Code installation.

The standalone CLI does not require VS Code. It only requires Node.js and access to local GigaCode session logs.

## Download the GitHub ZIP

Download the ZIP only after the branch or release you need has been pushed to GitHub. For the GigaCode standalone CLI branch, use:

```text
https://github.com/travinov/AI-Engineering-Coach/archive/refs/heads/codex/standalone-cli.zip
```

Unzip it, then open a terminal in the extracted directory. GitHub usually extracts this branch as:

```text
AI-Engineering-Coach-codex-standalone-cli
```

On macOS / Linux / SberOS:

```bash
cd ~/Downloads/AI-Engineering-Coach-codex-standalone-cli
```

On Windows PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads\AI-Engineering-Coach-codex-standalone-cli"
```

## Corporate CLI Install from Source ZIP

Use this path when the corporate machine can reach npm dependencies through an approved registry or proxy.

macOS / Linux / SberOS:

```bash
npm install
npm run build
npm install -g .
ai-engineer-coach summary --harness gigacode
```

Windows PowerShell:

```powershell
npm install
npm run build
npm install -g .
ai-engineer-coach summary --harness gigacode
```

If GigaCode stores logs in a non-standard location, pass the projects directory explicitly:

macOS / Linux / SberOS:

```bash
ai-engineer-coach summary --harness gigacode --path "$HOME/.gigacode/projects"
```

Windows PowerShell:

```powershell
ai-engineer-coach summary --harness gigacode --path "$env:USERPROFILE\.gigacode\projects"
```

For managed workstation images, prefer an environment variable so users do not need to pass `--path` each time:

macOS / Linux / SberOS:

```bash
export AI_ENGINEER_COACH_GIGACODE_PROJECTS="$HOME/.gigacode/projects"
ai-engineer-coach summary --harness gigacode
```

Windows PowerShell:

```powershell
$env:AI_ENGINEER_COACH_GIGACODE_PROJECTS="$env:USERPROFILE\.gigacode\projects"
ai-engineer-coach summary --harness gigacode
```

## Offline Corporate CLI Install

Use this path when the corporate machine cannot download npm dependencies.

On a build machine with npm access:

```bash
npm install
npm run build
npm pack
```

This creates:

```text
ai-engineer-coach-0.1.0.tgz
```

Transfer that `.tgz` to the corporate machine, then install it locally.

macOS / Linux / SberOS:

```bash
cd ~/Downloads
npm install -g ./ai-engineer-coach-0.1.0.tgz
ai-engineer-coach summary --harness gigacode
```

Windows PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads"
npm install -g .\ai-engineer-coach-0.1.0.tgz
ai-engineer-coach summary --harness gigacode
```

The `.tgz` package includes the built CLI entrypoint `dist/cli.js`, so the corporate machine does not need to run `npm install` against the internet.

## Corporate VS Code Extension Install

Use this only when you want the dashboard inside VS Code. The CLI path above does not require VS Code.

On a build machine with npm access:

```bash
npm install
npm run package
```

This creates:

```text
ai-engineer-coach-0.1.0.vsix
```

Transfer the `.vsix` to the corporate machine and install it.

macOS / Linux / SberOS:

```bash
code --install-extension ai-engineer-coach-0.1.0.vsix --force
```

Windows PowerShell:

```powershell
code --install-extension .\ai-engineer-coach-0.1.0.vsix --force
```

If the `code` command is not available, install through VS Code: Extensions panel, `...`, **Install from VSIX...**.

## Package from Source

```bash
git clone https://github.com/microsoft/ai-engineering-coach.git
cd ai-engineering-coach
npm install
npm run package
```

This produces a `.vsix` file in the project root.

## Install the .vsix

From the command line:

```bash
code --install-extension ai-engineer-coach-*.vsix
```

Or open the Extensions panel in VS Code, click the `...` menu, choose **Install from VSIX...**, and select the file.

## Development

To run the extension in development mode instead, use `npm run build` and press `F5` in VS Code to launch the Extension Development Host.

## Standalone CLI

The same package also builds a standalone Node.js CLI for environments where opening VS Code is not practical:

```bash
npm run build
node dist/cli.js summary --harness gigacode
```

To install the CLI command from a local checkout:

```bash
npm install -g .
ai-engineer-coach summary --harness gigacode
```

By default, the CLI reads GigaCode sessions from the standard projects directory:

| OS | Default GigaCode projects directory |
| --- | --- |
| macOS | `$HOME/.gigacode/projects` |
| Windows | `%USERPROFILE%\.gigacode\projects` |
| Linux / SberOS | `$HOME/.gigacode/projects` |

If the logs are stored elsewhere, pass the directory explicitly:

```bash
ai-engineer-coach summary --harness gigacode --path /path/to/.gigacode/projects
```

For non-interactive setup, use an environment variable:

```bash
AI_ENGINEER_COACH_GIGACODE_PROJECTS=/path/to/.gigacode/projects ai-engineer-coach summary --harness gigacode
```

The CLI can also find the `gigacode` executable in `PATH` for diagnostics, but analytics are based on the session log files, not on the executable path.

## Opening the Dashboard

After installation, open the Command Palette and run:

```
AI Engineer Coach: Open Dashboard
```

You can also click the AI Engineer Coach icon in the Activity Bar (sidebar) if it appears there.

## Configuration

AI Engineer Coach works out of the box with sensible defaults. Optional settings are available under `aiEngineerCoach.*` in VS Code settings to control cache behavior, date ranges, and workspace filtering.
