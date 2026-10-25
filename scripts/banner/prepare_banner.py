#!/usr/bin/env python3
"""Prepare the official NATRIA VPN banner for compositing.

  prepare_banner.py [assets/banner/NATRIA_VPN.mp4]

- removes the green chroma key → assets/banner/natria_keyed.webm (VP9 + alpha)
- extracts the banner's own audio unchanged → assets/banner/natria_audio.wav
- writes assets/banner/banner_meta.json (size, fps, duration, green colour)

The banner's animation, timing and sound are not altered (speed 1.0).
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "banner"


def probe(path: Path) -> dict:
    r = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


def main() -> None:
    src = Path(sys.argv[1]) if len(sys.argv) > 1 else OUT / "NATRIA_VPN.mp4"
    info = probe(src)
    v = next(s for s in info["streams"] if s["codec_type"] == "video")
    num, den = map(int, v["r_frame_rate"].split("/"))
    meta = {
        "source": src.name,
        "width": int(v["width"]),
        "height": int(v["height"]),
        "fps": num / den,
        "duration": float(info["format"]["duration"]),
        "frames": int(v.get("nb_frames", 0)),
        "key": "0x00FE00",
        "hasAudio": any(s["codec_type"] == "audio" for s in info["streams"]),
    }
    # chroma key + spill suppression on the antialiased edges; alpha kept in VP9
    vf = "chromakey=0x00FE00:0.16:0.06,despill=type=green:mix=0.6:expand=0.05,format=yuva420p"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vf", vf, "-an", "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                    "-b:v", "0", "-crf", "18", "-row-mt", "1", "-auto-alt-ref", "0", str(OUT / "natria_keyed.webm")], check=True)
    if meta["hasAudio"]:
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vn", "-c:a", "pcm_s16le", "-ar", "48000", str(OUT / "natria_audio.wav")], check=True)
    (OUT / "banner_meta.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
