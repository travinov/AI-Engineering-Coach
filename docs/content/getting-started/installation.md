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

For the VS Code dashboard path, see [VS Code Installation]({{< ref "getting-started/vscode-installation" >}}).

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
pwd
ls package.json
```

On Windows PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads\AI-Engineering-Coach-codex-standalone-cli"
Get-Location
Test-Path .\package.json
```

Run `npm install` only from the extracted project folder. If `npm install` fails with `ENOENT` and a path such as `/Users/<you>/package.json`, you are in the wrong directory. Find the extracted project and enter it first:

macOS / Linux / SberOS:

```bash
find "$HOME/Downloads" -maxdepth 2 -name package.json -path "*AI-Engineering-Coach*" -print
cd "$(dirname "$(find "$HOME/Downloads" -maxdepth 2 -name package.json -path "*AI-Engineering-Coach*" -print | head -1)")"
ls package.json
```

Windows PowerShell:

```powershell
Get-ChildItem "$env:USERPROFILE\Downloads" -Recurse -Depth 2 -Filter package.json |
  Where-Object { $_.FullName -like "*AI-Engineering-Coach*" } |
  Select-Object -First 1 -ExpandProperty DirectoryName |
  Set-Location
Test-Path .\package.json
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

If `npm install -g .` fails with `EACCES` or `permission denied`, the Node.js global prefix is probably a system directory. Do not use `sudo` on managed corporate machines unless your administrator explicitly requires it.

You can run the CLI directly from the extracted ZIP after `npm run build`:

macOS / Linux / SberOS:

```bash
node dist/cli.js summary --harness gigacode
node dist/cli.js summary --harness gigacode --path "$HOME/.gigacode/projects"
```

Windows PowerShell:

```powershell
node .\dist\cli.js summary --harness gigacode
node .\dist\cli.js summary --harness gigacode --path "$env:USERPROFILE\.gigacode\projects"
```

If you want the `ai-engineer-coach` command without administrator rights, install it into a user-owned npm prefix.

macOS / Linux / SberOS:

```bash
mkdir -p "$HOME/.local"
npm install -g . --prefix "$HOME/.local"
export PATH="$HOME/.local/bin:$PATH"
hash -r
ai-engineer-coach summary --harness gigacode
```

To keep the PATH update for future bash shells:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bash_profile"
```

For zsh:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
```

Windows PowerShell:

```powershell
npm install -g . --prefix "$env:USERPROFILE\.local"
$env:PATH="$env:USERPROFILE\.local;$env:PATH"
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
