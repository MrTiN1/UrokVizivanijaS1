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

# minimal, transparent chain: no time-stretch, no echo, gentle EQ + level
CLEAN_CHAIN = (
    "highpass=f=55,equalizer=f=120:t=q:w=0.9:g=1.5,equalizer=f=6500:t=q:w=1:g=-1,"
    "acompressor=threshold=-18dB:ratio=2:attack=10:release=200:makeup=1,loudnorm=I=-16:TP=-1.5:LRA=7"
)

# denser, darker "TikTok documentary" chain matched to the reference narrator
REF_CHAIN = (
    "highpass=f=60,equalizer=f=110:t=q:w=0.8:g=4,equalizer=f=220:t=q:w=1:g=1.5,equalizer=f=450:t=q:w=1:g=-2,"
    "equalizer=f=2800:t=q:w=1.2:g=2,equalizer=f=6000:t=q:w=1:g=-4,lowpass=f=10000,"
    "acompressor=threshold=-24dB:ratio=4.5:attack=4:release=110:makeup=4,"
    "aecho=0.85:0.45:18|29:0.05|0.03,loudnorm=I=-16:TP=-1.5:LRA=5"
)

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


def edge(voice: str, rate: str, pitch: str, tag: str = ""):
    """Microsoft neural voices via edge-tts (free, no key)."""
    import asyncio

    import edge_tts

    out = []
    for i, s in enumerate(TEXT):
        mp3 = TMP / f"edge_{voice}{tag}_{i}.mp3"
        wav = TMP / f"edge_{voice}{tag}_{i}.wav"
        for attempt in range(6):
            try:
                asyncio.run(edge_tts.Communicate(s, voice, rate=rate, pitch=pitch, proxy=os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")).save(str(mp3)))
                break
            except Exception:
                if attempt == 5:
                    raise
                import time

                time.sleep(2 + attempt * 2)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", "48000", str(wav)], check=True)
        out.append(read_wav(wav))
    return out


_SILERO = {}


def silero(model: str, speaker: str, rate: str = "slow", pitch: str = "medium"):
    """Silero TTS (v4/v5 Russian) with SSML prosody."""
    import torch

    if model not in _SILERO:
        imp = torch.package.PackageImporter(str(ROOT / "assets" / "voices" / "models" / "silero" / f"{model}.pt"))
        m = imp.load_pickle("tts_models", "model")
        m.to("cpu")
        _SILERO[model] = m
    m = _SILERO[model]
    out = []
    for snt in TEXT:
        ssml = f'<speak><prosody rate="{rate}" pitch="{pitch}">{snt}</prosody></speak>'
        a = m.apply_tts(ssml_text=ssml, speaker=speaker, sample_rate=48000, put_accent=True, put_yo=True)
        out.append((a.numpy().astype(np.float32), 48000))
    return out


def freetts_sentences(voice_id: str):
    """freetts.ru, one request per sentence so pauses can be set exactly (no stretching)."""
    import time

    out = []
    for i, snt in enumerate(TEXT):
        mp3 = TMP / f"fts_{voice_id}_{i}.mp3"
        wav = TMP / f"fts_{voice_id}_{i}.wav"
        if not mp3.exists() or mp3.stat().st_size < 1000:
            subprocess.run([sys.executable, str(Path(__file__).parent / "freetts_client.py"), voice_id, str(mp3), snt], check=True, stdout=subprocess.DEVNULL, timeout=240)
            time.sleep(3)
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", "48000", str(wav)], check=True)
        out.append(read_wav(wav))
    return out


def freetts(voice_id: str):
    """freetts.ru voice — one request for the whole narration (polite usage)."""
    import time

    mp3 = TMP / f"ft_{voice_id}.mp3"
    wav = TMP / f"ft_{voice_id}.wav"
    if not mp3.exists() or mp3.stat().st_size < 1000:
        subprocess.run([sys.executable, str(Path(__file__).parent / "freetts_client.py"), voice_id, str(mp3), " ".join(TEXT)], check=True, stdout=subprocess.DEVNULL, timeout=240)
        time.sleep(3)
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(mp3), "-ac", "1", "-ar", "48000", str(wav)], check=True)
    return [read_wav(wav)]


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


def assemble(sents, name: str, pitch: float, chain: str = DOC_CHAIN, tempo: float = 1.0) -> Path:
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
    af = (f"rubberband=pitch={pf:.5f}:tempo={tempo:.4f}:formant=preserved:transients=smooth," if (pitch or tempo != 1.0) else "") + chain
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(raw), "-af", af, "-ar", "48000", "-ac", "1", str(wav)], check=True)
    mp3 = OUT / f"{name}.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "256k", str(mp3)], check=True)
    return wav


