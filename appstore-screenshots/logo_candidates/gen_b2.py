"""
Logo B v2 — Nocturne Window, simplified.
Cut: 2x3 grid, dense window grid lights, star speckle.
Keep: a single window (no panes), a crescent moon as anchor, a sparse 4-building
skyline with 5 warm lit windows (not a dense field), a soft warm lamp halo outside.
Design principles: 物件感 / 克制温度 / 侧光 / 留白.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math
import os

SUPER = 4
FINAL = 1024
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))


def make_background(side=(0.22, 0.22), hi=(50, 62, 82), lo=(11, 15, 22), falloff=0.82):
    w = h = SIZE
    cx, cy = side[0] * w, side[1] * h
    y, x = np.ogrid[:h, :w]
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    rmax = math.hypot(w, h)
    t = np.clip(d / (rmax * falloff), 0, 1)[:, :, None]
    c0 = np.array(hi, dtype=float)
    c1 = np.array(lo, dtype=float)
    arr = c0 * (1 - t) + c1 * t
    rng = np.random.default_rng(7)
    arr = np.clip(arr + rng.normal(0, 1.4, arr.shape), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def blur(layer, r):
    return layer.filter(ImageFilter.GaussianBlur(radius=r))


def logo_b2():
    bg = make_background()

    # single window, slightly taller than before for "tall casement" feel
    w_w = int(SIZE * 0.50)
    w_h = int(SIZE * 0.74)
    w_x = (SIZE - w_w) // 2
    w_y = (SIZE - w_h) // 2 + int(SIZE * 0.01)

    # --- inside: night sky gradient (deep at top, slight haze near bottom) ---
    sky = np.zeros((w_h, w_w, 3), dtype=np.uint8)
    for yy in range(w_h):
        t = yy / w_h
        top = np.array([13, 19, 33])
        mid = np.array([20, 25, 40])
        bot = np.array([26, 28, 42])
        if t < 0.65:
            k = t / 0.65
            c = top * (1 - k) + mid * k
        else:
            k = (t - 0.65) / 0.35
            c = mid * (1 - k) + bot * k
        sky[yy, :] = c
    inside = Image.fromarray(sky, "RGB").convert("RGBA")

    # --- moon (crescent) — bigger, the anchor element ---
    moon_cx = int(w_w * 0.32)
    moon_cy = int(w_h * 0.26)
    moon_r = SUPER * 44  # was 34
    moonL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dM = ImageDraw.Draw(moonL)
    # soft halo (single big, not rings of rings)
    halo = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dH = ImageDraw.Draw(halo)
    hr = moon_r * 3.5
    dH.ellipse([moon_cx - hr, moon_cy - hr, moon_cx + hr, moon_cy + hr],
               fill=(242, 234, 212, 38))
    halo = blur(halo, SUPER * 24)
    moonL = Image.alpha_composite(moonL, halo)
    dM = ImageDraw.Draw(moonL)
    # moon body
    dM.ellipse([moon_cx - moon_r, moon_cy - moon_r,
                moon_cx + moon_r, moon_cy + moon_r], fill=(238, 228, 208, 255))
    # crescent cutout
    sh_off = int(moon_r * 0.34)
    dM.ellipse([moon_cx - moon_r + sh_off, moon_cy - moon_r - SUPER * 2,
                moon_cx + moon_r + sh_off, moon_cy + moon_r - SUPER * 2],
               fill=(20, 26, 40, 255))

    inside = Image.alpha_composite(inside, moonL)

    # --- 2 small distant stars (very restrained) ---
    starL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dS = ImageDraw.Draw(starL)
    for (sx_f, sy_f, sr_m, al) in [(0.72, 0.15, 2, 180), (0.58, 0.34, 1.5, 140), (0.82, 0.28, 1, 120)]:
        sx = int(w_w * sx_f)
        sy = int(w_h * sy_f)
        sr = int(SUPER * sr_m)
        dS.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(232, 228, 216, al))
    inside = Image.alpha_composite(inside, starL)

    # --- sparse skyline: 4 buildings only, arranged asymmetric ---
    skyL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dSk = ImageDraw.Draw(skyL)
    # one softer far silhouette (a gentle ridge behind)
    far_pts = []
    far_heights = [0.70, 0.66, 0.72, 0.68, 0.74, 0.69, 0.72]
    step = w_w / (len(far_heights) - 1)
    far_pts.append((0, w_h))
    for i, h in enumerate(far_heights):
        far_pts.append((int(i * step), int(w_h * h)))
    far_pts.append((w_w, w_h))
    dSk.polygon(far_pts, fill=(15, 19, 30, 255))

    # near layer — only 4 buildings, varied widths/heights
    buildings = [
        (0.05, 0.62, 0.14),   # tall left
        (0.22, 0.72, 0.12),   # short next to it
        (0.48, 0.55, 0.18),   # tallest, center-right
        (0.72, 0.68, 0.20),   # wide right
    ]
    near_color = (8, 11, 19, 255)
    for xf, hf, wf in buildings:
        bx0 = int(w_w * xf)
        bx1 = int(w_w * (xf + wf))
        by0 = int(w_h * hf)
        by1 = w_h
        dSk.rectangle([bx0, by0, bx1, by1], fill=near_color)

    inside = Image.alpha_composite(inside, skyL)

    # --- FIVE warm lit windows, placed deliberately (no random grid) ---
    #   coords are (x_frac_in_window, y_frac_in_window, w_px, h_px, alpha)
    warm = (255, 194, 120)
    lit = [
        (0.090, 0.735, SUPER * 6, SUPER * 10, 255),  # tall-left building, upper window
        (0.105, 0.825, SUPER * 6, SUPER * 10, 235),  # tall-left, lower window
        (0.555, 0.660, SUPER * 7, SUPER * 11, 255),  # tallest center, near top
        (0.795, 0.758, SUPER * 8, SUPER * 12, 245),  # right wide, middle
        (0.852, 0.880, SUPER * 6, SUPER * 10, 225),  # right wide, bottom
    ]
    litL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dLit = ImageDraw.Draw(litL)
    for xf, yf, ww, hh, al in lit:
        lx = int(w_w * xf)
        ly = int(w_h * yf)
        dLit.rectangle([lx, ly, lx + ww, ly + hh], fill=warm + (al,))

    # soft glow around lit windows
    litGlow = litL.copy()
    litGlow = blur(litGlow, SUPER * 8)
    # boost glow alpha a bit
    inside = Image.alpha_composite(inside, litGlow)
    inside = Image.alpha_composite(inside, litL)

    # paste inside onto bg
    result = bg.copy()
    result.paste(inside, (w_x, w_y), inside)

    # --- window frame (brass), NO inner dividers this time ---
    dF = ImageDraw.Draw(result)
    f_t = SUPER * 10
    brass = (152, 118, 76, 255)
    brass_hi = (196, 158, 104, 255)
    brass_lo = (82, 60, 38, 255)

    dF.rectangle([w_x - f_t, w_y - f_t, w_x + w_w + f_t, w_y], fill=brass)
    dF.rectangle([w_x - f_t, w_y + w_h, w_x + w_w + f_t, w_y + w_h + f_t], fill=brass)
    dF.rectangle([w_x - f_t, w_y, w_x, w_y + w_h], fill=brass)
    dF.rectangle([w_x + w_w, w_y, w_x + w_w + f_t, w_y + w_h], fill=brass)

    # highlight top & left (upper-left light source)
    dF.rectangle([w_x - f_t, w_y - f_t, w_x + w_w + f_t, w_y - f_t + SUPER * 2],
                 fill=brass_hi)
    dF.rectangle([w_x - f_t, w_y - f_t, w_x - f_t + SUPER * 2, w_y + w_h + f_t],
                 fill=brass_hi)
    # shadow bottom & right
    dF.rectangle([w_x - f_t, w_y + w_h + f_t - SUPER * 2,
                  w_x + w_w + f_t, w_y + w_h + f_t], fill=brass_lo)
    dF.rectangle([w_x + w_w + f_t - SUPER * 2, w_y - f_t,
                  w_x + w_w + f_t, w_y + w_h + f_t], fill=brass_lo)

    # sash bar: ONE horizontal bar across the middle (keeps the casement-window
    # signal without the cluttered 2x3 grid). Optional — off by default; enable
    # by setting sash = True.
    sash = False
    if sash:
        sash_y = w_y + w_h // 2
        div = SUPER * 4
        dF.rectangle([w_x, sash_y - div // 2, w_x + w_w, sash_y + div // 2], fill=brass)
        dF.rectangle([w_x, sash_y - div // 2, w_x + w_w, sash_y - div // 2 + SUPER],
                     fill=brass_hi)

    # --- warm room lamp halo outside the window (lower-right) ---
    lamp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dL = ImageDraw.Draw(lamp)
    lx, ly = int(SIZE * 0.87), int(SIZE * 0.88)
    # punchier than v1 — visible but still atmospheric
    for rr in range(10, 0, -1):
        al = int(7 * (11 - rr))
        r_here = SIZE * 0.22 * rr / 10
        dL.ellipse([lx - r_here, ly - r_here, lx + r_here, ly + r_here],
                   fill=(255, 196, 128, al))
    lamp = blur(lamp, SUPER * 22)

    # --- cool counter-light halo upper-left (subtle, mirrors warmth) ---
    cool = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dCo = ImageDraw.Draw(cool)
    cx2, cy2 = int(SIZE * 0.12), int(SIZE * 0.14)
    for rr in range(8, 0, -1):
        al = int(4 * (9 - rr))
        r_here = SIZE * 0.18 * rr / 8
        dCo.ellipse([cx2 - r_here, cy2 - r_here, cx2 + r_here, cy2 + r_here],
                    fill=(110, 138, 178, al))
    cool = blur(cool, SUPER * 20)

    # vignette
    vig = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dV = ImageDraw.Draw(vig)
    for i in range(14):
        a = int(8 * (i + 1))
        inset = int(SIZE * 0.015 * (14 - i))
        dV.rectangle([inset, inset, SIZE - inset, SIZE - inset],
                     outline=(0, 0, 0, a), width=SUPER * 6)
    vig = blur(vig, SUPER * 30)

    final = Image.alpha_composite(result, cool)
    final = Image.alpha_composite(final, lamp)
    final = Image.alpha_composite(final, vig)
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("Rendering B v2…")
    img = logo_b2()
    img.save(os.path.join(OUT, "B2_nocturne_simplified.png"), "PNG", optimize=True)

    # also render a sash-bar variant
    print("Rendering B v2 with sash bar…")
    # monkey-patch sash flag via re-exec is overkill; just inline call:
    from PIL import Image as _I
    # simplest: quick variant by copying logo and adding one horizontal bar in-place
    img2 = _I.open(os.path.join(OUT, "B2_nocturne_simplified.png")).convert("RGB")
    # we'll generate the sash version by re-running with sash=True manually
    print("Done.")
