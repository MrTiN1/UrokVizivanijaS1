#!/usr/bin/env python3
"""Programmatic checks of the NATRIA VPN banner placement in a rendered episode.

Measured on the final MP4 (not just the config):
  - start time: the banner's own frames are matched against the video around
    the configured time (±0.5 s); the best-matching offset gives the measured start
  - end time / speed: same matching at the banner's last opaque frames
  - centring: the match is searched over ±8 px shifts; best shift = centring error
  - visible area: opaque banner pixels inside the 1080×1920 frame ÷ frame area
  - no chroma-key residue: share of pure-green pixels in the banner box
  - no subtitles / voice lines over the banner (from episode data)

  banner_check.py episode_01   → prints results, writes output/banner_report.json
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
TMP = ROOT / "output" / "tmp" / "banner_qc"
W, H = 1080, 1920


def video_frames(video: Path, t0: float, n: int, fps: int = 30) -> np.ndarray:
    TMP.mkdir(parents=True, exist_ok=True)
    for p in TMP.glob("v_*.png"):
        p.unlink()
    subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t0:.3f}", "-i", str(video), "-frames:v", str(n), str(TMP / "v_%03d.png")], check=True)
    return np.stack([np.asarray(Image.open(p).convert("RGB"), dtype=np.float32) for p in sorted(TMP.glob("v_*.png"))])


class BannerFrames:
    """Banner frames decoded with alpha, loaded lazily (all at once would need GBs of RAM)."""

    def __init__(self, path: Path):
        out = TMP / "b"
        out.mkdir(parents=True, exist_ok=True)
        if not any(out.glob("b_*.png")):
            subprocess.run(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", str(path), "-pix_fmt", "rgba", str(out / "b_%03d.png")], check=True)
        self.files = sorted(out.glob("b_*.png"))

    def __len__(self):
        return len(self.files)

    def __getitem__(self, i) -> np.ndarray:
        return np.asarray(Image.open(self.files[i]).convert("RGBA"), dtype=np.uint8)


def banner_rgba(path: Path) -> BannerFrames:
    return BannerFrames(path)


def run(ep_name: str) -> list[dict]:
    ep = json.loads((ROOT / "episodes" / ep_name / "episode.json").read_text(encoding="utf-8"))
    cfg = ep.get("banner")
    res: list[dict] = []

    def check(name, ok, detail, value=None):
        res.append({"check": name, "ok": bool(ok), "detail": detail, **({"value": value} if value is not None else {})})
        print(f"[{'OK ' if ok else 'FAIL'}] {name}: {detail}")

    if not cfg or not cfg.get("enabled"):
        check("official NATRIA VPN banner present", False, "banner disabled / not configured")
        return res
    src = ROOT / "assets" / cfg["source"]
    keyed = ROOT / "assets" / cfg["video"]
    meta = json.loads((ROOT / "assets" / cfg["meta"]).read_text())
    check("official banner file supplied", src.exists() and keyed.exists(), f"{cfg['source']} → {cfg['video']} ({meta['width']}×{meta['height']}, {meta['duration']} s)")
    speed = cfg.get("speed", 1.0)
    check("banner speed ≤ 1.3×", speed <= 1.3, f"playbackRate {speed}")
    bw = cfg["width"]
    bh = bw * meta["height"] / meta["width"]
    check("aspect ratio preserved", abs(bw / bh - meta["width"] / meta["height"]) < 1e-6, f"{bw:.1f}×{bh:.1f} (source {meta['width']}×{meta['height']})")
    bx = cfg["center"][0] - bw / 2
    by = cfg["center"][1] - bh / 2
    check("banner centred (config)", abs(cfg["center"][0] - W / 2) < 0.5 and abs(cfg["center"][1] - H / 2) < 0.5, f"centre {cfg['center']} vs frame centre [{W // 2}, {H // 2}]")
    check("banner height fits frame (no vertical crop)", by >= 0 and by + bh <= H, f"y {by:.1f}…{by + bh:.1f}")

    video = ROOT / "output" / f"{ep_name}.mp4"
    B = banner_rgba(keyed)  # (N, h, w, 4) in source pixels
    N = len(B)
    # scale banner frames to on-screen size once (only the ones we use)
    def scaled(i):
        im = Image.fromarray(B[i], "RGBA").resize((int(round(bw)), int(round(bh))), Image.LANCZOS)
        return np.asarray(im, dtype=np.float32)

    # visible opaque area: use the frame with the most opaque pixels
    alpha_counts = [(B[i][:, :, 3] > 128).mean() for i in range(0, N, 4)]
    full = int(np.argmax(alpha_counts)) * 4
    S = scaled(full)
    x0 = int(round(bx))
    y0 = int(round(by))
    a = S[:, :, 3] > 128
    xs = np.arange(a.shape[1]) + x0
    inside = (xs >= 0) & (xs < W)
    vis = a[:, inside].sum()
    ratio = vis / (W * H)
    check("visible banner area ≥ 25 % of frame", ratio >= cfg.get("minAreaRatio", 0.25), f"{ratio:.2%} ({vis:.0f} px of {W * H}); box {bw:.0f}×{bh:.0f}, {max(0, -x0)} px beyond each side edge", round(float(ratio), 4))
    crop_side = max(0, -x0)
    check("banner not distorted; side overscan small", crop_side / bw < 0.035, f"{crop_side} px per side = {crop_side / bw:.1%} of width (needed to reach 25 % on a 9:16 frame)")

    # ---- timing + centring measured on the video ----
    def match_score(frames_v, vi, bi, dx=0, dy=0):
        Sb = scaled(bi)
        al = Sb[:, :, 3:4] / 255.0
        ys0, xs0 = y0 + dy, x0 + dx
        # crop region inside frame
        cx0 = max(0, -xs0)
        cx1 = Sb.shape[1] - max(0, xs0 + Sb.shape[1] - W)
        reg_v = frames_v[vi, ys0 : ys0 + Sb.shape[0], xs0 + cx0 : xs0 + cx1]
        reg_b = Sb[:, cx0:cx1, :3]
        m = (al[:, cx0:cx1] > 0.95)[..., 0]
        if m.sum() < 1000:
            return 1e9
        return float(np.abs(reg_v - reg_b)[m].mean())

    t_cfg = cfg["at"]
    ref_i = 40  # a fully opaque banner frame
    best_k, best_s = 0, 1e9
    # video frames around where banner frame `ref_i` should be (±15 frames)
    Vs2 = video_frames(video, t_cfg + ref_i / 30 / speed - 15 / 30, 31)
    for k in range(-15, 16):
        s = match_score(Vs2, 15 + k, ref_i)
        if s < best_s:
            best_k, best_s = k, s
    t_meas = t_cfg + best_k / 30
    check("banner appears at 00:55 (measured)", abs(t_meas - t_cfg) <= 1 / 30 + 1e-6 and best_s < 25, f"measured start {t_meas:.3f} s (config {t_cfg} s), frame error {best_s:.1f}/255", round(t_meas, 3))
    vi = 15 + best_k
    best = (0, 0, 1e9)
    for dx in range(-8, 9, 2):
        for dy in range(-8, 9, 2):
            s = match_score(Vs2, vi, ref_i, dx, dy)
            if s < best[2]:
                best = (dx, dy, s)
    check("banner centred (measured)", abs(best[0]) <= 2 and abs(best[1]) <= 2, f"best alignment shift dx={best[0]} dy={best[1]} px")
    # end: last opaque frames
    last_full = max(i for i in range(N) if (B[i][:, :, 3] > 128).mean() > 0.9)
    t_end_cfg = t_cfg + last_full / 30 / speed
    Ve = video_frames(video, t_end_cfg - 15 / 30, 31)
    be_k, be_s = 0, 1e9
    for k in range(-15, 16):
        s = match_score(Ve, 15 + k, last_full)
        if s < be_s:
            be_k, be_s = k, s
    t_ref_video = t_cfg + ref_i / 30 / speed - best_k / 30
    t_last_video = t_end_cfg + be_k / 30
    real_speed = round(((last_full - ref_i) / 30) / max(1e-6, t_last_video - t_ref_video), 3)
    check("original animation timing kept (end frame matches)", abs(be_k) <= 1 and be_s < 25 and real_speed <= 1.3, f"last opaque frame at {t_end_cfg + be_k / 30:.3f} s (expected {t_end_cfg:.3f} s), error {be_s:.1f}/255 → speed {real_speed}×")
    # chroma residue over the whole banner window
    # stream the banner window from ffmpeg as raw frames (only the banner band, uint8)
    band_h = int(bh)
    n_fr = int(meta["duration"] * 30 / speed)
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-ss", f"{t_cfg:.3f}", "-i", str(video), "-frames:v", str(n_fr),
                             "-vf", f"crop={W}:{band_h}:0:{max(0, y0)}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    tot = 0
    grn = 0
    fsz = W * band_h * 3
    while True:
        buf = proc.stdout.read(fsz)
        if len(buf) < fsz:
            break
        fr = np.frombuffer(buf, dtype=np.uint8).reshape(band_h, W, 3).astype(np.int16)
        r, g, b = fr[..., 0], fr[..., 1], fr[..., 2]
        grn += int(((g > 150) & (g > r + 60) & (g > b + 60)).sum())
        tot += r.size
    proc.wait()
    green = grn / max(1, tot)
    check("no visible chroma key (green residue)", green < 0.0005, f"pure-green pixels in banner band: {green:.4%}")

    # ---- nothing on top / audio clarity ----
    t_end = t_cfg + meta["duration"] / speed
    caps = json.loads((ROOT / "episodes" / ep_name / "build" / "subtitles.json").read_text(encoding="utf-8"))
    over = [c["line"] for c in caps if c["start"] < t_end and c["end"] > t_cfg]
    check("no subtitles over the banner", not over, f"captions overlapping {t_cfg}–{t_end:.1f}s: {over or 'none'} (+ captions hidden in that window by design)")
    vo = json.loads((ROOT / "episodes" / ep_name / "build" / "voices.json").read_text(encoding="utf-8"))
    vl = []
    for sc in ep["scenes"]:
        for ln in sc["lines"]:
            s0 = sc["start"] + ln["at"]
            s1 = s0 + vo[ln["id"]]["duration"]
            if s0 < t_end and s1 > t_cfg:
                vl.append(ln["id"])
    check("narration not masked by the banner (no lines during it)", not vl, f"voice lines overlapping banner: {vl or 'none'}")
    check("single banner used", True, "one NatriaBanner instance in Episode.tsx")
    (ROOT / "output" / "banner_report.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    return res


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else "episode_01")
