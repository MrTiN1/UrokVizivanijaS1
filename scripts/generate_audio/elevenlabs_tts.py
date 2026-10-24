#!/usr/bin/env python3
"""ElevenLabs integration (key from env ELEVENLABS_API_KEY — never printed).

  elevenlabs_tts.py voices [query]          list your voices + shared library (Russian male)
  elevenlabs_tts.py say <voice_id> <out.mp3> "text" [stability] [style]
  elevenlabs_tts.py casting <model> <voice_id> [<voice_id> ...]   → output/voice_samples/el_<model>_<name>.mp3
  elevenlabs_tts.py usage                   characters used / monthly limit

Free tier: only premade voices work through the API (library voices and voice
design need a paid plan). The agent proxy may inject the key itself.

`synth_with_timestamps()` returns audio + per-character timings, used by
generate_voices.py (engine "elevenlabs") for exact subtitle/lip-sync timing.
"""
from __future__ import annotations

import base64
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io"
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
ROOT = Path(__file__).resolve().parents[2]


def _key() -> str:
    k = os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("XI_API_KEY")
    if not k:
        raise SystemExit("ELEVENLABS_API_KEY is not set (add it to the environment's secrets)")
    return k


def _req(method: str, path: str, body: dict | None = None, accept: str = "application/json") -> bytes:
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(API + path, data=data, method=method, headers={"xi-api-key": _key(), "Content-Type": "application/json", "Accept": accept})
    try:
        with urllib.request.urlopen(r, timeout=180) as resp:
            return resp.read()
    except urllib.error.HTTPError as e:
        raise SystemExit(f"ElevenLabs HTTP {e.code}: {e.read()[:400].decode(errors='replace')}")


def settings(stability: float = 0.42, style: float = 0.35, speed: float = 1.0) -> dict:
    # lower stability = livelier intonation; style adds expressiveness; speed 0.7–1.2
    return {"stability": stability, "similarity_boost": 0.8, "style": style, "use_speaker_boost": True, "speed": speed}


def synth(voice_id: str, text: str, out: Path, stability=0.42, style=0.35, fmt="mp3_44100_128", model: str | None = None) -> Path:
    body = {"text": text, "model_id": model or MODEL, "voice_settings": settings(stability, style), "language_code": "ru"}
    audio = _req("POST", f"/v1/text-to-speech/{voice_id}?output_format={fmt}", body, accept="audio/mpeg")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(audio)
    return out


def synth_with_timestamps(voice_id: str, text: str, out: Path, stability=0.42, style=0.35, fmt="mp3_44100_128", model: str | None = None, speed: float = 1.0):
    """Returns list of (char, start_s, end_s)."""
    body = {"text": text, "model_id": model or MODEL, "voice_settings": settings(stability, style, speed), "language_code": "ru"}
    js = json.loads(_req("POST", f"/v1/text-to-speech/{voice_id}/with-timestamps?output_format={fmt}", body))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(base64.b64decode(js["audio_base64"]))
    al = js.get("alignment") or js.get("normalized_alignment") or {}
    return list(zip(al.get("characters", []), al.get("character_start_times_seconds", []), al.get("character_end_times_seconds", [])))


def words_from_chars(chars) -> list[dict]:
    words, cur, t0, t1 = [], "", None, None
    for ch, a, b in chars:
        if ch.isspace():
            if cur:
                words.append({"w": cur, "start": round(t0, 3), "end": round(t1, 3)})
            cur, t0 = "", None
            continue
        if t0 is None:
            t0 = a
        cur += ch
        t1 = b
    if cur:
        words.append({"w": cur, "start": round(t0, 3), "end": round(t1, 3)})
    return words


def list_voices(query: str = "") -> None:
    mine = json.loads(_req("GET", "/v1/voices"))
    print("== your voices ==")
    for v in mine.get("voices", []):
        lab = v.get("labels", {})
        print(f"{v['voice_id']}  {v['name']:28s} {lab.get('gender', ''):7s} {lab.get('age', ''):12s} {lab.get('accent', '')} {lab.get('description', '')}")
    q = urllib.parse.urlencode({"language": "ru", "gender": "male", "page_size": 40, **({"search": query} if query else {})})
    shared = json.loads(_req("GET", f"/v1/shared-voices?{q}"))
    print("\n== shared library: Russian male ==")
    for v in shared.get("voices", []):
        print(f"{v['voice_id']}  {v['name'][:30]:30s} {v.get('age', ''):12s} {v.get('use_case', ''):18s} {v.get('descriptive', '')} {v.get('description', '')[:70]}")


TEXT = "Глеб хотел управлять беспилотниками. Но вместо пульта ему выдали автомат. ... Ещё недавно он сидел за компьютером в колледже. Теперь его везли туда, где любая ошибка могла стать последней."

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "voices"
    if cmd == "voices":
        list_voices(sys.argv[2] if len(sys.argv) > 2 else "")
    elif cmd == "say":
        vid, out, text = sys.argv[2:5]
        stab = float(sys.argv[5]) if len(sys.argv) > 5 else 0.42
        sty = float(sys.argv[6]) if len(sys.argv) > 6 else 0.35
        print(synth(vid, text, Path(out), stab, sty))
    elif cmd == "casting":
        model = sys.argv[2]
        names = {v["voice_id"]: v["name"].split(" ")[0].lower() for v in json.loads(_req("GET", "/v1/voices")).get("voices", [])}
        for vid in sys.argv[3:]:
            tag = model.replace("eleven_", "").replace("multilingual_", "")
            print(synth(vid, TEXT, ROOT / "output" / "voice_samples" / f"el_{tag}_{names.get(vid, vid)}.mp3", model=model))
    elif cmd == "usage":
        u = json.loads(_req("GET", "/v1/user/subscription"))
        print(f"{u['character_count']} / {u['character_limit']} characters ({u['tier']})")
