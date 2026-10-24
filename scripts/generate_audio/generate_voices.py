#!/usr/bin/env python3
"""Generate voice lines for an episode.

For every line in episodes/<ep>/episode.json:
  1. Piper TTS (Russian neural voices) with per-character settings
     and phoneme alignments (exact timing of every phoneme).
  2. Character processing with FFmpeg: pitch (rubberband), EQ, compression,
     loudness normalisation.
  3. Word timestamps (for subtitles) and visemes (for lip sync) derived
     from the phoneme alignment.
  4. Optional Rhubarb Lip Sync pass (fallback / cross-check).
  5. ASR round-trip (sherpa-onnx Russian zipformer) to verify intelligibility.

Outputs:
  assets/voices/<ep>/<line_id>.wav
  episodes/<ep>/build/voices.json   (durations, words, visemes, asr text)

Usage: python scripts/generate_audio/generate_voices.py episode_01 [--only id1,id2] [--no-asr]
"""
from __future__ import annotations

import argparse
import difflib
import json
import os
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "assets" / "voices" / "models"
RHUBARB = ROOT / "tools" / "rhubarb" / "rhubarb"
ASR_DIR = ROOT / "assets" / "voices" / "models" / "asr-ru"

EQ = {
    "warm": "highpass=f=70,equalizer=f=180:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1.2:g=1.5,equalizer=f=7000:t=q:w=1:g=-2",
    "young": "highpass=f=90,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3500:t=q:w=1:g=2",
    "deep": "highpass=f=60,equalizer=f=140:t=q:w=1:g=3.5,equalizer=f=2500:t=q:w=1:g=1,equalizer=f=8000:t=q:w=1:g=-3",
    "hall": "highpass=f=90,equalizer=f=1800:t=q:w=1:g=2,aecho=0.8:0.55:48|91:0.18|0.1",
}

# IPA phoneme → Rhubarb-style mouth shape
VISEME = {}
for ch in "pbm":
    VISEME[ch] = "A"
for ch in "fv":
    VISEME[ch] = "G"
for ch in "uʊwʉ":
    VISEME[ch] = "F"
for ch in "oɵɔ":
    VISEME[ch] = "E"
for ch in "aɑæ":
    VISEME[ch] = "D"
for ch in "ʌə":
    VISEME[ch] = "C"
for ch in "eɛ":
    VISEME[ch] = "C"
for ch in "iɪyɨj":
    VISEME[ch] = "B"
for ch in "lɭ":
    VISEME[ch] = "H"
for ch in "tdnszʃʒɕʑkgɡxrcɲ":
    VISEME[ch] = "B"
MODIFIERS = set("ˈˌʲːˑ\"")


def run(cmd: list[str]) -> None:
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if r.returncode != 0:
        print(r.stderr[-2000:], file=sys.stderr)
        raise SystemExit(f"command failed: {' '.join(cmd[:4])}…")


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
        if w.getnchannels() > 1:
            data = data.reshape(-1, w.getnchannels()).mean(axis=1)
    return data, sr


