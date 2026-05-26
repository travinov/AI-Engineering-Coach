# Установка команды gigaCodeCLI и просмотр HTML-дашборда

Инструкция рассчитана на корпоративную установку из ZIP без использования Git.

## 1. Скачать ZIP

Скачайте ZIP ветки с русской корпоративной сборкой:

```text
https://github.com/travinov/AI-Engineering-Coach/archive/refs/heads/codex/russian-localization.zip
```

Распакуйте архив. Обычно GitHub создает папку:

```text
AI-Engineering-Coach-codex-russian-localization
```

## 2. Перейти в папку проекта

macOS / Linux / SberOS:

```bash
cd ~/Downloads/AI-Engineering-Coach-codex-russian-localization
ls package.json
```

Windows PowerShell:

```powershell
cd "$env:USERPROFILE\Downloads\AI-Engineering-Coach-codex-russian-localization"
Test-Path .\package.json
```

Если `package.json` не найден, значит терминал открыт не в папке проекта.

## 3. Установить зависимости и собрать CLI

```bash
npm install
npm run build
```

## 4. Установить команду gigaCodeCLI без прав администратора

### macOS / Linux / SberOS

```bash
mkdir -p "$HOME/.local"
npm install -g . --prefix "$HOME/.local"

mkdir -p "$HOME/.local/bin"
ln -sfn "$HOME/.local/bin/ai-engineer-coach" "$HOME/.local/bin/gigaCodeCLI"

export PATH="$HOME/.local/bin:$PATH"
hash -r
```

Чтобы PATH сохранялся для новых терминалов в bash:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bash_profile
```

Если используется zsh:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

### Windows PowerShell

```powershell
npm install -g . --prefix "$env:USERPROFILE\.local"

$bin = "$env:USERPROFILE\.local"
New-Item -ItemType File -Path "$bin\gigaCodeCLI.cmd" -Force -Value "@echo off`r`nnode `"$bin\node_modules\ai-engineer-coach\dist\cli.js`" %*`r`n"

$env:PATH="$bin;$env:PATH"
```

## 5. Проверить команду

```bash
gigaCodeCLI --help
```

Ожидаемый результат: русская справка CLI.

## 6. Построить HTML-дашборд по GigaCode

Стандартный запуск:

```bash
gigaCodeCLI dashboard --harness gigacode --out gigacode-dashboard.html
```

Если логи GigaCode лежат не в стандартном месте:

macOS / Linux / SberOS:

```bash
gigaCodeCLI dashboard --harness gigacode --path "$HOME/.gigacode/projects" --out gigacode-dashboard.html
```

Windows PowerShell:

```powershell
gigaCodeCLI dashboard --harness gigacode --path "$env:USERPROFILE\.gigacode\projects" --out gigacode-dashboard.html
```

## 7. Открыть HTML-дашборд

macOS:

```bash
open gigacode-dashboard.html
```

Linux / SberOS:

```bash
xdg-open gigacode-dashboard.html
```

Windows PowerShell:

```powershell
start .\gigacode-dashboard.html
```

Можно сразу с автооткрытием:

```bash
gigaCodeCLI dashboard --harness gigacode --out gigacode-dashboard.html --open
```

## Диагностика

Если команда не найдена:

macOS / Linux / SberOS:

```bash
echo "$PATH"
ls -l "$HOME/.local/bin/gigaCodeCLI"
```

Windows PowerShell:

```powershell
$env:PATH
Test-Path "$env:USERPROFILE\.local\gigaCodeCLI.cmd"
```

Если `npm install` падает с `ENOENT` и сообщает, что не найден `package.json`, перейдите в распакованную папку проекта и повторите команду.

Если `npm install -g .` падает с `EACCES` или `permission denied`, используйте установку через `--prefix "$HOME/.local"` или `--prefix "$env:USERPROFILE\.local"`, как показано выше.
