"""
Logo B v4 — Nocturne, frameless, no moon, no lamp.
CEO: 月亮跟 app 没什么联系；右下角的光不要。
Stance: the only anchor is the warm lit windows — they ARE the app.
  "somebody's home, tuned in" = the single sentence the icon tells.

Composition:
- Deep navy→ink gradient, cool but low-chroma (no radial moonlight glow)
- Distant soft ridge for depth
- 4 stark near-building silhouettes (bottom 40%)
- ONE hero window: larger, brighter, slightly higher chroma — the focal listener
- 4 quieter lit windows around it (not a grid, deliberate asymmetry)
- Warm ambient bloom around the hero window only (the signal)
- Subtle vignette
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math
import os

SUPER = 4
FINAL = 1024
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))


def blur(layer, r):
    return layer.filter(ImageFilter.GaussianBlur(radius=r))


def logo_b4():
    w = h = SIZE
    y, x = np.ogrid[:h, :w]

    # -------- sky: cool ink, subtle top→bottom, no moonlight highlight --------
    ty = (y / h)
    top = np.array([10, 14, 26], dtype=float)   # deep ink
    mid = np.array([16, 20, 34], dtype=float)
    bot = np.array([22, 24, 38], dtype=float)   # slight haze near skyline
    k1 = np.clip(ty / 0.68, 0, 1)
    upper = top * (1 - k1) + mid * k1
    k2 = np.clip((ty - 0.68) / 0.32, 0, 1)
    lower = mid * (1 - k2) + bot * k2
    mask_upper = (ty < 0.68).astype(float)
    blended = upper * mask_upper + lower * (1 - mask_upper)
    arr = np.broadcast_to(blended, (h, w, 3)).copy()

    # subtle grain
    rng = np.random.default_rng(11)
    arr += rng.normal(0, 1.1, arr.shape)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    result = Image.fromarray(arr, "RGB").convert("RGBA")

    # -------- distant soft ridge (depth — pushes skyline forward) --------
    ridgeL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dR = ImageDraw.Draw(ridgeL)
    ridge_pts = [(0, SIZE)]
    rng2 = np.random.default_rng(5)
    n = 14
    for i in range(n + 1):
        rx = int(SIZE * i / n)
        base_y = SIZE * 0.70
        wobble = int(SIZE * 0.014 * math.sin(i * 1.7) + SIZE * 0.008 * rng2.random())
        ridge_pts.append((rx, int(base_y + wobble)))
    ridge_pts.append((SIZE, SIZE))
    dR.polygon(ridge_pts, fill=(14, 18, 30, 255))
    result = Image.alpha_composite(result, ridgeL)

    # -------- near buildings: 4 stark silhouettes --------
    sky = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dSk = ImageDraw.Draw(sky)
    near_dark = (6, 9, 17, 255)
    # (xf, roof_top_fraction, widthf)
    buildings = [
        (0.04, 0.58, 0.14),
        (0.20, 0.66, 0.12),
        (0.48, 0.50, 0.18),   # hero building — tallest, holds the hero window
        (0.72, 0.62, 0.24),
    ]
    for xf, hf, wf in buildings:
        bx0 = int(SIZE * xf)
        bx1 = int(SIZE * (xf + wf))
        by0 = int(SIZE * hf)
        dSk.rectangle([bx0, by0, bx1, SIZE], fill=near_dark)
    result = Image.alpha_composite(result, sky)

    # -------- HERO window: the focal listener --------
    # No halo/bloom — circular glow reads as moon. The window itself is
    # the only warmth, with a very tight rectangular spill shaped like
    # light leaking from a window frame.
    hero_cx = int(SIZE * 0.555)
    hero_cy = int(SIZE * 0.60)
    hero_w = SUPER * 24
    hero_h = SUPER * 36

    # rectangular-ish spill (slight halo that follows window shape, not circular)
    spill = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dSp = ImageDraw.Draw(spill)
    sw = hero_w * 2
    sh = hero_h * 2
    dSp.rectangle([hero_cx - sw, hero_cy - sh,
                   hero_cx + sw, hero_cy + sh],
                  fill=(255, 188, 110, 55))
    spill = blur(spill, SUPER * 18)
    result = Image.alpha_composite(result, spill)

    # -------- quieter lit windows (4 — asymmetric, not a grid) --------
    # (xf, yf, ww_super, hh_super, alpha)
    quiet = [
        (0.075, 0.715, SUPER * 7, SUPER * 11, 235),
        (0.098, 0.805, SUPER * 7, SUPER * 11, 210),
        (0.232, 0.745, SUPER * 6, SUPER * 10, 225),
        (0.830, 0.740, SUPER * 8, SUPER * 12, 240),
        (0.880, 0.855, SUPER * 6, SUPER * 10, 215),
    ]
    warm = (255, 196, 124)
    quietL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dQ = ImageDraw.Draw(quietL)
    for xf, yf, ww, hh, al in quiet:
        lx = int(SIZE * xf)
        ly = int(SIZE * yf)
        dQ.rectangle([lx, ly, lx + ww, ly + hh], fill=warm + (al,))
    # soft halo behind quiet windows
    quietGlow = blur(quietL.copy(), SUPER * 6)
    result = Image.alpha_composite(result, quietGlow)
    result = Image.alpha_composite(result, quietL)

    # -------- draw hero window ON TOP so it reads crispest --------
    heroL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dH = ImageDraw.Draw(heroL)
    hx0 = hero_cx - hero_w // 2
    hx1 = hero_cx + hero_w // 2
    hy0 = hero_cy - hero_h // 2
    hy1 = hero_cy + hero_h // 2
    # warm fill with a tiny lighter core (frosted interior feel)
    dH.rectangle([hx0, hy0, hx1, hy1], fill=(255, 206, 140, 255))
    dH.rectangle([hx0 + SUPER * 2, hy0 + SUPER * 2,
                  hx1 - SUPER * 2, hy0 + hero_h // 2 - SUPER * 2],
                 fill=(255, 220, 170, 255))
    result = Image.alpha_composite(result, heroL)

    # -------- vignette (soft, symmetric) --------
    vig = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dV = ImageDraw.Draw(vig)
    for i in range(14):
        a = int(7 * (i + 1))
        inset = int(SIZE * 0.012 * (14 - i))
        dV.rectangle([inset, inset, SIZE - inset, SIZE - inset],
                     outline=(0, 0, 0, a), width=SUPER * 6)
    vig = blur(vig, SUPER * 30)
    result = Image.alpha_composite(result, vig)

    return result.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("Rendering B v4 (no moon, no lamp)…")
    img = logo_b4()
    img.save(os.path.join(OUT, "B4_nocturne_windows.png"), "PNG", optimize=True)
    print("Done.")
