#!/usr/bin/env python3
"""Turn a plain-text screenplay into an episode.json skeleton.

Input format (same as the series bible):

    Название: «ГЛЕБ. КОНТРАКТ».
    Сцена 1 — Хук (0:00–0:08)
    Тёмная посадка. ...            ← direction text (kept as notes)
    Диктор:
    «Глеб хотел управлять ...»
    Глеб: «А когда начнётся ...?»

Usage:
    python scripts/parse_script.py script.txt episode_02 [--number 2]

Creates episodes/<id>/episode.json with scenes, timings, lines, speakers
and a guessed scene component (reuse of existing locations). Line start
times are spread evenly inside each scene; after generate_voices.py has
run you can tune `at` values by hand. Existing files are never overwritten
without --force.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

SPEAKERS = {
    "диктор": "narrator",
    "рассказчик": "narrator",
    "глеб": "gleb",
    "командир": "commander",
    "инструктор": "instructor",
    "представитель": "rep",
}
COMPONENT_HINTS = [
    ("хук", "Hook"),
    ("колледж", "College"),
    ("агитац", "Agitation"),
    ("подпис", "Signing"),
    ("учебн", "Training"),
    ("распредел", "Assignment"),
    ("отправк", "Transport"),
    ("транспорт", "Transport"),
    ("финал", "EndCard"),
]
DEFAULT_VOICES = json.loads((ROOT / "episodes" / "episode_01" / "episode.json").read_text(encoding="utf-8"))["voices"]


def tsec(s: str) -> float:
    m, sec = s.split(":")
    return int(m) * 60 + float(sec)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("episode_id")
    ap.add_argument("--number", type=int, default=None)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    text = Path(args.script).read_text(encoding="utf-8")

    title = re.search(r"Название:\s*«?([^»\n]+)»?", text)
    scene_re = re.compile(r"^Сцена\s+(\d+)\s*[—-]\s*(.+?)\s*\((\d+:\d+)\s*[–-]\s*(\d+:\d+)\)", re.M)
    heads = list(scene_re.finditer(text))
    scenes = []
    for i, h in enumerate(heads):
        body = text[h.end() : heads[i + 1].start() if i + 1 < len(heads) else len(text)]
        start, end = tsec(h.group(3)), tsec(h.group(4))
        name = h.group(2).strip()
        comp = next((c for k, c in COMPONENT_HINTS if k in name.lower()), "College")
        lines = []
        # "Speaker:" followed by «quote» on the same or next lines
        for m in re.finditer(r"^([А-ЯЁA-Z][а-яёa-z]+):\s*\n?\s*«([^»]+)»", body, re.M):
            spk = SPEAKERS.get(m.group(1).lower())
            if not spk:
                continue
            lines.append({"speaker": spk, "text": m.group(2).strip().replace("…", ".")})
        notes = re.sub(r"^([А-ЯЁA-Z][а-яёa-z]+):\s*\n?\s*«[^»]+»", "", body, flags=re.M).strip()
        dur = end - start
        for k, ln in enumerate(lines):
            ln["id"] = f"s{i + 1}_{ln['speaker'][0]}{k + 1}"
            ln["at"] = round(0.6 + k * (dur - 1.2) / max(1, len(lines)), 2)
            ln["keywords"] = []
        scenes.append(
            {
                "id": f"s{i + 1}_{comp.lower()}",
                "name": name,
                "component": comp,
                "duration": round(dur, 3),
                "start": round(start, 3),
                "music": "neutral",
                "ambience": [],
                "lines": lines,
                "notes": notes[:2000],
                "shots": [[0, round(dur, 3), name]],
                "events": {},
            }
        )
    ep = {
        "id": args.episode_id,
        "series": "УРОКИ ВЫЖИВАНИЯ",
        "number": args.number or int(re.sub(r"\D", "", args.episode_id) or 1),
        "title": title.group(1).strip() if title else args.episode_id,
        "fps": 30,
        "width": 1080,
        "height": 1920,
        "disclaimer": "История вымышлена. Совпадения случайны.",
        "next": "",
        "voices": DEFAULT_VOICES,
        "scenes": scenes,
        "duration": round(sum(s["duration"] for s in scenes), 3),
    }
    out = ROOT / "episodes" / args.episode_id / "episode.json"
    if out.exists() and not args.force:
        raise SystemExit(f"{out} exists (use --force)")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(ep, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{len(scenes)} scenes, {sum(len(s['lines']) for s in scenes)} lines → {out}")


if __name__ == "__main__":
    main()
