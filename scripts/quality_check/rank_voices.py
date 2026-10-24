#!/usr/bin/env python3
"""Rank voice samples by closeness to a reference narrator profile."""
import json, math, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from voice_profile import profile

ref = profile(sys.argv[1], asr=True)
rows = []
for f in sys.argv[2:]:
    p = profile(f, asr=True)
    d = (abs(12 * math.log2(p["f0_median_hz"] / ref["f0_median_hz"])) / 2.0          # semitones off
         + abs(p["f0_range_semitones"] - ref["f0_range_semitones"]) / 4.0           # intonation liveliness
         + abs(p["words_per_min_speech"] - ref["words_per_min_speech"]) / 20.0       # tempo
         + abs(math.log2(p["spectral_centroid_hz"] / ref["spectral_centroid_hz"])) * 2)  # timbre
    rows.append((d, p))
rows.sort(key=lambda r: r[0])
print(f"REF  f0={ref['f0_median_hz']} range={ref['f0_range_semitones']} wpm={ref['words_per_min_speech']} centroid={ref['spectral_centroid_hz']}")
out = []
for d, p in rows:
    print(f"{d:5.2f}  {p['file']:34s} f0={p['f0_median_hz']:6} range={p['f0_range_semitones']:5} wpm={p['words_per_min_speech']:5} centroid={p['spectral_centroid_hz']}")
    out.append({"distance": round(d, 2), **{k: p[k] for k in ('file', 'f0_median_hz', 'f0_range_semitones', 'words_per_min_speech', 'spectral_centroid_hz')}})
Path("output/voice_samples/ranking.json").write_text(json.dumps({"reference": ref, "ranking": out}, ensure_ascii=False, indent=1))
