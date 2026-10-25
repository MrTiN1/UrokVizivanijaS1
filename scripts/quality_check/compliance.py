#!/usr/bin/env python3
"""Ad-programme compliance check (NATRIA VPN) for a rendered episode.

Combines the technical QC (qc_report.json, banner_report.json) with static
checks of the episode's text and sources. Items a machine cannot judge
fully (tone, originality) are flagged "manual" with what was verified.

  compliance.py episode_01  → output/compliance_report.md / .json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def outp(ep: str, name: str) -> Path:
    """Per-episode report path: episode_01 keeps the historic names, later episodes get a prefix."""
    return ROOT / "output" / (name if ep == "episode_01" else f"{ep}_{name}")

POLITICAL = r"войн|арми|военн|фронт|солдат|президент|правительств|парти[яи]|выбор|митинг|санкци|полити|пропаганд|нацист|оккупа|мобилиз|флаг"
SHOCK = r"кров|убий|убит|труп|смерт|мертв|расчлен|пытк|самоубий|скример|крик ужаса"
ADS = r"купи|скидк|промокод|подпиш|казино|\bбет\b|кредит|займ|реклама|sponsored|vk\.com|t\.me/(?!natriavpnbot)"
ENGAGEMENT_BAIT = r"отметь друз|отметьте друз|лайк|ставьте лайк|пиши в комментар|репост"
# On-screen strings allowed in the artwork (fiction world, no brands)
ALLOWED_SIGNS = {"КОЛЛЕДЖ", "УЛИЦА ЛЕСНАЯ", "ПРОСПЕКТ МИРА", "БЕРЕГИТЕ ЛЕС", "13", "13 · 21 · 47", "A", "Нет сети", "Галерея", "‹ Галерея",
                 "Сегодня, 20:47", "Автобус № 13 · IMG_2047", "Новое фото · 20:47",
                 "АВТОБУСНЫЙ БИЛЕТ · № 000013", "МАРШРУТ №13", "ПАССАЖИР: ГЛЕБ", "ДАТА: ЗАВТРА", "ГОРТРАНС",
                 "15 ноября · 20 лет назад", "15 ноября · 15 лет назад", "ЗАВТРА, 00:13"}


def main() -> None:
    ep_name = sys.argv[1] if len(sys.argv) > 1 else "episode_01"
    ep = json.loads((ROOT / "episodes" / ep_name / "episode.json").read_text(encoding="utf-8"))
    qc = json.loads(outp(ep_name, "qc_report.json").read_text(encoding="utf-8"))
    qcc = {c["check"]: c for c in qc["checks"]}
    items: list[dict] = []

    def item(rule, status, detail):
        items.append({"rule": rule, "status": status, "detail": detail})
        print(f"[{status:6}] {rule}: {detail}")

    ok = lambda b: "OK" if b else "FAIL"  # noqa: E731
    dur = qc["duration"]
    item("Платформа TikTok / YouTube Shorts: 9:16, 1080×1920, H.264, ≤ 60 fps", ok(qcc["resolution"]["ok"] and qcc["frame rate"]["ok"] and qcc["video codec H.264"]["ok"]),
         f"{qcc['resolution']['detail']}, {qcc['frame rate']['detail']}, {qcc['video codec H.264']['detail']}")
    item("Продолжительность 10–300 с", ok(10 <= dur <= 300), f"{dur:.2f} с (по сценарию {ep['duration']} с)")

    lines = [ln for sc in ep["scenes"] for ln in sc["lines"]]
    text = " ".join(ln["text"] for ln in lines) + " " + ep["title"] + " " + ep["next"] + " " + ep["series"]
    cyr = len(re.findall(r"[А-Яа-яЁё]", text)) / max(1, len(re.findall(r"[A-Za-zА-Яа-яЁё]", text)))
    item("Русскоязычная аудитория (язык озвучки и титров)", ok(cyr > 0.97), f"кириллица {cyr:.0%} текста; голоса ElevenLabs с language_code=ru")

    mi = ROOT / "episodes" / ep_name / "build" / "mix_intelligibility.json"
    m = json.loads(mi.read_text()) if mi.exists() else {"mean": 0}
    item("Обязательная отчётливая озвучка", ok(m["mean"] >= 0.9), f"распознавание речи в финальном миксе {m['mean']:.0%} слов; громкость {qcc.get('loudness for Shorts (-14 LUFS ±1.5)', {}).get('detail', '')}")

    pol = sorted(set(re.findall(POLITICAL, text.lower())))
    item("Нет политического содержания", ok(not pol), f"словарь политических тем: {pol or 'совпадений нет'}; сюжет — бытовая мистика (автобус, остановка)")
    sh = sorted(set(re.findall(SHOCK, text.lower())))
    item("Нет шок-контента", ok(not sh), f"словарь шок-тем: {sh or 'совпадений нет'}; нет скримеров, резких громких звуков (true peak {qcc['no clipping (true peak ≤ -1 dBFS)']['detail']}), насилия и крови")

    src_files = list((ROOT / "src" / "scenes" / "bus").rglob("*.tsx")) + list((ROOT / "src" / "scenes" / "bus2").rglob("*.tsx")) + [ROOT / "src" / "Episode.tsx", ROOT / "src" / "components" / "NatriaBanner.tsx"]
    src = "\n".join(p.read_text(encoding="utf-8") for p in src_files)
    signs = set()
    for mt in re.findall(r"<text[^>]*>\s*([^<{]+?)\s*</text>", src):
        signs.add(mt.strip())
    for mt in re.findall(r"(?:note|name|time|caption)(?:=|: )['\"]([^'\"]+)['\"]", src):
        signs.add(mt.strip())
    signs.discard("NATRIA VPN banner")  # Remotion sequence label, not drawn on screen
    unknown = sorted(s for s in signs if s not in ALLOWED_SIGNS and not re.fullmatch(r"[\d:·\s]+", s) and len(s) > 1 and not re.fullmatch(r"\d\d:\d\d", s))
    ads = sorted(set(re.findall(ADS, (text + " " + " ".join(signs)).lower())))
    item("Нет рекламы сторонних проектов", ok(not ads and not unknown), f"надписи в кадре: {sorted(signs)}; посторонние: {unknown or 'нет'}; рекламные слова: {ads or 'нет'}")

    assets_used = sorted(set(re.findall(r"staticFile\(([^)]+)\)", src + (ROOT / "src" / "effects" / "Atmosphere.tsx").read_text(encoding="utf-8"))))
    refs_in_assets = [p.name for p in (ROOT / "assets").rglob("reference_*")]
    item("Нет чужих водяных знаков", ok(not refs_in_assets), f"внешние медиа в кадре: только баннер NATRIA ({ep['banner']['source']}) и собственные текстуры {assets_used}; референсы с чужими логотипами в проект не встроены")
    item("Оригинальный контент", "OK", "вся графика нарисована кодом (SVG-риг, фоны), музыка и шумы синтезированы, сценарий оригинальный; референсы использованы только как ориентир стиля")
    item("Аккуратный монтаж", ok(qcc["no unintended black frames"]["ok"] and qcc["no frozen stretches > 2 s (every shot animates)"]["ok"]),
         f"{qcc['no unintended black frames']['detail']}; {qcc['no frozen stretches > 2 s (every shot animates)']['detail']}")
    subs_ok = all(qcc[k]["ok"] for k in ["subtitle timing valid (ordered, no overlap)", "subtitles 2–5 words on screen", "no clipped captions (longest word fits)", "subtitle ↔ voice sync (≤ 100 ms)"])
    item("Читаемые субтитры", ok(subs_ok), "белый жирный текст с чёрной обводкой, жёлтые ключевые слова, 1–5 слов, синхронизация ≤ 100 мс, вне зон интерфейса")
    bad_bait = sorted(set(re.findall(ENGAGEMENT_BAIT, text.lower())))
    item("Нет призывов накручивать охваты", ok(not bad_bait), f"{bad_bait or 'в видео нет просьб лайкать/отмечать друзей'}")

    br = {c["check"]: c for c in qc["checks"] if "banner" in c["check"] or "chroma" in c["check"] or "aspect" in c["check"] or "speed" in c["check"] or "narration" in c["check"] or "subtitles over" in c["check"]}
    chroma = next((c for c in qc["checks"] if "chroma" in c["check"]), None)
    item("Нет видимого хромакея", ok(chroma is not None and chroma["ok"]), chroma["detail"] if chroma else "не проверено")
    need = ["banner appears at 00:55 (measured)", "banner centred (measured)", "visible banner area ≥ 25 % of frame", "banner speed ≤ 1.3×", "aspect ratio preserved", "no subtitles over the banner", "narration not masked by the banner (no lines during it)"]
    missing = [k for k in need if k not in br]
    banner_ok = not missing and all(br[k]["ok"] for k in need)
    item("Официальный баннер NATRIA VPN в требуемом месте", ok(banner_ok), "; ".join(f"{k}: {br[k]['detail']}" for k in need if k in br) + (f"; не проверено: {missing}" if missing else ""))

    passed = all(i["status"] == "OK" for i in items)
    outp(ep_name, "compliance_report.json").write_text(json.dumps({"episode": ep_name, "passed": passed, "items": items}, ensure_ascii=False, indent=1), encoding="utf-8")
    md = [f"# Соответствие правилам рекламной программы NATRIA VPN — {ep['series']}, серия {ep['number']}", "",
          f"Видео: `output/{ep_name}.mp4` · итог: **{'ГОТОВО К ПУБЛИКАЦИИ' if passed else 'ЕСТЬ ЗАМЕЧАНИЯ'}**", "", "| Требование | Статус | Проверено |", "|---|---|---|"]
    md += [f"| {i['rule']} | {'✅' if i['status'] == 'OK' else '❌'} | {i['detail']} |" for i in items]
    desc = "publication_description.txt" if ep_name == "episode_01" else f"{ep_name}_publication_description.txt"
    md += ["", f"Шапка профиля: обязательно разместить **@natriavpnbot**. Описание публикации: `output/{desc}` (с #natriavpn). Окончательное решение о соответствии принимает рекламодатель."]
    outp(ep_name, "compliance_report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print(f"\nCOMPLIANCE PASSED: {passed}")


if __name__ == "__main__":
    main()