def write_wav(path: Path, data: np.ndarray, sr: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((np.clip(data, -1, 1) * 32767).astype(np.int16).tobytes())


def norm_word(w: str) -> str:
    return re.sub(r"[^а-яёa-z0-9]", "", w.lower()).replace("ё", "е")


_voice_cache: dict = {}


def load_voice(model: str):
    from piper import PiperVoice

    if model not in _voice_cache:
        onnx = MODELS / f"vits-piper-ru_RU-{model}-medium" / f"ru_RU-{model}-medium.onnx"
        if not onnx.exists():
            raise SystemExit(f"voice model missing: {onnx} (run scripts/setup/fetch_models.sh)")
        _voice_cache[model] = PiperVoice.load(str(onnx), include_alignments=True)
    return _voice_cache[model]


def synth_line(text: str, vcfg: dict) -> tuple[np.ndarray, int, list[dict], list[dict]]:
    """Returns audio, sample rate, words[{w,start,end}], phones[{p,start,end}]"""
    from piper import SynthesisConfig

    voice = load_voice(vcfg["model"])
    cfg = SynthesisConfig(
        length_scale=vcfg.get("lengthScale", 1.0),
        noise_scale=vcfg.get("noiseScale", 0.667),
        noise_w_scale=vcfg.get("noiseW", 0.8),
        normalize_audio=True,
        volume=0.9,
    )
    sr = voice.config.sample_rate
    pause = int(vcfg.get("sentencePause", 0.35) * sr)
    lead = int(0.06 * sr)
    audio = [np.zeros(lead, dtype=np.float32)]
    cursor = lead
    phones: list[dict] = []
    words_t: list[tuple[float, float]] = []
    for ci, chunk in enumerate(voice.synthesize(text, cfg, include_alignments=True)):
        a = chunk.audio_float_array
        if ci > 0:
            audio.append(np.zeros(pause, dtype=np.float32))
            cursor += pause
        al = chunk.phoneme_alignments or []
        pos = cursor
        cur_word: list[float] | None = None
        for pa in al:
            p = pa.phoneme
            n = int(pa.num_samples)
            t0, t1 = pos / sr, (pos + n) / sr
            pos += n
            if p in ("^", "$", "_"):
                continue
            if p == " " or p in ",.!?;:—-…":
                if cur_word:
                    words_t.append((cur_word[0], cur_word[1]))
                    cur_word = None
                phones.append({"p": "_", "start": t0, "end": t1})
                continue
            if p in MODIFIERS:
                if phones:
                    phones[-1]["end"] = t1
                if cur_word:
                    cur_word[1] = t1
                continue
            phones.append({"p": p, "start": t0, "end": t1})
            if cur_word is None:
                cur_word = [t0, t1]
            else:
                cur_word[1] = t1
        if cur_word:
            words_t.append((cur_word[0], cur_word[1]))
        audio.append(a)
        cursor += len(a)
    audio.append(np.zeros(int(0.12 * sr), dtype=np.float32))
    data = np.concatenate(audio)

    # map phoneme word groups to script words
    script_words = [w for w in text.split() if norm_word(w)]
    words: list[dict] = []
    if len(words_t) == len(script_words):
        for w, (a0, a1) in zip(script_words, words_t):
            words.append({"w": w, "start": round(a0, 3), "end": round(a1, 3)})
    else:
        # fallback: distribute across voiced span by character count
        total = sum(len(norm_word(w)) for w in script_words)
        span0 = phones[0]["start"] if phones else 0
        span1 = phones[-1]["end"] if phones else len(data) / sr
        t = span0
        for w in script_words:
            d = (span1 - span0) * len(norm_word(w)) / max(total, 1)
            words.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
            t += d
        print(f"  ! word alignment fallback ({len(words_t)} groups vs {len(script_words)} words)")
    return data, sr, words, phones


def visemes_from_phones(phones: list[dict], total: float) -> list[dict]:
    cues: list[dict] = []
    for ph in phones:
        p = ph["p"]
        v = "X" if p == "_" else VISEME.get(p[0], "B")
        if cues and cues[-1]["v"] == v:
            cues[-1]["end"] = ph["end"]
            continue
        cues.append({"v": v, "start": round(ph["start"], 3), "end": round(ph["end"], 3)})
    # merge very short cues (< 45 ms) into neighbours for readable animation
    merged: list[dict] = []
    for c in cues:
        if merged and c["end"] - c["start"] < 0.045:
            merged[-1]["end"] = c["end"]
        else:
            merged.append(c)
    if not merged or merged[0]["start"] > 0:
        merged.insert(0, {"v": "X", "start": 0, "end": merged[0]["start"] if merged else total})
    merged.append({"v": "X", "start": merged[-1]["end"], "end": total})
    return merged


def process_audio(src: Path, dst: Path, vcfg: dict) -> None:
    pitch = 2 ** (vcfg.get("pitch", 0) / 12)
    eq = EQ.get(vcfg.get("eq", ""), "anull")
    af = (
        f"aresample=48000,rubberband=pitch={pitch:.5f}:transients=smooth:formant=shifted,"
        f"{eq},acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=2,"
        "loudnorm=I=-18:TP=-2:LRA=7"
    )
    run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-af", af, "-ar", "48000", "-ac", "1", str(dst)])


def rhubarb_cues(wav: Path, text: str) -> list[dict] | None:
    if not RHUBARB.exists():
        return None
    txt = wav.with_suffix(".txt")
    txt.write_text(text, encoding="utf-8")
    out = wav.with_suffix(".rhubarb.json")
    r = subprocess.run(
        [str(RHUBARB), "-f", "json", "-r", "phonetic", "--extendedShapes", "GHX", "-o", str(out), str(wav)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    txt.unlink(missing_ok=True)
    if r.returncode != 0 or not out.exists():
        return None
    data = json.loads(out.read_text())
    out.unlink(missing_ok=True)
    return [{"v": c["value"], "start": c["start"], "end": c["end"]} for c in data["mouthCues"]]


_asr = None


def asr_text(wav: Path) -> str | None:
    global _asr
    try:
        import sherpa_onnx
    except ImportError:
        return None
    if not (ASR_DIR / "tokens.txt").exists():
        return None
    if _asr is None:
        _asr = sherpa_onnx.OfflineRecognizer.from_transducer(
            encoder=str(ASR_DIR / "encoder.int8.onnx"),
            decoder=str(ASR_DIR / "decoder.int8.onnx"),
            joiner=str(ASR_DIR / "joiner.int8.onnx"),
            tokens=str(ASR_DIR / "tokens.txt"),
            num_threads=4,
            decoding_method="greedy_search",
        )
    data, sr = read_wav(wav)
    s = _asr.create_stream()
    s.accept_waveform(sr, data)
    _asr.decode_stream(s)
    return s.result.text.strip()


def word_accuracy(ref: str, hyp: str) -> float:
    r = [norm_word(w) for w in ref.split() if norm_word(w)]
    h = [norm_word(w) for w in hyp.split() if norm_word(w)]
    sm = difflib.SequenceMatcher(a=r, b=h)
    return sum(b.size for b in sm.get_matching_blocks()) / max(1, len(r))


def external_line(wav: Path, line: dict, episode: str, use_asr: bool) -> dict:
    """Timing + lip sync for a voice file that was not produced by our TTS."""
    data, sr = read_wav(wav)
    dur = len(data) / sr
    hop = int(sr * 0.01)
    env = np.array([np.sqrt(np.mean(data[i : i + hop] ** 2)) for i in range(0, len(data) - hop, hop)])
    voiced = np.where(env > max(env.max() * 0.08, 1e-4))[0]
    t0, t1 = (voiced[0] * 0.01, voiced[-1] * 0.01) if len(voiced) else (0, dur)
    words = [w for w in line["text"].split() if norm_word(w)]
    total = sum(len(norm_word(w)) for w in words)
    t, out = t0, []
    for w in words:
        d = (t1 - t0) * len(norm_word(w)) / max(1, total)
        out.append({"w": w, "start": round(t, 3), "end": round(t + d, 3)})
        t += d
    vis = rhubarb_cues(wav, line["text"]) or [{"v": "X", "start": 0, "end": dur}]
    entry = {"speaker": line["speaker"], "text": line["text"], "file": f"voices/{episode}/{wav.name}", "duration": round(dur, 3),
             "words": out, "visemes": vis, "rhubarb": vis, "lipsyncSource": "rhubarb"}
    if use_asr:
        hyp = asr_text(wav)
        if hyp is not None:
            entry["asr"], entry["asrWordAccuracy"] = hyp, round(word_accuracy(line["text"], hyp), 3)
    print(f"   external: {dur:.2f}s, rhubarb visemes {len(vis)}")
    return entry


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--only", default="")
    ap.add_argument("--no-asr", action="store_true")
    ap.add_argument("--external", action="store_true", help="use existing WAVs in assets/voices/<ep>/ (recorded / ElevenLabs); lip sync via Rhubarb")
    args = ap.parse_args()

    ep_dir = ROOT / "episodes" / args.episode
    ep = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    out_dir = ROOT / "assets" / "voices" / args.episode
    build = ep_dir / "build"
    build.mkdir(parents=True, exist_ok=True)
    tmp = ROOT / "output" / "tmp" / "voices"
    tmp.mkdir(parents=True, exist_ok=True)
    meta_path = build / "voices.json"
    meta = json.loads(meta_path.read_text()) if meta_path.exists() else {}
    only = set(filter(None, args.only.split(",")))

    for scene in ep["scenes"]:
        for line in scene["lines"]:
            lid = line["id"]
            if only and lid not in only:
                continue
            vcfg = ep["voices"][line["speaker"]]
            print(f"[{lid}] {line['speaker']}: {line['text']}")
            if args.external and (out_dir / f"{lid}.wav").exists():
                meta[lid] = external_line(out_dir / f"{lid}.wav", line, args.episode, not args.no_asr)
                continue
            best = None
            for take in range(1 if args.no_asr else 4):
                data, sr, words, phones = synth_line(line["text"], vcfg)
                raw = tmp / f"{lid}.raw.wav"
                write_wav(raw, data, sr)
                dst = out_dir / f"{lid}.take{take}.wav"
                dst.parent.mkdir(parents=True, exist_ok=True)
                process_audio(raw, dst, vcfg)
                hyp = None if args.no_asr else asr_text(dst)
                acc = word_accuracy(line["text"], hyp) if hyp is not None else 1.0
                print(f"   take {take}: ASR «{hyp}» ({acc:.0%})")
                if best is None or acc > best[0]:
                    if best is not None:
                        best[1].unlink(missing_ok=True)
                    best = (acc, dst, words, phones, hyp)
                else:
                    dst.unlink(missing_ok=True)
                if acc >= 0.95:
                    break
            acc, take_path, words, phones, hyp = best
            dst = out_dir / f"{lid}.wav"
            take_path.replace(dst)
            proc, psr = read_wav(dst)
            dur = len(proc) / psr
            vis = visemes_from_phones(phones, dur)
            rh = rhubarb_cues(dst, line["text"])
            entry = {
                "speaker": line["speaker"],
                "text": line["text"],
                "file": f"voices/{args.episode}/{lid}.wav",
                "duration": round(dur, 3),
                "words": words,
                "visemes": vis,
                "rhubarb": rh,
                "lipsyncSource": "piper-alignment",
            }
            if hyp is not None:
                entry["asr"] = hyp
                entry["asrWordAccuracy"] = round(acc, 3)
            print(f"   => {dur:.2f}s, {len(words)} words, {len(vis)} visemes, ASR acc {acc:.0%}")
            meta[lid] = entry
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"saved {meta_path}")


if __name__ == "__main__":
    main()
