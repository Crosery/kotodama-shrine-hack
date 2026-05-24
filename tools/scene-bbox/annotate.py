#!/usr/bin/env python3
"""Render BBOX annotations on the kotodama scene image."""
from __future__ import annotations

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
BBOX_PATH = ROOT / 'tools' / 'scene-bbox' / 'bbox.json'
IMAGE_PATH = ROOT / 'public' / 'kotodama_bg.png'
OUT_PATH = ROOT / 'tools' / 'scene-bbox' / 'kotodama_bg_annotated.png'
LEGEND_PATH = ROOT / 'tools' / 'scene-bbox' / 'kotodama_bg_legend.png'
FONT_PATH = '/System/Library/Fonts/Hiragino Sans GB.ttc'

CATEGORY_COLOR = {
    'torii':              (255, 80, 110),
    'shrine_building':    (255, 140, 70),
    'lantern':            (255, 215, 90),
    'tree':               (140, 220, 140),
    'stairs':             (180, 180, 220),
    'path':               (130, 200, 240),
    'wall':               (200, 200, 200),
    'decor':              (210, 130, 230),
    'nature':             (110, 200, 160),
    'background':         (120, 120, 160),
    'interactable_point': (60, 230, 230),
}


def color_for(region):
    base = CATEGORY_COLOR.get(region['category'], (255, 255, 255))
    if region.get('interactable'):
        return (60, 230, 230)
    return base


def draw_annotations(img, data):
    draw = ImageDraw.Draw(img, 'RGBA')
    font_main = ImageFont.truetype(FONT_PATH, 30)
    font_meta = ImageFont.truetype(FONT_PATH, 22)

    for r in data['regions']:
        c = color_for(r)
        x = r['bbox']['x']
        y = r['bbox']['y']
        w = r['bbox']['w']
        h = r['bbox']['h']
        rect_outline = c + (255,)
        rect_fill = c + (50,)
        draw.rectangle([x, y, x + w, y + h], outline=rect_outline, width=6, fill=rect_fill)

        label = r['label_zh']
        kind = r['category']
        tag = f"{label}  [{kind}]"
        if r.get('interactable'):
            tag = '[I] ' + tag

        bbox_text = draw.textbbox((0, 0), tag, font=font_main)
        tw = bbox_text[2] - bbox_text[0]
        th = bbox_text[3] - bbox_text[1]
        pad = 8
        tx = x + 4
        ty = max(0, y - th - 2 * pad - 2)
        if ty < 0:
            ty = y + 4
        draw.rectangle(
            [tx, ty, tx + tw + 2 * pad, ty + th + 2 * pad],
            fill=(15, 8, 30, 220),
            outline=rect_outline,
            width=2,
        )
        draw.text((tx + pad, ty + pad - 4), tag, fill=(255, 255, 255, 255), font=font_main)

        id_text = r['id']
        id_box = draw.textbbox((0, 0), id_text, font=font_meta)
        iw = id_box[2] - id_box[0]
        ih = id_box[3] - id_box[1]
        idx = x + w - iw - 12
        idy = y + h - ih - 10
        draw.rectangle(
            [idx - 4, idy - 4, idx + iw + 6, idy + ih + 6],
            fill=(0, 0, 0, 170),
            outline=rect_outline,
            width=1,
        )
        draw.text((idx, idy - 2), id_text, fill=(220, 240, 255, 255), font=font_meta)


def draw_legend(data):
    width = 1600
    line_h = 56
    pad = 40
    entries = data['regions']
    height = pad * 2 + line_h * (len(entries) + 2)
    img = Image.new('RGB', (width, height), (12, 8, 31))
    draw = ImageDraw.Draw(img, 'RGBA')
    font_head = ImageFont.truetype(FONT_PATH, 36)
    font_row = ImageFont.truetype(FONT_PATH, 26)

    draw.text((pad, pad), f"言灵神社场景 BBOX 列表（共 {len(entries)} 个）", fill=(255, 255, 255), font=font_head)

    y = pad + line_h + 6
    for r in entries:
        c = color_for(r) + (255,)
        draw.rectangle([pad, y + 8, pad + 28, y + 36], fill=c, outline=(255, 255, 255, 180), width=2)
        bbox = r['bbox']
        kind = r['category']
        flag = ' [I]' if r.get('interactable') else ''
        line = f"{r['id']}  ·  {r['label_zh']}  ·  {kind}{flag}  ·  ({bbox['x']},{bbox['y']}) {bbox['w']}×{bbox['h']}"
        draw.text((pad + 50, y + 6), line, fill=(230, 230, 240), font=font_row)
        y += line_h
    img.save(LEGEND_PATH)


def main():
    if not BBOX_PATH.exists():
        print(f"bbox file missing: {BBOX_PATH}", file=sys.stderr)
        sys.exit(1)
    data = json.loads(BBOX_PATH.read_text())
    img = Image.open(IMAGE_PATH).convert('RGB')
    draw_annotations(img, data)
    img.save(OUT_PATH, optimize=True)
    draw_legend(data)
    print(f"annotated: {OUT_PATH}")
    print(f"legend:    {LEGEND_PATH}")


if __name__ == '__main__':
    main()
