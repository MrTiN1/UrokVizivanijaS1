#!/usr/bin/env python3
"""Measure a voice: median pitch (F0), pitch range, speaking rate, pauses,
spectral brightness. Used to match TTS narration to a reference voice.
Usage: voice_profile.py file1.wav [file2.wav ...]"""
import json, sys
from pathlib import Path
import numpy as np, librosa

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "generate_audio"))

def profile(path, asr=True):
    y, sr = librosa.load(path, sr=16000, mono=True)
    f0, vflag, _ = librosa.pyin(y, fmin=55, fmax=300, sr=sr, frame_length=1024, hop_length=160)
    f0v = f0[vflag & ~np.isnan(f0)]
    rms = librosa.feature.rms(y=y, frame_length=400, hop_length=160)[0]
    thr = np.percentile(rms, 95) * 0.08
    speech = rms > thr
    # pauses = silent runs ≥ 150 ms between speech
    runs, cur = [], 0
    for s in speech:
        if not s: cur += 1
        else:
            if cur: runs.append(cur * 0.01)
            cur = 0
    pauses = [r for r in runs if r >= 0.15]
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=160)[0][speech[: len(librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=160)[0])]]
    out = {
        "file": Path(path).name,
        "duration": round(len(y) / sr, 2),
        "f0_median_hz": round(float(np.median(f0v)), 1) if len(f0v) else None,
        "f0_p10_p90_hz": [round(float(np.percentile(f0v, 10)), 1), round(float(np.percentile(f0v, 90)), 1)] if len(f0v) else None,
        "f0_range_semitones": round(float(12 * np.log2(np.percentile(f0v, 90) / np.percentile(f0v, 10))), 1) if len(f0v) else None,
        "speech_ratio": round(float(speech.mean()), 2),
        "pause_median_s": round(float(np.median(pauses)), 2) if pauses else 0,
        "pauses_per_min": round(len(pauses) / (len(y) / sr / 60), 1),
        "spectral_centroid_hz": round(float(np.median(cent)), 0),
    }
    if asr:
        from generate_voices import asr_text, write_wav
        parts = []
        for i in range(0, len(y), sr * 15):
            tmp = Path("/tmp/claude-0/vp_chunk.wav")
            write_wav(tmp, y[i : i + sr * 15], sr)
            parts.append(asr_text(tmp) or "")
        txt = " ".join(parts)
        words = len(txt.split())
        out["words_per_min_speech"] = round(words / max(1e-6, speech.sum() * 0.01 / 60), 0)
        out["asr_text"] = txt[:400]
    return out

if __name__ == "__main__":
    for p in sys.argv[1:]:
        print(json.dumps(profile(p), ensure_ascii=False))
