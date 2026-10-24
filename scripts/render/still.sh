#!/usr/bin/env bash
# Usage: scripts/render/still.sh <CompositionId> <out.png> [frame] [extra args]
set -e
cd "$(dirname "$0")/../.."
B=${REMOTION_BROWSER:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 2>/dev/null | head -1)/chrome-headless-shell}
npx remotion still src/index.ts "$1" "$2" --frame="${3:-0}" --browser-executable="$B" --log=error "${@:4}"
