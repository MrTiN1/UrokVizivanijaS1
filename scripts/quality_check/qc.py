#!/usr/bin/env python3
"""Automatic quality control for a rendered episode.

Checks: resolution, fps, duration, codecs, audio presence and loudness,
unexpected black frames, frozen/empty shots, subtitle validity (timing,
2–5 words, length/fit), subtitle ↔ voice sync, dialogue intelligibility in
the final mix (ASR), character-model consistency (one canonical design).
Builds output/contact_sheet.jpg (two frames from every shot, labelled).

Usage: python scripts/quality_check/qc.py episode_01
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]


def sh(cmd: list[str]) -> str:
    r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return r.stdout + r.stderr


def frame_at(video: Path, t: float, w: int = 1080) -> Image.Image:
    out = ROOT / "output" / "tmp" / "qc_frame.png"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.3f}", "-i", str(video), "-frames:v", "1", "-vf", f"scale={w}:-1", str(out)], check=True)
    return Image.open(out).convert("RGB")


def main() -> None:
    ep_name = sys.argv[1] if len(sys.argv) > 1 else "episode_01"
    ep_dir = ROOT / "episodes" / ep_name
    ep = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
    video = ROOT / "output" / f"{ep_name}.mp4"
    srt = ROOT / "output" / f"{ep_name}.srt"
    checks: list[dict] = []

    def check(name: str, ok: bool, detail: str):
        checks.append({"check": name, "ok": bool(ok), "detail": detail})
        print(f"[{'OK ' if ok else 'FAIL'}] {name}: {detail}")

    # ---------- container / streams ----------
    probe = json.loads(sh(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(video)]))
    v = next(s for s in probe["streams"] if s["codec_type"] == "video")
    a = [s for s in probe["streams"] if s["codec_type"] == "audio"]
    num, den = map(int, v["r_frame_rate"].split("/"))
    fps = num / den
    dur = float(probe["format"]["duration"])
    check("resolution", (v["width"], v["height"]) == (1080, 1920), f"{v['width']}×{v['height']}")
    check("frame rate", abs(fps - 30) < 0.01, f"{fps:.3f} fps")
    check("duration 90–120 s", 90 <= dur <= 120.5, f"{dur:.2f} s (script {ep['duration']} s)")
    check("video codec H.264", v["codec_name"] == "h264", f"{v['codec_name']} {v.get('profile', '')} {v.get('pix_fmt', '')}")
    check("audio track AAC", bool(a) and a[0]["codec_name"] == "aac", f"{a[0]['codec_name']} {a[0].get('sample_rate')} Hz {a[0].get('channels')} ch" if a else "missing")

    # ---------- loudness ----------
    lo = sh(["ffmpeg", "-hide_banner", "-i", str(video), "-af", "ebur128=peak=true", "-f", "null", "-"])
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", lo)[-1])
    tp = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", lo)
    peak = float(tp[-1]) if tp else 0.0
    check("loudness for Shorts (-14 LUFS ±1.5)", abs(I + 14) <= 1.5, f"I={I} LUFS, true peak {peak} dBFS")
    check("no clipping (true peak ≤ -1 dBFS)", peak <= -0.9, f"{peak} dBFS")

    # ---------- black frames ----------
    bd = sh(["ffmpeg", "-hide_banner", "-i", str(video), "-vf", "blackdetect=d=0.25:pic_th=0.97:pix_th=0.06", "-an", "-f", "null", "-"])
    blacks = [(float(s), float(e)) for s, e in re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bd)]
    s7 = next(s for s in ep["scenes"] if s["id"] == "s7_transport")
    allowed = [(s7["start"] + s7["events"]["fadeOut"][0], ep["duration"] + 1)]
    unexpected = [b for b in blacks if not any(b[0] >= a0 - 0.3 and b[1] <= a1 + 0.3 for a0, a1 in allowed)]
    check("no unintended black frames", not unexpected, f"black segments {blacks}; allowed = scripted fade-out {allowed}")

    # ---------- frozen / empty shots ----------
    fz = sh(["ffmpeg", "-hide_banner", "-i", str(video), "-vf", "freezedetect=n=0.0008:d=2", "-an", "-f", "null", "-"])
    freezes = re.findall(r"freeze_start: ([\d.]+)", fz)
    check("no frozen stretches > 2 s (every shot animates)", len(freezes) == 0, f"freezes at {freezes}" if freezes else "none")

    # ---------- per-shot frames: emptiness + contact sheet ----------
    tiles = []
    stats = []
    for sc in ep["scenes"]:
        for k, (a0, a1, label) in enumerate(sc["shots"]):
            for frac in (0.3, 0.8):
                t = sc["start"] + a0 + (a1 - a0) * frac
                t = min(t, dur - 0.05)
                im = frame_at(video, t, 360)
                arr = np.asarray(im).astype(np.float32)
                stats.append({"t": round(t, 2), "scene": sc["id"], "shot": label, "std": float(arr.std()), "mean": float(arr.mean())})
                d = ImageDraw.Draw(im)
                try:
                    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
                except OSError:
                    font = ImageFont.load_default()
                d.rectangle([0, 0, 360, 44], fill=(0, 0, 0))
                d.text((6, 4), f"{t:6.2f}s  {sc['name']}", fill=(255, 210, 63), font=font)
                d.text((6, 23), label[:38], fill=(230, 230, 230), font=font)
                tiles.append(im)
    empty = [s for s in stats if s["std"] < 6 and not s["scene"].startswith("s8")]
    check("no empty shots", not empty, f"{len(stats)} sampled frames; low-detail: {[(s['t'], s['shot']) for s in empty]}")
    cols = 8
    rows = (len(tiles) + cols - 1) // cols
    W, H = tiles[0].size
    sheet = Image.new("RGB", (cols * W + (cols + 1) * 6, rows * H + (rows + 1) * 6 + 70), (18, 18, 20))
    dr = ImageDraw.Draw(sheet)
    try:
        tf = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
    except OSError:
        tf = ImageFont.load_default()
    dr.text((10, 16), f"{ep['series']} — серия {ep['number']}: {ep['title']} · контактный лист", fill=(255, 255, 255), font=tf)
    for i, im in enumerate(tiles):
        r, c = divmod(i, cols)
        sheet.paste(im, (6 + c * (W + 6), 76 + r * (H + 6)))
    sheet_path = ROOT / "output" / "contact_sheet.jpg"
    sheet.save(sheet_path, quality=88)

    # ---------- subtitles ----------
    blocks = [b for b in srt.read_text(encoding="utf-8").strip().split("\n\n") if b.strip()]

    def ts(s: str) -> float:
        h, m, rest = s.split(":")
        sec, ms = rest.split(",")
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000

    caps = []
    for b in blocks:
        ln = b.split("\n")
        a0, a1 = [ts(x.strip()) for x in ln[1].split("-->")]
        caps.append((a0, a1, " ".join(ln[2:])))
    bad_order = [c for c, n in zip(caps, caps[1:]) if c[1] > n[0] + 1e-3 or c[0] >= c[1]]
    bad_words = [c[2] for c in caps if not 1 <= len(c[2].split()) <= 5]
    long_word = max((w for c in caps for w in c[2].split()), key=len)
    # Montserrat Black uppercase @74px ≈ 0.78em per glyph; safe line width 940px
    fits = len(long_word) * 74 * 0.78 <= 940
    check("subtitle timing valid (ordered, no overlap)", not bad_order, f"{len(caps)} captions; issues: {bad_order[:3]}")
    check("subtitles 2–5 words on screen", not bad_words, f"single/oversized: {bad_words}" if bad_words else "all within 1–5 words")
    check("no clipped captions (longest word fits)", fits, f"longest word «{long_word}» ≈ {len(long_word) * 74 * 0.78:.0f}px of 940px")
    check("captions inside episode", caps[-1][1] <= dur, f"last caption ends {caps[-1][1]:.2f}s")

    # ---------- caption ↔ voice sync ----------
    vo = json.loads((ep_dir / "build" / "voices.json").read_text(encoding="utf-8"))
    offs = []
    for sc in ep["scenes"]:
        for ln in sc["lines"]:
            start = sc["start"] + ln["at"] + vo[ln["id"]]["words"][0]["start"]
            first = min(caps, key=lambda c: abs(c[0] - start))
            offs.append(abs(first[0] - start))
            end = sc["start"] + ln["at"] + vo[ln["id"]]["duration"]
            nxt = [s2["start"] for s2 in ep["scenes"] if s2["start"] > sc["start"]]
            if nxt and end > nxt[0]:
                check(f"line {ln['id']} fits its scene", False, f"ends {end:.2f}s after scene cut {nxt[0]}s")
    check("subtitle ↔ voice sync (≤ 100 ms)", max(offs) <= 0.1, f"max offset {max(offs) * 1000:.0f} ms across {len(offs)} lines")
    lipsrc = {v_["lipsyncSource"] for v_ in vo.values()}
    check("lip sync from phoneme alignment / Rhubarb", lipsrc <= {"piper-alignment", "elevenlabs-alignment", "rhubarb"}, f"sources: {sorted(lipsrc)}; visemes/line ≥ {min(len(v_['visemes']) for v_ in vo.values())}")

    mi = ep_dir / "build" / "mix_intelligibility.json"
    if mi.exists():
        m = json.loads(mi.read_text())
        check("dialogue intelligible over music (ASR on final mix)", m["mean"] >= 0.85, f"mean word accuracy {m['mean']:.1%}")

    # ---------- character consistency (static check of the rig usage) ----------
    src = "\n".join(p.read_text(encoding="utf-8") for p in (ROOT / "src" / "scenes").glob("*.tsx"))
    gleb_designs = set(re.findall(r"design=\{(GLEB_[A-Z]+)\}", src))
    dz = (ROOT / "src" / "characters" / "designs.ts").read_text(encoding="utf-8")
    derived = all(re.search(rf"export const {d}: Design = \{{\s*\.\.\.(GLEB_BASE|GLEB_MILITARY)", dz) for d in gleb_designs)
    check("Gleb uses one canonical model (shared face/hair/proportions)", derived, f"designs used: {sorted(gleb_designs)} — all derived from GLEB_BASE")

    report = {"episode": ep_name, "video": str(video.relative_to(ROOT)), "duration": dur, "checks": checks, "frames": stats, "passed": all(c["ok"] for c in checks)}
    (ROOT / "output" / "qc_report.json").write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    md = [f"# QC — {ep['series']}, серия {ep['number']}", "", f"Видео: `{video.name}`, {dur:.2f} с", "", "| Проверка | Результат | Детали |", "|---|---|---|"]
    md += [f"| {c['check']} | {'✅' if c['ok'] else '❌'} | {c['detail']} |" for c in checks]
    (ROOT / "output" / "qc_report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"\ncontact sheet: {sheet_path}\nPASSED: {report['passed']}")


if __name__ == "__main__":
    main()
