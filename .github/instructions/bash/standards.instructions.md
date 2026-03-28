---
applyTo: "**/*.sh,**/*.bash,**/scripts/**"
description: "Bash scripting standards — applied to all .sh and .bash files"
---

# Bash Standards

## Script Header (Required on every file)

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"
readonly LOG_FILE="${LOG_DIR:-/var/log}/${SCRIPT_NAME%.sh}.log"
```

- `set -e` exits on error, `set -u` on undefined var, `set -o pipefail` on pipe failure
- Always use `env bash` — never hardcode `/bin/bash`

## Logging Functions

```bash
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO]  $*" | tee -a "$LOG_FILE"; }
warn() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN]  $*" | tee -a "$LOG_FILE" >&2; }
err()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $*" | tee -a "$LOG_FILE" >&2; }
die()  { err "$*"; exit 1; }
```

## Argument Parsing

```bash
usage() { cat <<EOF
Usage: $SCRIPT_NAME [OPTIONS]
  -e, --env ENV       Target environment (dev|staging|prod)
  -s, --service SVC   Service name
  -d, --dry-run       Preview mode — no changes made
  -v, --verbose       Verbose output
  -h, --help          Show this help
EOF
}

DRY_RUN=false; VERBOSE=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -e|--env)     ENV="$2";     shift 2 ;;
    -s|--service) SERVICE="$2"; shift 2 ;;
    -d|--dry-run) DRY_RUN=true; shift   ;;
    -v|--verbose) VERBOSE=true; shift   ;;
    -h|--help)    usage; exit 0         ;;
    *)            die "Unknown option: $1" ;;
  esac
done
```

## Dry-Run Wrapper

```bash
run() {
  if [[ "$DRY_RUN" == true ]]; then
    echo "[DRY-RUN] $*"
  else
    "$@"
  fi
}
```

## Retry with Backoff

```bash
retry() {
  local -r retries=$1 delay=$2; shift 2
  local count=0
  until "$@"; do
    (( count++ ))
    (( count >= retries )) && die "Failed after $retries attempts: $*"
    warn "Attempt $count failed. Retrying in ${delay}s…"
    sleep "$delay"
  done
}
```

## Cleanup Trap

```bash
cleanup() { local ec=$?; log "Cleanup (exit: $ec)"; rm -f "$tmp_file"; exit "$ec"; }
trap cleanup EXIT INT TERM
tmp_file=$(mktemp /tmp/"${SCRIPT_NAME%.sh}".XXXXXX)
```

## Atomic File Writes

```bash
# Write to temp, then rename — prevents partial writes
tmp_out=$(mktemp)
generate_output > "$tmp_out"
mv "$tmp_out" /etc/app/config.conf
```

## Require Variables

```bash
require_vars() {
  local missing=()
  for var in "$@"; do
    [[ -v "$var" && -n "${!var}" ]] || missing+=("$var")
  done
  [[ ${#missing[@]} -eq 0 ]] || die "Missing vars: ${missing[*]}"
}
require_vars ENV SERVICE
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Local variables | `snake_case` | `config_file` |
| Global/readonly | `UPPER_SNAKE` | `LOG_FILE`, `SCRIPT_DIR` |
| Functions | `snake_case` | `require_vars`, `run` |
| Script files | `kebab-case.sh` | `deploy-service.sh` |

## Anti-patterns — never generate these

```bash
# ✗ Unquoted variable
rm -rf $DIR/*
# ✓
rm -rf "${DIR:?}/"*

# ✗ Parsing ls
for f in $(ls *.conf); do
# ✓
for f in *.conf; do

# ✗ Silent failure
command || true
# ✓
command || { warn "Failed, continuing intentionally"; }

# ✗ Hardcoded secret
DB_PASS="s3cr3t"
# ✓
DB_PASS="$(vault kv get -field=password secret/myservice)"

# ✗ /bin/bash shebang
#!/bin/bash
# ✓
#!/usr/bin/env bash
```