VARIANTS = [
    ("40_chisty_ms_dmitry", lambda: edge("ru-RU-DmitryNeural", "-15%", "-4Hz", "_c"), 0, 1.0, "clean"),
    ("41_chisty_ms_remy", lambda: edge("fr-FR-RemyMultilingualNeural", "-12%", "-4Hz", "_c"), 0, 1.0, "clean"),
    ("42_chisty_freetts_german", lambda: freetts_sentences("QnWmRxTpUdSj"), 0, 1.0, "clean"),
    ("43_chisty_silero_aidar", lambda: silero("v5_ru", "aidar", "slow", "medium"), 0, 1.0, "clean"),
    ("30_ms_andrew_medlenee", lambda: [read_wav(TMP / f"edge_en-US-AndrewMultilingualNeural_{i}.wav") for i in range(len(TEXT))], -0.4, 0.97),
    ("31_ms_dmitry_kak_v_referense", lambda: [read_wav(TMP / f"edge_ru-RU-DmitryNeural_{i}.wav") for i in range(len(TEXT))], -0.5, 0.88),
    ("32_freetts_german_kak_v_referense", lambda: freetts("QnWmRxTpUdSj"), 0.6, 0.87),
    ("33_freetts_eduard_kak_v_referense", lambda: freetts("HqTjPmFaErVk"), -1.0, 0.92),
    ("34_ms_remy_kak_v_referense", lambda: [read_wav(TMP / f"edge_fr-FR-RemyMultilingualNeural_{i}.wav") for i in range(len(TEXT))], 1.5, 0.95),
    ("20_freetts_dmitriy", lambda: freetts("vgpkhgZWTwnh"), 0),
    ("21_freetts_eduard", lambda: freetts("HqTjPmFaErVk"), 0),
    ("22_freetts_robert", lambda: freetts("GcVzRnLkPoTe"), 0),
    ("23_freetts_german", lambda: freetts("QnWmRxTpUdSj"), 0),
    ("24_freetts_emil", lambda: freetts("LkNrBvCxZtWu"), 0),
    ("25_freetts_vitaliy", lambda: freetts("VbNqRtKmLpOz"), 0),
    ("26_freetts_yura", lambda: freetts("SkYhUtRePmLo"), 0),
    ("27_freetts_aydar", lambda: freetts("bd30c95c59d3"), 0),
    ("28_freetts_kirill", lambda: freetts("rus_Kirill"), 0),
    ("16_silero5_aidar", lambda: silero("v5_ru", "aidar", "slow", "low"), -1.0),
    ("17_silero5_eugene", lambda: silero("v5_ru", "eugene", "slow", "low"), -1.0),
    ("18_silero4_aidar", lambda: silero("v4_ru", "aidar", "slow", "low"), -1.0),
    ("19_silero4_eugene", lambda: silero("v4_ru", "eugene", "slow", "low"), -1.0),
    ("10_ms_dmitry", lambda: edge("ru-RU-DmitryNeural", "-10%", "-6Hz"), 0),
    ("11_ms_dmitry_nizkiy", lambda: [read_wav(TMP / f"edge_ru-RU-DmitryNeural_{i}.wav") for i in range(len(TEXT))], -1.8),
    ("12_ms_andrew", lambda: edge("en-US-AndrewMultilingualNeural", "-10%", "-8Hz"), 0),
    ("13_ms_brian", lambda: edge("en-US-BrianMultilingualNeural", "-10%", "-8Hz"), 0),
    ("14_ms_florian", lambda: edge("de-DE-FlorianMultilingualNeural", "-10%", "-8Hz"), 0),
    ("15_ms_remy", lambda: edge("fr-FR-RemyMultilingualNeural", "-10%", "-8Hz"), 0),
    ("8_denis_kak_v_referense", lambda: piper("denis", 1.22, 0.72, 0.95), -3.4),
    ("9_denis_kak_v_referense_nizhe", lambda: piper("denis", 1.2, 0.8, 1.0), -4.2),
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
    report = json.loads((OUT / "report.json").read_text()) if (OUT / "report.json").exists() else {}
    ref = " ".join(TEXT)
    for v in VARIANTS:
        name, gen, pitch = v[:3]
        tempo = v[3] if len(v) > 3 else 1.0
        forced = v[4] if len(v) > 4 else None
        if only and name not in only:
            continue
        try:
            wav = assemble(gen(), name, pitch, tempo=tempo, chain=CLEAN_CHAIN if forced == "clean" else REF_CHAIN if ("referense" in name or name.split("_")[0] in {"10", "11", "12", "13", "14", "15", "30", "31", "32", "33", "34"}) else DOC_CHAIN)
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
