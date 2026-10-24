#!/usr/bin/env bash
# Usage: scripts/render/preview.sh <CompositionId> <frame1,frame2,...>  → output/tmp/<id>_sheet.jpg
set -e
cd "$(dirname "$0")/../.."
B=${REMOTION_BROWSER:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 | head -1)/chrome-headless-shell}
IFS=',' read -ra FR <<< "$2"
files=()
for fr in "${FR[@]}"; do
  npx remotion still src/index.ts "$1" "output/tmp/$1_$fr.jpg" --frame="$fr" --image-format=jpeg --browser-executable="$B" --log=error 2>/dev/null &
  files+=("output/tmp/$1_$fr.jpg")
  if (( ${#files[@]} % 4 == 0 )); then wait; fi
done
wait
montage "${files[@]}" -tile "${#files[@]}x1" -geometry 432x768+3+3 "output/tmp/$1_sheet.jpg"
echo "output/tmp/$1_sheet.jpg"
