#!/usr/bin/env python3
"""Run several edge detectors on the kotodama background and emit comparable outputs."""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
IMAGE = ROOT / 'public' / 'kotodama_bg.png'
OUT_DIR = ROOT / 'tools' / 'scene-bbox' / 'edges'
OUT_DIR.mkdir(parents=True, exist_ok=True)


def invert(img: np.ndarray) -> np.ndarray:
    return 255 - img


def save_gray(name: str, gray: np.ndarray) -> None:
    cv2.imwrite(str(OUT_DIR / name), gray)


def save_color(name: str, bgr: np.ndarray) -> None:
    cv2.imwrite(str(OUT_DIR / name), bgr)


def canny_variant(gray: np.ndarray, lo: int, hi: int) -> np.ndarray:
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    return cv2.Canny(blurred, lo, hi, L2gradient=True)


def sobel(gray: np.ndarray) -> np.ndarray:
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    mag = cv2.magnitude(gx, gy)
    mag = cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
    return mag


def laplacian(gray: np.ndarray) -> np.ndarray:
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    lap = cv2.Laplacian(blurred, cv2.CV_32F, ksize=3)
    lap = cv2.convertScaleAbs(lap)
    return lap


def scharr(gray: np.ndarray) -> np.ndarray:
    gx = cv2.Scharr(gray, cv2.CV_32F, 1, 0)
    gy = cv2.Scharr(gray, cv2.CV_32F, 0, 1)
    mag = cv2.magnitude(gx, gy)
    return cv2.normalize(mag, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)


def overlay_on_image(base_bgr: np.ndarray, edges_gray: np.ndarray, color=(46, 230, 230)) -> np.ndarray:
    mask = edges_gray > 60
    out = base_bgr.copy()
    layer = np.zeros_like(out)
    layer[mask] = color
    return cv2.addWeighted(out, 0.6, layer, 0.8, 0)


def collage(panels):
    """Stack panels in 2 columns. panels: list[(title, image)]."""
    pad = 24
    label_h = 60
    font = cv2.FONT_HERSHEY_DUPLEX

    # normalize all to 3-channel
    normed = []
    for title, img in panels:
        if img.ndim == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        normed.append((title, img))

    # downscale so collage stays sane
    target_w = 1280
    rescaled = []
    for title, img in normed:
        h, w = img.shape[:2]
        scale = target_w / w
        nh = int(round(h * scale))
        rescaled.append((title, cv2.resize(img, (target_w, nh), interpolation=cv2.INTER_AREA)))

    rows = []
    for i in range(0, len(rescaled), 2):
        chunk = rescaled[i:i + 2]
        cells = []
        for title, img in chunk:
            h, w = img.shape[:2]
            cell = np.zeros((h + label_h, w, 3), dtype=np.uint8)
            cell[:label_h] = (18, 8, 31)
            cv2.putText(cell, title, (16, label_h - 18), font, 0.9, (255, 255, 255), 2, cv2.LINE_AA)
            cell[label_h:label_h + h] = img
            cells.append(cell)
        if len(cells) == 1:
            row = cells[0]
        else:
            row = np.hstack(cells)
        rows.append(row)

    max_w = max(r.shape[1] for r in rows)
    padded = []
    for r in rows:
        if r.shape[1] < max_w:
            pad_right = np.zeros((r.shape[0], max_w - r.shape[1], 3), dtype=np.uint8)
            padded.append(np.hstack([r, pad_right]))
        else:
            padded.append(r)
    canvas = np.vstack(padded)
    return canvas


def main():
    bgr = cv2.imread(str(IMAGE), cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    canny_soft = canny_variant(gray, 40, 120)
    canny_med = canny_variant(gray, 80, 200)
    canny_hard = canny_variant(gray, 120, 260)
    sob = sobel(gray)
    lap = laplacian(gray)
    sch = scharr(gray)

    save_gray('canny_soft_40_120.png', canny_soft)
    save_gray('canny_med_80_200.png', canny_med)
    save_gray('canny_hard_120_260.png', canny_hard)
    save_gray('sobel.png', sob)
    save_gray('laplacian.png', lap)
    save_gray('scharr.png', sch)

    save_gray('canny_soft_inverted.png', invert(canny_soft))
    save_gray('canny_med_inverted.png', invert(canny_med))

    save_color('overlay_canny_med.png', overlay_on_image(bgr, canny_med))
    save_color('overlay_sobel.png', overlay_on_image(bgr, sob, color=(120, 80, 255)))

    panels = [
        ('Canny soft 40/120', canny_soft),
        ('Canny medium 80/200', canny_med),
        ('Canny hard 120/260', canny_hard),
        ('Sobel magnitude', sob),
        ('Scharr magnitude', sch),
        ('Overlay Canny medium', overlay_on_image(bgr, canny_med)),
    ]
    comp = collage(panels)
    cv2.imwrite(str(OUT_DIR / 'compare_grid.png'), comp)

    print('outputs:')
    for f in sorted(OUT_DIR.iterdir()):
        print(' -', f.relative_to(ROOT))


if __name__ == '__main__':
    main()
