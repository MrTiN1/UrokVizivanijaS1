#!/usr/bin/env python3
"""Chunk voice-line word timings into Shorts-style captions (2–5 words) and
write both the JSON used by the renderer and a standard .srt file."""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ep_name = sys.argv[1] if len(sys.argv) > 1 else "episode_01"
ep_dir = ROOT / "episodes" / ep_name
ep = json.loads((ep_dir / "episode.json").read_text(encoding="utf-8"))
vo = json.loads((ep_dir / "build" / "voices.json").read_text(encoding="utf-8"))

norm = lambda w: re.sub(r"[^а-яёa-z0-9]", "", w.lower()).replace("ё", "е")
caps = []
for sc in ep["scenes"]:
    for ln in sc["lines"]:
        info = vo[ln["id"]]
        base = sc["start"] + ln["at"]
        kws = {norm(k) for k in ln.get("keywords", [])}
        words = [dict(w, start=w["start"] + base, end=w["end"] + base, key=norm(w["w"]) in kws) for w in info["words"]]
        chunks, cur = [], []
        for w in words:
            text_len = sum(len(x["w"]) + 1 for x in cur) + len(w["w"])
            if cur and (len(cur) >= 4 or text_len > 24 or re.search(r"[.?!…]$", cur[-1]["w"]) or (re.search(r"[,:;]$", cur[-1]["w"]) and len(cur) >= 2)):
                chunks.append(cur); cur = []
            cur.append(w)
        if cur:
            if len(cur) == 1 and chunks and len(chunks[-1]) <= 3 and not re.search(r"[.?!]$", chunks[-1][-1]["w"]):
                chunks[-1] += cur
            else:
                chunks.append(cur)
        for c in chunks:
            caps.append({"line": ln["id"], "speaker": ln["speaker"], "start": round(c[0]["start"] - 0.06, 3), "end": round(c[-1]["end"] + 0.2, 3),
                         "words": [{"w": re.sub(r"[.,]$", "", x["w"]), "start": round(x["start"], 3), "end": round(x["end"], 3), "key": x["key"]} for x in c]})
caps.sort(key=lambda c: c["start"])
for a, b in zip(caps, caps[1:]):
    if b["start"] - a["end"] < 0.3 and a["line"] == b["line"]:
        a["end"] = b["start"]
    a["end"] = min(a["end"], b["start"])
(ep_dir / "build" / "subtitles.json").write_text(json.dumps(caps, ensure_ascii=False, indent=1), encoding="utf-8")

def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"
out = ROOT / "output" / f"{ep_name}.srt"
out.parent.mkdir(exist_ok=True)
with open(out, "w", encoding="utf-8") as f:
    for i, c in enumerate(caps, 1):
        f.write(f"{i}\n{ts(c['start'])} --> {ts(c['end'])}\n{' '.join(w['w'] for w in c['words'])}\n\n")
print(f"{len(caps)} captions -> {out}")
