#!/usr/bin/env bash
# Render the episode video with Remotion and mux the mastered soundtrack.
# Usage: scripts/render/render_episode.sh episode_01 [--no-subs] [--preview]
#   --preview : half resolution (540×960), quick check → output/<ep>_preview.mp4
set -euo pipefail
cd "$(dirname "$0")/../.."
EP=${1:-episode_01}
python3 scripts/set_episode.py "$EP"
SUBS=true; SUFFIX=""; SCALE=1; CRF=${FINAL_CRF:-21}
for a in "${@:2}"; do
  case "$a" in
    --no-subs) SUBS=false; SUFFIX="_clean" ;;
    --preview) SCALE=0.5; SUFFIX="_preview"; CRF=26 ;;
  esac
done
B=${REMOTION_BROWSER:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-headless-shell-linux64 | head -1)/chrome-headless-shell}
mkdir -p output/tmp
VID=output/tmp/${EP}${SUFFIX}_video.mp4
npx remotion render src/index.ts Episode "$VID" --codec=h264 --crf=17 --pixel-format=yuv420p --scale=$SCALE \
  --muted --concurrency=4 --gl=angle --browser-executable="$B" --props="{\"subtitles\":$SUBS}" --log=error
# Colour grade + film grain (cheap here, slow in the browser). Disabled while the
# sponsor banner is on screen so its original colours stay untouched.
NOBANNER=$(python3 -c "import json;e=json.load(open('episodes/$EP/episode.json'));b=e.get('banner') or {};print(f\"not(between(t,{b['at']-0.05},{b['at']+b['duration']/b.get('speed',1)+0.05}))\" if b.get('enabled') else '1')")
GRADE=${GRADE:-"colorbalance=rs=-0.04:gs=-0.03:bs=0.07:rm=-0.01:bm=0.02:rh=0.03:gh=0.01:bh=-0.03:enable='$NOBANNER',noise=alls=7:allf=t:enable='$NOBANNER'"}
# Re-encode: grain makes a CRF-17 master ~150 MB; CRF 21 keeps it near 50 MB (GitHub limit 100 MB)
ffmpeg -y -v error -i "$VID" -i "episodes/$EP/build/soundtrack.wav" -map 0:v -map 1:a -vf "$GRADE" \
  -c:v libx264 -preset medium -crf "$CRF" -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "output/${EP}${SUFFIX}.mp4"
echo "output/${EP}${SUFFIX}.mp4"
