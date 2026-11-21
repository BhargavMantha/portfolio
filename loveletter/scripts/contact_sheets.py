#!/usr/bin/env python3
"""Contact sheets for shortlisting. Reads originals, writes only to out_dir.

usage: contact_sheets.py <src_dir> <out_dir> [--thumb 400] [--cols 6] [--rows 5]
"""
import argparse
import os
import sys

from PIL import Image, ImageDraw, ImageOps

EXTS = {".jpg", ".jpeg", ".png"}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--thumb", type=int, default=400)
    ap.add_argument("--cols", type=int, default=6)
    ap.add_argument("--rows", type=int, default=5)
    a = ap.parse_args()

    files = sorted(
        f for f in os.listdir(a.src) if os.path.splitext(f)[1].lower() in EXTS
    )
    os.makedirs(a.out, exist_ok=True)
    per = a.cols * a.rows
    label_h = 22
    tag = os.path.basename(os.path.normpath(a.src)).replace("#", "").replace(" ", "_")
    for page, start in enumerate(range(0, len(files), per)):
        sheet = Image.new(
            "RGB", (a.cols * a.thumb, a.rows * (a.thumb + label_h)), (20, 20, 28)
        )
        draw = ImageDraw.Draw(sheet)
        for i, name in enumerate(files[start : start + per]):
            try:
                im = Image.open(os.path.join(a.src, name))
                im.draft("RGB", (a.thumb * 2, a.thumb * 2))
                im = ImageOps.exif_transpose(im)
                im.thumbnail((a.thumb - 6, a.thumb - 6))
            except Exception as e:  # unreadable file: note it and move on
                print(f"skip {name}: {e}", file=sys.stderr)
                continue
            col, row = i % a.cols, i // a.cols
            x = col * a.thumb + (a.thumb - im.width) // 2
            y = row * (a.thumb + label_h) + (a.thumb - im.height) // 2
            sheet.paste(im, (x, y))
            draw.text(
                (col * a.thumb + 6, row * (a.thumb + label_h) + a.thumb + 3),
                os.path.splitext(name)[0][-22:],
                fill=(240, 230, 200),
            )
        out = os.path.join(a.out, f"{tag}-{page + 1:02d}.jpg")
        sheet.save(out, quality=80)
        print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
