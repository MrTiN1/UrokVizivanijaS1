# «Последний кадр» — «Звонок от себя»

Самостоятельный мистический триллер (110 с, 1080×1920, 30 fps, H.264, русский
язык), сделанный на конвейере проекта «Уроки выживания».

> **Перед публикацией:** укажите **@natriavpnbot** в шапке профиля; в описании
> ролика должен быть хэштег **#natriavpn** (готовый текст —
> `publication_description.txt`). Проверка соответствия правилам выполнена
> автоматически, окончательное решение принимает рекламодатель.

## Файлы

| Файл | Что это |
|---|---|
| `../zvonok_ot_sebya.mp4` | итоговый ролик |
| `../zvonok_ot_sebya_preview.mp4` | предварительная версия (540×960) |
| `subtitles.srt` | субтитры |
| `script.md` | сценарий с раскадровкой по планам |
| `contact_sheet.jpg` | контактный лист: по 2 кадра из каждого плана |
| `publication_description.txt` | описание публикации с #natriavpn |
| `../zvonok_ot_sebya_qc_report.md`, `../zvonok_ot_sebya_compliance_report.md`, `../zvonok_ot_sebya_banner_report.json` | технический контроль, правила NATRIA VPN, замеры баннера |

## Исходники

| Что | Где |
|---|---|
| Данные ролика (сцены, тайминги, реплики, голоса, звуки, баннер) | `episodes/zvonok_ot_sebya/episode.json` |
| Персонажи (Артём, Артём за дверью) | `src/characters/designs.ts` → `ARTEM`, `ARTEM_WET` (общий риг `src/characters/`) |
| Сцены | `src/scenes/zvonok/Scenes1to4.tsx`, `Scenes5to8.tsx`, общие `zcommon.tsx` |
| Квартира, прихожая, дверь, глазок, часы | `src/scenes/zvonok/world/Home.tsx` |
| Телефон: звонок, ошибка вызова, журнал, приложение камеры | `src/scenes/zvonok/world/ZPhone.tsx` |
| Озвучка (WAV + исходные MP3 ElevenLabs) | `assets/voices/zvonok_ot_sebya/` |
| Звуки (стук, вибрация, рингтон, гудки, помехи, скрип) | `scripts/generate_audio/sfx.py` |
| Баннер | `assets/banner/` + `src/components/NatriaBanner.tsx` |

## Пересборка

```bash
scripts/produce.sh zvonok_ot_sebya --skip-voices --preview
.venv/bin/python scripts/quality_check/compliance.py zvonok_ot_sebya
```
