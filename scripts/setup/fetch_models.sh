#!/usr/bin/env bash
# Downloads free/open models used by the pipeline (all from GitHub releases):
#  - Piper Russian voices (ruslan, denis, dmitri, irina) packaged by sherpa-onnx
#  - sherpa-onnx Russian zipformer ASR (intelligibility check)
#  - Rhubarb Lip Sync 1.13.0 binary
set -euo pipefail
cd "$(dirname "$0")/../.."
M=assets/voices/models
mkdir -p "$M" tools
for v in ruslan denis dmitri irina; do
  d="$M/vits-piper-ru_RU-$v-medium"
  [ -d "$d" ] && continue
  curl -sSL -o /tmp/v.tar.bz2 "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-ru_RU-$v-medium.tar.bz2"
  tar xjf /tmp/v.tar.bz2 -C "$M"
done
if [ ! -d "$M/asr-ru" ]; then
  curl -sSL -o /tmp/asr.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-zipformer-ru-2024-09-18.tar.bz2
  tar xjf /tmp/asr.tar.bz2 -C /tmp && mv /tmp/sherpa-onnx-zipformer-ru-2024-09-18 "$M/asr-ru"
fi
if [ ! -x tools/rhubarb/rhubarb ]; then
  curl -sSL -o /tmp/rh.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.13.0/Rhubarb-Lip-Sync-1.13.0-Linux.zip
  unzip -q -o /tmp/rh.zip -d /tmp/rh && mv /tmp/rh/Rhubarb-Lip-Sync-1.13.0-Linux tools/rhubarb
fi
echo "models ready"
