#!/usr/bin/env python3
"""Narrator voice casting: render the same narration with several engines /
settings in a documentary-Shorts style (low, calm, slightly tense, clear
diction, natural pauses) and check intelligibility with ASR.

Output: output/voice_samples/<n>_<name>.mp3 + output/voice_samples/report.json
Requires: Piper voices (fetch_models.sh); optional RHVoice data dir
(RHVOICE_ROOT, extracted .deb) and MMS model (MMS_DIR)."""
from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from generate_voices import ROOT, asr_text, load_voice, read_wav, word_accuracy, write_wav  # noqa: E402

TEXT = [
    "Глеб хотел управлять беспилотниками.",
    "Но вместо пульта ему выдали автомат.",
    "Ещё недавно он сидел за компьютером в колледже.",
    "Теперь его везли туда, где любая ошибка могла стать последней.",
]
PAUSES = [0.55, 0.9, 0.6]  # after each sentence (longer = dramatic beat)

DOC_CHAIN = (
    "highpass=f=65,equalizer=f=115:t=q:w=0.9:g=3.5,equalizer=f=300:t=q:w=1:g=-1.5,"
    "equalizer=f=3300:t=q:w=1.1:g=2.5,equalizer=f=7500:t=q:w=1:g=-2.5,"
    "acompressor=threshold=-22dB:ratio=3.5:attack=6:release=140:makeup=3,"
    "aecho=0.85:0.5:22|37:0.06|0.04,loudnorm=I=-16:TP=-1.5:LRA=6"
)

OUT = ROOT / "output" / "voice_samples"
TMP = ROOT / "output" / "tmp" / "vs"


def piper(model: str, length: float, noise: float, noise_w: float):
    from piper import SynthesisConfig

    v = load_voice(model)
    cfg = SynthesisConfig(length_scale=length, noise_scale=noise, noise_w_scale=noise_w, volume=0.9)
    sents = []
    for s in TEXT:
        a = np.concatenate([c.audio_float_array for c in v.synthesize(s, cfg)])
        sents.append((a, v.config.sample_rate))
    return sents


def mms(speed: float):
    import sherpa_onnx

    d = os.environ.get("MMS_DIR", "/tmp/claude-0/vits-mms-rus")
    tts = sherpa_onnx.OfflineTts(
        sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{d}/model.onnx", tokens=f"{d}/tokens.txt"), num_threads=4))
    )
    out = []
    for s in TEXT:
        clean = "".join(ch for ch in s.lower() if ch.isalpha() or ch == " ")
        a = tts.generate(clean, sid=0, speed=speed)
        out.append((np.array(a.samples, dtype=np.float32), a.sample_rate))
    return out


def rhvoice(voice: str, rate: int):
    root = os.environ.get("RHVOICE_ROOT", "/tmp/claude-0/rh/root")
    lib = f"{root}/usr/lib/x86_64-linux-gnu"
    out = []
    for i, s in enumerate(TEXT):
        p = TMP / f"rh_{voice}_{i}.wav"
        subprocess.run(
            [sys.executable, str(Path(__file__).parent / "rhvoice_tts.py"), f"{root}/usr/share/RHVoice", lib, voice, str(p), s, str(rate), "100"],
            env={**os.environ, "LD_LIBRARY_PATH": lib},
            check=True,
            stdout=subprocess.DEVNULL,
        )
        a, sr = read_wav(p)
        out.append((a, sr))
    return out


def assemble(sents, name: str, pitch: float, chain: str = DOC_CHAIN) -> Path:
    from scipy.signal import resample_poly

    parts = []
    for i, (a, sr) in enumerate(sents):
        a = resample_poly(a, 48000, sr).astype(np.float32) if sr != 48000 else a
        nz = np.where(np.abs(a) > 0.01)[0]
        a = a[max(0, nz[0] - 800) : nz[-1] + 2400] if len(nz) else a
        parts.append(a / (np.max(np.abs(a)) + 1e-9) * 0.9)
        if i < len(PAUSES):
            parts.append(np.zeros(int(PAUSES[i] * 48000), dtype=np.float32))
    raw = TMP / f"{name}.raw.wav"
    write_wav(raw, np.concatenate([np.zeros(4800, np.float32), *parts, np.zeros(9600, np.float32)]), 48000)
    pf = 2 ** (pitch / 12)
    wav = TMP / f"{name}.wav"
    af = (f"rubberband=pitch={pf:.5f}:formant=preserved:transients=smooth," if pitch else "") + chain
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", af, "-ar", "48000", "-ac", "1", str(wav)], check=True)
    mp3 = OUT / f"{name}.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "160k", str(mp3)], check=True)
    return wav


VARIANTS = [
    ("1_ruslan_dokumentalny", lambda: piper("ruslan", 1.16, 0.58, 0.7), -2.0),
    ("2_dmitri_dokumentalny", lambda: piper("dmitri", 1.14, 0.6, 0.72), -2.2),
    ("3_denis_nizkiy", lambda: piper("denis", 1.12, 0.62, 0.75), -3.0),
    ("4_ruslan_napryazhenny", lambda: piper("ruslan", 1.08, 0.75, 0.9), -2.6),
    ("5_mms_meta", lambda: mms(0.86), -1.5),
    ("6_rhvoice_aleksandr", lambda: rhvoice("aleksandr-hq", 88), -1.5),
    ("7_rhvoice_yuriy", lambda: rhvoice("yuriy", 88), -1.0),
    ("0_tekushchiy_v_serii", lambda: piper("ruslan", 1.1, 0.62, 0.75), -1.0),
]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    TMP.mkdir(parents=True, exist_ok=True)
    only = set(sys.argv[1:])
    report = {}
    ref = " ".join(TEXT)
    for name, gen, pitch in VARIANTS:
        if only and name not in only:
            continue
        try:
            wav = assemble(gen(), name, pitch)
        except Exception as e:  # engine missing → skip
            print(f"{name}: skipped ({e})")
            continue
        hyp = asr_text(wav) or ""
        acc = word_accuracy(ref, hyp)
        dur = len(read_wav(wav)[0]) / 48000
        report[name] = {"asr_word_accuracy": round(acc, 3), "duration": round(dur, 2), "asr": hyp}
        print(f"{name:26s} {dur:5.2f}s  ASR {acc:5.0%}  {hyp}")
    (OUT / "report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")


if __name__ == "__main__":
    main()
