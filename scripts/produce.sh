#!/usr/bin/env bash
# One-command production of an episode:
#   banner prep → voices → captions → soundtrack → preview → render → QC → compliance
# Usage: scripts/produce.sh episode_01 [--skip-voices] [--clean] [--elevenlabs] [--preview]
set -euo pipefail
cd "$(dirname "$0")/.."
EP=${1:-episode_01}
python3 scripts/set_episode.py "$EP"
PY=.venv/bin/python
ENGINE=piper
[[ " $* " == *" --elevenlabs "* ]] && ENGINE=elevenlabs
# sponsor banner: key out the green once (if a banner is configured and its file is present)
if $PY -c "import json,sys;e=json.load(open('episodes/$EP/episode.json'));sys.exit(0 if e.get('banner',{}).get('enabled') else 1)"; then
  [[ -f assets/banner/natria_keyed.webm ]] || $PY scripts/banner/prepare_banner.py
fi
[[ " $* " == *" --skip-voices "* ]] || $PY scripts/generate_audio/generate_voices.py "$EP" --engine "$ENGINE"
$PY scripts/generate_audio/build_subtitles.py "$EP"
$PY scripts/generate_audio/build_soundtrack.py "$EP"
$PY scripts/quality_check/check_mix_intelligibility.py "$EP"
[[ " $* " == *" --preview "* ]] && scripts/render/render_episode.sh "$EP" --preview
scripts/render/render_episode.sh "$EP"
[[ " $* " == *" --clean "* ]] && scripts/render/render_episode.sh "$EP" --no-subs
$PY scripts/quality_check/qc.py "$EP"
$PY scripts/quality_check/compliance.py "$EP" || true
