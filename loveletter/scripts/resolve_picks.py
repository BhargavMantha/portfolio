#!/usr/bin/env python3
"""Resolve content/picks.json to real files and write content/shortlist.json
plus review sheets of the picks. Originals are only ever read.

usage: resolve_picks.py <project_root>
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageOps, ImageStat

EXTS = (".jpg", ".jpeg", ".JPG", ".JPEG", ".png")


def find(folder: str, stem: str):
    for ext in EXTS:
        p = os.path.join(folder, stem + ext)
        if os.path.exists(p):
            return p
    return None


def sharpness(im: Image.Image) -> float:
    g = ImageOps.grayscale(im)
    g.thumbnail((1200, 1200))
    return round(ImageStat.Stat(g.filter(ImageFilter.FIND_EDGES)).var[0], 1)


def main() -> int:
    root = sys.argv[1]
    cfg = json.load(open(os.path.join(root, "content", "picks.json")))
    folders = {
        k: os.path.join(cfg["roots"][v.split("/", 1)[0]], *v.split("/")[1:])
        for k, v in cfg["folders"].items()
    }
    out, missing, thumbs = [], [], []
    for p in cfg["picks"]:
        src = find(folders[p["folder"]], p["stem"])
        if not src:
            missing.append(p["id"])
            continue
        im = ImageOps.exif_transpose(Image.open(src))
        e = {k: v for k, v in p.items() if k not in ("folder", "stem")}
        e.update(source=src, w=im.width, h=im.height, sharpness=sharpness(im))
        out.append(e)
        t = im.copy()
        t.thumbnail((590, 590))
        thumbs.append((p["id"], e["sharpness"], t))

    ids = [e["id"] for e in out]
    assert len(ids) == len(set(ids)), "duplicate ids"
    json.dump(out, open(os.path.join(root, "content", "shortlist.json"), "w"), indent=2)

    sheets = os.path.join(root, "content", "sheets")
    os.makedirs(sheets, exist_ok=True)
    cols, rows, cell, lab = 4, 3, 600, 24
    for page, start in enumerate(range(0, len(thumbs), cols * rows)):
        sheet = Image.new("RGB", (cols * cell, rows * (cell + lab)), (20, 20, 28))
        d = ImageDraw.Draw(sheet)
        for i, (pid, sh, t) in enumerate(thumbs[start : start + cols * rows]):
            c, r = i % cols, i // cols
            sheet.paste(t, (c * cell + (cell - t.width) // 2, r * (cell + lab) + (cell - t.height) // 2))
            d.text((c * cell + 8, r * (cell + lab) + cell + 4), f"{pid}  sharp={sh}", fill=(240, 230, 200))
        sheet.save(os.path.join(sheets, f"picks-{page + 1:02d}.jpg"), quality=85)

    print(f"resolved {len(out)}  missing {missing}")
    by = {}
    for e in out:
        by.setdefault(e["chapter"], []).append(e)
    print({k: len(v) for k, v in by.items()})
    print("years in home:", sorted({e.get("year") for e in by.get("home", [])}))
    soft = sorted(out, key=lambda e: e["sharpness"])[:8]
    print("softest:", [(e["id"], e["sharpness"]) for e in soft])
    return 0


if __name__ == "__main__":
    sys.exit(main())
