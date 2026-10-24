#!/usr/bin/env python3
"""Run ASR on the final mix at every voice line and compare with the script:
proves dialogue stays intelligible over music and effects."""
import json, sys
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "generate_audio"))
from generate_voices import asr_text, word_accuracy, read_wav, write_wav, ROOT  # noqa

ep = sys.argv[1] if len(sys.argv) > 1 else "episode_01"
cfg = json.loads((ROOT / "episodes" / ep / "episode.json").read_text())
vo = json.loads((ROOT / "episodes" / ep / "build" / "voices.json").read_text())
mix, sr = read_wav(ROOT / "episodes" / ep / "build" / "soundtrack.wav")
tmp = ROOT / "output" / "tmp" / "seg.wav"
res = []
for sc in cfg["scenes"]:
    for ln in sc["lines"]:
        a = sc["start"] + ln["at"]; b = a + vo[ln["id"]]["duration"]
        seg = mix[int(a * sr): int(b * sr)]
        write_wav(tmp, seg, sr)
        hyp = asr_text(tmp) or ""
        acc = word_accuracy(ln["text"], hyp)
        res.append({"id": ln["id"], "acc": round(acc, 3), "asr": hyp})
        print(f"{ln['id']:10s} {acc:5.0%}  {hyp}")
mean = float(np.mean([r["acc"] for r in res]))
print(f"mean word accuracy in final mix: {mean:.1%}")
(ROOT / "episodes" / ep / "build" / "mix_intelligibility.json").write_text(json.dumps({"mean": mean, "lines": res}, ensure_ascii=False, indent=1))
