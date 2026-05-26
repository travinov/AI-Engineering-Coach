#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Установка gigaCodeCLI для macOS.

Запускать из распакованного ZIP AI-Engineering-Coach:

  ./scripts/install-gigacodecli-macos.sh

Опции:
  --dashboard        После установки построить HTML-дашборд GigaCode
  --open             Открыть HTML-дашборд после генерации
  --path <dir>       Явный путь к каталогу проектов GigaCode
  --out <file>       Файл HTML-дашборда. По умолчанию: gigacode-dashboard.html
  --skip-npm-install Не запускать npm install, если зависимости уже установлены
  -h, --help         Показать справку

Примеры:
  ./scripts/install-gigacodecli-macos.sh
  ./scripts/install-gigacodecli-macos.sh --dashboard --open
  ./scripts/install-gigacodecli-macos.sh --dashboard --path "$HOME/.gigacode/projects" --out gigacode-dashboard.html
EOF
}

log() {
  printf '[gigaCodeCLI] %s\n' "$*"
}

fail() {
  printf '[gigaCodeCLI] Ошибка: %s\n' "$*" >&2
  exit 1
}

append_path_once() {
  local profile_file="$1"
  local path_line='export PATH="$HOME/.local/bin:$PATH"'

  touch "$profile_file"
  if grep -Fq "$path_line" "$profile_file"; then
    log "PATH уже настроен в $profile_file"
    return
  fi

  {
    printf '\n# AI Engineer Coach / gigaCodeCLI\n'
    printf '%s\n' "$path_line"
  } >> "$profile_file"
  log "Добавил PATH в $profile_file"
}

resolve_profile_file() {
  local shell_name
  shell_name="$(basename "${SHELL:-}")"

  case "$shell_name" in
    zsh) printf '%s\n' "$HOME/.zshrc" ;;
    bash) printf '%s\n' "$HOME/.bash_profile" ;;
    *) printf '%s\n' "$HOME/.zshrc" ;;
  esac
}

RUN_DASHBOARD=0
OPEN_DASHBOARD=0
GIGACODE_PATH=""
OUT_FILE="gigacode-dashboard.html"
SKIP_NPM_INSTALL=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dashboard)
      RUN_DASHBOARD=1
      shift
      ;;
    --open)
      OPEN_DASHBOARD=1
      RUN_DASHBOARD=1
      shift
      ;;
    --path)
      [[ $# -ge 2 ]] || fail "для --path нужен аргумент"
      GIGACODE_PATH="$2"
      shift 2
      ;;
    --out)
      [[ $# -ge 2 ]] || fail "для --out нужен аргумент"
      OUT_FILE="$2"
      shift 2
      ;;
    --skip-npm-install)
      SKIP_NPM_INSTALL=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "неизвестная опция: $1"
      ;;
  esac
done

[[ "$(uname -s)" == "Darwin" ]] || fail "этот скрипт предназначен только для macOS"

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd -P)"
cd "$REPO_ROOT"

[[ -f package.json ]] || fail "package.json не найден. Запустите скрипт из распакованной папки проекта"
command -v node >/dev/null 2>&1 || fail "node не найден в PATH"
command -v npm >/dev/null 2>&1 || fail "npm не найден в PATH"

PREFIX="$HOME/.local"
BIN_DIR="$PREFIX/bin"
AI_COACH_BIN="$BIN_DIR/ai-engineer-coach"
GIGACODE_BIN="$BIN_DIR/gigaCodeCLI"

log "Папка проекта: $REPO_ROOT"
log "Node: $(node --version)"
log "npm: $(npm --version)"

if [[ "$SKIP_NPM_INSTALL" -eq 0 ]]; then
  log "Устанавливаю npm-зависимости"
  npm install
else
  log "Пропускаю npm install"
fi

log "Собираю CLI"
npm run build

log "Устанавливаю CLI в пользовательский prefix: $PREFIX"
mkdir -p "$PREFIX" "$BIN_DIR"
npm install -g . --prefix "$PREFIX"

[[ -x "$AI_COACH_BIN" ]] || fail "после установки не найден $AI_COACH_BIN"
ln -sfn "$AI_COACH_BIN" "$GIGACODE_BIN"
chmod +x "$GIGACODE_BIN" 2>/dev/null || true

PROFILE_FILE="$(resolve_profile_file)"
append_path_once "$PROFILE_FILE"

export PATH="$BIN_DIR:$PATH"

log "Проверяю команду"
"$GIGACODE_BIN" --help >/dev/null

if [[ "$RUN_DASHBOARD" -eq 1 ]]; then
  dashboard_args=(dashboard --harness gigacode --out "$OUT_FILE")
  if [[ -n "$GIGACODE_PATH" ]]; then
    dashboard_args+=(--path "$GIGACODE_PATH")
  fi
  if [[ "$OPEN_DASHBOARD" -eq 1 ]]; then
    dashboard_args+=(--open)
  fi

  log "Строю HTML-дашборд"
  "$GIGACODE_BIN" "${dashboard_args[@]}"
fi

cat <<EOF

Готово.

Команда установлена:
  $GIGACODE_BIN

Для текущего терминала можно выполнить:
  export PATH="$BIN_DIR:\$PATH"

Для новых терминалов PATH добавлен в:
  $PROFILE_FILE

Проверка:
  gigaCodeCLI --help

Построить HTML-дашборд:
  gigaCodeCLI dashboard --harness gigacode --out gigacode-dashboard.html

Построить и открыть:
  gigaCodeCLI dashboard --harness gigacode --out gigacode-dashboard.html --open

EOF
