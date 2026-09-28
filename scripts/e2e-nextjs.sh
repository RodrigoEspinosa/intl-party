#!/usr/bin/env bash
# End-to-end check of the documented Next.js setup.
#
# Scaffolds a fresh Next.js app with `intl-party nextjs --init`, installs the
# locally built packages, runs a production build, and checks that the page
# renders in the locale chosen by cookie / Accept-Language.
#
# Usage: scripts/e2e-nextjs.sh <next-version> <react-version>
# Requires: `pnpm build` to have run first.
set -euo pipefail

NEXT_VERSION=${1:?next version required}
REACT_VERSION=${2:?react version required}
PORT=${PORT:-3999}
REPO=$(cd "$(dirname "$0")/.." && pwd)
WORK=$(mktemp -d)
# Set KEEP=1 to keep the scaffolded app for debugging.
trap 'kill "${SERVER_PID:-}" 2>/dev/null || true; [[ -n "${KEEP:-}" ]] && echo "Kept $WORK" || rm -rf "$WORK"' EXIT

echo "▶ Packing local packages"
for pkg in core react nextjs; do
  (cd "$REPO/packages/$pkg" && pnpm pack --pack-destination "$WORK/tgz" >/dev/null)
done
tgz() { ls "$WORK"/tgz/intl-party-"$1"-*.tgz; }

echo "▶ Scaffolding Next.js $NEXT_VERSION app"
APP=$WORK/app
mkdir -p "$APP/app" && cd "$APP"
cat > package.json <<JSON
{
  "name": "intl-party-e2e",
  "private": true,
  "dependencies": {
    "next": "$NEXT_VERSION",
    "react": "$REACT_VERSION",
    "react-dom": "$REACT_VERSION",
    "@intl-party/nextjs": "file:$(tgz nextjs)",
    "@intl-party/react": "file:$(tgz react)",
    "@intl-party/core": "file:$(tgz core)"
  },
  "overrides": {
    "@intl-party/react": "file:$(tgz react)",
    "@intl-party/core": "file:$(tgz core)"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^$REACT_VERSION",
    "@types/node": "^22"
  }
}
JSON
npm install --no-audit --no-fund --loglevel=error

node "$REPO/packages/cli/dist/cli.js" nextjs --init
mv app/layout.intl-party.tsx app/layout.tsx
mv app/page.intl-party.tsx app/page.tsx

echo "▶ Building"
npx next build

echo "▶ Checking type-checked translation keys"
# `next build` above already type-checked the valid keys in app/page.tsx.
# A misspelled key must now fail to compile.
cat > app/typo-check.tsx <<'TSX'
"use client";
import { useTranslations } from "@intl-party/nextjs";
export function TypoCheck() {
  const t = useTranslations("common");
  return <p>{t("welcom")}</p>;
}
TSX
if npx tsc --noEmit -p . > tsc.log 2>&1; then
  echo "  ✗ misspelled key compiled; translation keys are not type-checked"
  exit 1
elif grep -q '"welcom"' tsc.log; then
  echo "  ✓ misspelled key rejected"
else
  echo "  ✗ tsc failed for an unexpected reason:"; cat tsc.log
  exit 1
fi
rm app/typo-check.tsx

echo "▶ Serving"
npx next start -p "$PORT" > server.log 2>&1 &
SERVER_PID=$!
for _ in $(seq 1 60); do
  curl -sf -o /dev/null "http://localhost:$PORT" && break
  sleep 0.5
done

FAILED=0
expect_locale() {
  local name=$1 lang=$2 heading=$3
  shift 3
  local html
  html=$(curl -sf "$@" "http://localhost:$PORT/")
  if [[ $html == *"<html lang=\"$lang\""* && $html == *"<h1>$heading</h1>"* ]]; then
    echo "  ✓ $name"
  else
    echo "  ✗ $name: expected lang=$lang and <h1>$heading</h1>"
    FAILED=1
  fi
}

expect_locale "default locale" en "Welcome to IntlParty!"
expect_locale "Accept-Language" es "¡Bienvenido a IntlParty!" -H "Accept-Language: es-ES,es;q=0.9"
expect_locale "cookie beats header" fr "Bienvenue chez IntlParty !" -H "Cookie: INTL_LOCALE=fr" -H "Accept-Language: es"
expect_locale "unsupported falls back" en "Welcome to IntlParty!" -H "Accept-Language: de"

if curl -s -D - -o /dev/null -H "Accept-Language: es" "http://localhost:$PORT/" | grep -qi '^set-cookie: INTL_LOCALE=es'; then
  echo "  ✓ middleware sets locale cookie"
else
  echo "  ✗ middleware did not set the locale cookie"
  FAILED=1
fi

if [[ $FAILED -ne 0 ]]; then
  echo "--- server log"; cat server.log
  exit 1
fi
