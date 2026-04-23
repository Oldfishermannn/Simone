"""
Logo B v3 — Nocturne, frameless.
Cut: the brass window frame (too heavy at icon size).
Keep: fog-blue sky, crescent moon as anchor, 4-building skyline, 5 warm lit windows,
      warm lamp halo lower-right, cool counter-light upper-left.
Composition: no frame — the whole icon IS the view. iOS's superellipse mask does
the silhouette; content is inset enough that clipping is invisible.
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


def logo_b3():
    # -------- sky background (full canvas) --------
    # Vertical gradient: deep navy at top → slight urban haze near bottom.
    # Also a side-lit radial highlight in the upper-left (cool moonlight feel).
    w = h = SIZE
    y, x = np.ogrid[:h, :w]

    # vertical axis
    ty = (y / h)
    top = np.array([12, 17, 30], dtype=float)   # deep navy
    mid = np.array([20, 24, 38], dtype=float)
    bot = np.array([30, 30, 44], dtype=float)   # urban haze toward bottom
    arr = np.zeros((h, w, 3), dtype=float)
    k1 = np.clip(ty / 0.65, 0, 1)
    upper = top * (1 - k1) + mid * k1
    k2 = np.clip((ty - 0.65) / 0.35, 0, 1)
    lower = mid * (1 - k2) + bot * k2
    mask_upper = (ty < 0.65).astype(float)
    blended = upper * mask_upper + lower * (1 - mask_upper)
    arr = np.broadcast_to(blended, (h, w, 3)).copy()

    # cool radial highlight from upper-left (moonlight spill)
    cx, cy = 0.24 * w, 0.22 * h
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    rmax = math.hypot(w, h)
    glow_t = np.clip(1 - d / (rmax * 0.55), 0, 1)
    # subtle — this is moonlight, not headlight
    arr += (glow_t[..., None] ** 2) * np.array([18, 22, 30])

    # warm radial highlight from lower-right (the reader's lamp in the room
    # behind us reflected faintly off the night)
    wx, wy = 0.88 * w, 0.90 * h
    d2 = np.sqrt((x - wx) ** 2 + (y - wy) ** 2)
    warm_t = np.clip(1 - d2 / (rmax * 0.42), 0, 1)
    arr += (warm_t[..., None] ** 2) * np.array([32, 22, 12])

    # grain
    rng = np.random.default_rng(7)
    arr += rng.normal(0, 1.2, arr.shape)

    arr = np.clip(arr, 0, 255).astype(np.uint8)
    result = Image.fromarray(arr, "RGB").convert("RGBA")

    # -------- moon (crescent) — anchor of the composition --------
    moon_cx = int(SIZE * 0.30)
    moon_cy = int(SIZE * 0.28)
    moon_r = SUPER * 52  # bigger than v2 now that it carries the frame's weight

    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dH = ImageDraw.Draw(halo)
    # soft two-pass halo: wide dim + tight bright
    hr1 = moon_r * 4.2
    dH.ellipse([moon_cx - hr1, moon_cy - hr1, moon_cx + hr1, moon_cy + hr1],
               fill=(242, 234, 212, 34))
    halo = blur(halo, SUPER * 30)
    halo2 = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dH2 = ImageDraw.Draw(halo2)
    hr2 = moon_r * 1.8
    dH2.ellipse([moon_cx - hr2, moon_cy - hr2, moon_cx + hr2, moon_cy + hr2],
                fill=(245, 238, 218, 58))
    halo2 = blur(halo2, SUPER * 12)
    result = Image.alpha_composite(result, halo)
    result = Image.alpha_composite(result, halo2)

    # moon body
    moonL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dM = ImageDraw.Draw(moonL)
    dM.ellipse([moon_cx - moon_r, moon_cy - moon_r,
                moon_cx + moon_r, moon_cy + moon_r], fill=(240, 230, 210, 255))
    # crescent shadow (shift an inner ellipse over)
    sh_off = int(moon_r * 0.34)
    dM.ellipse([moon_cx - moon_r + sh_off, moon_cy - moon_r - SUPER * 2,
                moon_cx + moon_r + sh_off, moon_cy + moon_r - SUPER * 2],
               fill=(17, 22, 36, 255))
    result = Image.alpha_composite(result, moonL)

    # -------- three very small stars (restrained) --------
    starL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dS = ImageDraw.Draw(starL)
    for (xf, yf, rm, al) in [
        (0.70, 0.18, 2.0, 180),
        (0.56, 0.33, 1.4, 140),
        (0.80, 0.27, 1.0, 120),
    ]:
        sx, sy = int(SIZE * xf), int(SIZE * yf)
        sr = int(SUPER * rm)
        dS.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(232, 228, 216, al))
    result = Image.alpha_composite(result, starL)

    # -------- distant soft ridge (depth layer) --------
    ridgeL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dR = ImageDraw.Draw(ridgeL)
    # polyline silhouette as a darker wave
    ridge_pts = [(0, SIZE)]
    rng2 = np.random.default_rng(3)
    n = 14
    for i in range(n + 1):
        rx = int(SIZE * i / n)
        base_y = SIZE * 0.72
        wobble = int(SIZE * 0.014 * math.sin(i * 1.7) + SIZE * 0.008 * rng2.random())
        ridge_pts.append((rx, int(base_y + wobble)))
    ridge_pts.append((SIZE, SIZE))
    dR.polygon(ridge_pts, fill=(16, 20, 32, 255))
    result = Image.alpha_composite(result, ridgeL)

    # -------- near skyline: 4 buildings, stark silhouettes --------
    sky = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dSk = ImageDraw.Draw(sky)
    near_dark = (7, 10, 18, 255)
    buildings = [
        (0.06, 0.64, 0.13),
        (0.20, 0.74, 0.10),
        (0.46, 0.56, 0.17),
        (0.68, 0.68, 0.22),
    ]
    for xf, hf, wf in buildings:
        bx0 = int(SIZE * xf)
        bx1 = int(SIZE * (xf + wf))
        by0 = int(SIZE * hf)
        dSk.rectangle([bx0, by0, bx1, SIZE], fill=near_dark)
    result = Image.alpha_composite(result, sky)

    # -------- FIVE warm lit windows (deliberate, not dense) --------
    lit = [
        (0.090, 0.740, SUPER * 6, SUPER * 10, 255),  # tall-left upper
        (0.105, 0.820, SUPER * 6, SUPER * 10, 230),  # tall-left lower
        (0.540, 0.670, SUPER * 7, SUPER * 11, 255),  # center-tall, near roof
        (0.755, 0.755, SUPER * 8, SUPER * 12, 245),  # right wide, middle
        (0.815, 0.875, SUPER * 6, SUPER * 10, 220),  # right wide, bottom
    ]
    warm = (255, 194, 120)
    litL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dLit = ImageDraw.Draw(litL)
    for xf, yf, ww, hh, al in lit:
        lx = int(SIZE * xf)
        ly = int(SIZE * yf)
        dLit.rectangle([lx, ly, lx + ww, ly + hh], fill=warm + (al,))

    # soft warm glow around windows
    litGlow = blur(litL.copy(), SUPER * 10)
    result = Image.alpha_composite(result, litGlow)
    result = Image.alpha_composite(result, litL)

    # -------- warm lamp spill lower-right, outside the scene --------
    lamp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dL = ImageDraw.Draw(lamp)
    lx, ly = int(SIZE * 0.86), int(SIZE * 0.88)
    for rr in range(10, 0, -1):
        al = int(6 * (11 - rr))
        r_here = SIZE * 0.22 * rr / 10
        dL.ellipse([lx - r_here, ly - r_here, lx + r_here, ly + r_here],
                   fill=(255, 198, 130, al))
    lamp = blur(lamp, SUPER * 26)
    result = Image.alpha_composite(result, lamp)

    # -------- vignette (soft) --------
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
    print("Rendering B v3 (frameless)…")
    img = logo_b3()
    img.save(os.path.join(OUT, "B3_nocturne_frameless.png"), "PNG", optimize=True)
    print("Done.")
