#!/usr/bin/env bash
# One-command production of an episode:
#   voices → captions → soundtrack → render → mux → QC (+ contact sheet)
# Usage: scripts/produce.sh episode_01 [--skip-voices] [--clean]
set -euo pipefail
cd "$(dirname "$0")/.."
EP=${1:-episode_01}
PY=.venv/bin/python
[[ " $* " == *" --skip-voices "* ]] || $PY scripts/generate_audio/generate_voices.py "$EP"
$PY scripts/generate_audio/build_subtitles.py "$EP"
$PY scripts/generate_audio/build_soundtrack.py "$EP"
$PY scripts/quality_check/check_mix_intelligibility.py "$EP"
scripts/render/render_episode.sh "$EP"
[[ " $* " == *" --clean "* ]] && scripts/render/render_episode.sh "$EP" --no-subs
$PY scripts/quality_check/qc.py "$EP"
