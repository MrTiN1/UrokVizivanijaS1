#!/usr/bin/env python3
"""XTTS-v2 (Coqui, non-commercial CPML licence — accepted by the project owner)
with built-in studio speakers (synthetic, not clones of real people).
Usage: .venv-xtts/bin/python xtts_samples.py <out_dir> --list | "<speaker>" ...
Writes <out_dir>/xtts_<speaker>_<i>.wav per sentence (24 kHz)."""
import os, sys
os.environ["COQUI_TOS_AGREED"] = "1"
import torch
from TTS.api import TTS

TEXT = [
    "Глеб хотел управлять беспилотниками.",
    "Но вместо пульта ему выдали автомат.",
    "Ещё недавно он сидел за компьютером в колледже.",
    "Теперь его везли туда, где любая ошибка могла стать последней.",
]
out = sys.argv[1]
torch.set_num_threads(4)
tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
if sys.argv[2] == "--list":
    print(tts.speakers)
    raise SystemExit
for spk in sys.argv[2:]:
    for i, t in enumerate(TEXT):
        p = f"{out}/xtts_{spk.replace(' ', '_')}_{i}.wav"
        if not os.path.exists(p):
            tts.tts_to_file(text=t, speaker=spk, language="ru", file_path=p, temperature=0.6, speed=0.92)
    print("done", spk, flush=True)
