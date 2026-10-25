# QC — УРОКИ ВЫЖИВАНИЯ, серия 1

Видео: `episode_01.mp4`, 110.00 с

| Проверка | Результат | Детали |
|---|---|---|
| resolution | ✅ | 1080×1920 |
| frame rate | ✅ | 30.000 fps |
| duration 110 s | ✅ | 110.000 s (script 110 s) |
| video codec H.264 | ✅ | h264 High yuv420p |
| audio track AAC | ✅ | aac 48000 Hz 2 ch |
| loudness for Shorts (-14 LUFS ±1.5) | ✅ | I=-14.4 LUFS, true peak -1.6 dBFS |
| no clipping (true peak ≤ -1 dBFS) | ✅ | -1.6 dBFS |
| no unintended black frames | ✅ | black segments [(107.6, 108.333)]; allowed = scripted fade-out [(107.3, 110.5)] |
| no frozen stretches > 2 s (every shot animates) | ✅ | none |
| no empty shots | ✅ | 64 sampled frames; low-detail: [] |
| subtitle timing valid (ordered, no overlap) | ✅ | 27 captions; issues: [] |
| subtitles 2–5 words on screen | ✅ | all within 1–5 words |
| no clipped captions (longest word fits) | ✅ | longest word «разговаривал» ≈ 693px of 940px |
| captions inside episode | ✅ | last caption ends 99.42s |
| subtitle ↔ voice sync (≤ 100 ms) | ✅ | max offset 60 ms across 9 lines |
| lip sync from phoneme alignment / Rhubarb | ✅ | sources: ['elevenlabs-alignment']; visemes/line ≥ 13 |
| dialogue intelligible over music (ASR on final mix) | ✅ | mean word accuracy 100.0% |
| Gleb uses one canonical model (shared face/hair/proportions) | ✅ | designs used: ['GLEB_CIVIL', 'GLEB_MILITARY', 'GLEB_RECRUIT'] — all derived from GLEB_BASE |
| official banner file supplied | ✅ | banner/NATRIA_VPN.mp4 → banner/natria_keyed.webm (1770×750, 7.2 s) |
| banner speed ≤ 1.3× | ✅ | playbackRate 1.0 |
| aspect ratio preserved | ✅ | 1140.0×483.1 (source 1770×750) |
| banner centred (config) | ✅ | centre [540, 960] vs frame centre [540, 960] |
| banner height fits frame (no vertical crop) | ✅ | y 718.5…1201.5 |
| visible banner area ≥ 25 % of frame | ✅ | 25.16% (521640 px of 2073600); box 1140×483, 30 px beyond each side edge |
| banner not distorted; side overscan small | ✅ | 30 px per side = 2.6% of width (needed to reach 25 % on a 9:16 frame) |
| banner appears at 00:55 (measured) | ✅ | measured start 55.000 s (config 55.0 s), frame error 5.1/255 |
| banner centred (measured) | ✅ | best alignment shift dx=0 dy=0 px |
| original animation timing kept (end frame matches) | ✅ | last opaque frame at 61.633 s (expected 61.633 s), error 4.4/255 → speed 1.0× |
| no visible chroma key (green residue) | ✅ | pure-green pixels in banner band: 0.0000% |
| no subtitles over the banner | ✅ | captions overlapping 55.0–62.2s: none (+ captions hidden in that window by design) |
| narration not masked by the banner (no lines during it) | ✅ | voice lines overlapping banner: none |
| single banner used | ✅ | one NatriaBanner instance in Episode.tsx |
