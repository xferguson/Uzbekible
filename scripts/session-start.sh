#!/usr/bin/env bash
# SessionStart hook: warm a session (deps, fresh origin/main, task board). Never fails the session.
cd "$(dirname "$0")/.." || exit 0

warn() { echo "warning: $*"; }

# 1. Dependencies: npm ci only when node_modules is missing or the lockfile hash changed.
stamp=node_modules/.lock-hash
hash=$( (sha256sum package-lock.json 2>/dev/null || shasum -a 256 package-lock.json 2>/dev/null) | cut -d' ' -f1)
if [ ! -d node_modules ] || [ "$hash" != "$(cat "$stamp" 2>/dev/null)" ]; then
  if npm ci --no-audit --no-fund >/dev/null 2>&1; then
    mkdir -p node_modules && echo "$hash" >"$stamp"
  else
    warn "npm ci failed; run it manually"
  fi
fi

# 2. Fresh main (network errors are non-fatal).
git fetch -q origin main 2>/dev/null || warn "git fetch origin main failed (offline?)"

# 3. Playwright's pre-installed Chromium.
chromium="${PW_CHROMIUM_DIR:-/opt/pw-browsers/chromium}"
if [ -e "$chromium" ] && [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PW_CHROMIUM_PATH=$chromium" >>"$CLAUDE_ENV_FILE"
fi

# 4. Orientation (<= 20 lines).
branch=$(git branch --show-current 2>/dev/null)
echo "branch: ${branch:-detached}"
if git rev-parse -q --verify origin/main >/dev/null 2>&1; then
  if git merge-base --is-ancestor origin/main HEAD 2>/dev/null; then
    echo "origin/main: merged into HEAD"
  else
    echo "origin/main: NOT merged into HEAD (git merge origin/main before pushing)"
  fi
fi
if [ -f scripts/tasks.mjs ]; then
  node scripts/tasks.mjs 2>/dev/null | head -12 || true
fi
exit 0
