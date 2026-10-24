# QC — УРОКИ ВЫЖИВАНИЯ, серия 1

Видео: `episode_01.mp4`, 120.00 с

| Проверка | Результат | Детали |
|---|---|---|
| resolution | ✅ | 1080×1920 |
| frame rate | ✅ | 30.000 fps |
| duration 90–120 s | ✅ | 120.00 s (script 120 s) |
| video codec H.264 | ✅ | h264 High yuvj420p |
| audio track AAC | ✅ | aac 48000 Hz 2 ch |
| loudness for Shorts (-14 LUFS ±1.5) | ✅ | I=-14.2 LUFS, true peak -1.3 dBFS |
| no clipping (true peak ≤ -1 dBFS) | ✅ | -1.3 dBFS |
| no unintended black frames | ✅ | black segments [(114.333, 115.3)]; allowed = scripted fade-out [(113.0, 121)] |
| no frozen stretches > 2 s (every shot animates) | ✅ | none |
| no empty shots | ✅ | 52 sampled frames; low-detail: [] |
| subtitle timing valid (ordered, no overlap) | ✅ | 40 captions; issues: [] |
| subtitles 2–5 words on screen | ✅ | all within 1–5 words |
| no clipped captions (longest word fits) | ✅ | longest word «беспилотниками» ≈ 808px of 940px |
| captions inside episode | ✅ | last caption ends 108.48s |
| subtitle ↔ voice sync (≤ 100 ms) | ✅ | max offset 60 ms across 11 lines |
| lip sync from phoneme alignment / Rhubarb | ✅ | sources: ['piper-alignment']; visemes/line ≥ 10 |
| dialogue intelligible over music (ASR on final mix) | ✅ | mean word accuracy 92.2% |
| Gleb uses one canonical model (shared face/hair/proportions) | ✅ | designs used: ['GLEB_CIVIL', 'GLEB_MILITARY', 'GLEB_RECRUIT'] — all derived from GLEB_BASE |
