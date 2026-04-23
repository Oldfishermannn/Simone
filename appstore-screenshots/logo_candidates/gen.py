"""
Simone AppIcon candidates.
A — Radio Dial (electronic fm tuner, 5 station color dots, cream pointer)
B — Nocturne Window (city window at night, moon, distant skyline, warm lamp glow)
Design context: Fog City Nocturne · dark · side-lit · object-feel · restrained warmth.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import math
import os

SUPER = 4
FINAL = 1024
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))


# ---------- shared: deep fog-blue background with side light ----------
def make_background(side=(0.30, 0.28), hi=(48, 60, 78), lo=(13, 17, 25), falloff=0.78):
    w = h = SIZE
    cx, cy = side[0] * w, side[1] * h
    y, x = np.ogrid[:h, :w]
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    rmax = math.hypot(w, h)
    t = np.clip(d / (rmax * falloff), 0, 1)
    t = t[:, :, None]
    c0 = np.array(hi, dtype=float)
    c1 = np.array(lo, dtype=float)
    arr = c0 * (1 - t) + c1 * t
    # subtle grain so no perfectly flat gradient
    rng = np.random.default_rng(7)
    arr = np.clip(arr + rng.normal(0, 1.6, arr.shape), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def composite(layers):
    base = layers[0]
    for L in layers[1:]:
        base = Image.alpha_composite(base, L)
    return base


def blur_layer(layer, radius):
    return layer.filter(ImageFilter.GaussianBlur(radius=radius))


# ---------- A — Radio Dial ----------
def logo_a():
    bg = make_background(side=(0.32, 0.26), hi=(52, 64, 82), lo=(12, 16, 24))

    # dial geometry
    cx = int(SIZE * 0.50)
    cy = int(SIZE * 0.74)
    outer_r = int(SIZE * 0.43)
    inner_r = int(SIZE * 0.355)

    # cream palette (tinted toward warm ivory, not white)
    cream = (238, 228, 206)
    cream_dim = (212, 200, 178)

    crisp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dC = ImageDraw.Draw(crisp)

    # --- dial face: double concentric arc band, top semicircle (180° → 360°) ---
    outer_bb = [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r]
    inner_bb = [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r]
    dC.arc(outer_bb, 180, 360, fill=cream + (255,), width=SUPER * 4)
    dC.arc(inner_bb, 180, 360, fill=cream_dim + (180,), width=SUPER * 2)

    # --- ticks between bands ---
    tick_a0, tick_a1 = 198, 342
    n_ticks = 29  # every 5°
    for i in range(n_ticks):
        a = tick_a0 + i * (tick_a1 - tick_a0) / (n_ticks - 1)
        r = math.radians(a)
        major = (i % 2 == 0)
        r_in = inner_r + SUPER * 8
        r_out = outer_r - SUPER * 8 if major else outer_r - SUPER * 22
        x0 = cx + r_in * math.cos(r)
        y0 = cy + r_in * math.sin(r)
        x1 = cx + r_out * math.cos(r)
        y1 = cy + r_out * math.sin(r)
        dC.line(
            [(x0, y0), (x1, y1)],
            fill=cream + (235 if major else 160,),
            width=SUPER * 3 if major else SUPER * 2,
        )

    # --- 5 station color dots above the outer arc ---
    stations = [
        (212, (188, 148, 110)),  # Lo-fi  奶茶棕
        (241, (140, 122, 154)),  # Jazz   烟灰紫
        (270, (168,  78,  86)),  # R&B    酒红
        (299, (214, 138,  92)),  # Rock   暖橙
        (328, (112, 190, 210)),  # Electronic 霓虹青
    ]
    dot_r = outer_r + SUPER * 26

    glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dG = ImageDraw.Draw(glow)
    for a, color in stations:
        r = math.radians(a)
        px = cx + dot_r * math.cos(r)
        py = cy + dot_r * math.sin(r)
        # soft halo
        halo_r = SUPER * 42
        for rr in range(6, 0, -1):
            alpha = int(22 * (7 - rr))
            dG.ellipse(
                [px - halo_r * rr * 0.4, py - halo_r * rr * 0.4,
                 px + halo_r * rr * 0.4, py + halo_r * rr * 0.4],
                fill=color + (alpha,),
            )
        # core dot
        core = SUPER * 13
        dC.ellipse([px - core, py - core, px + core, py + core], fill=color + (255,))
        # tiny highlight sparkle
        hl = SUPER * 4
        dC.ellipse(
            [px - core * 0.55, py - core * 0.55, px - core * 0.55 + hl, py - core * 0.55 + hl],
            fill=(255, 240, 220, 210),
        )

    # blur the halos
    glow = blur_layer(glow, radius=SUPER * 12)

    # --- pointer: cream, from near center outward to angle 275° (just past top) ---
    p_angle = 275
    r = math.radians(p_angle)
    p_inner_r = SUPER * 24
    p_outer_r = outer_r - SUPER * 48
    x0 = cx + p_inner_r * math.cos(r)
    y0 = cy + p_inner_r * math.sin(r)
    x1 = cx + p_outer_r * math.cos(r)
    y1 = cy + p_outer_r * math.sin(r)

    # pointer glow
    pointer_glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dPG = ImageDraw.Draw(pointer_glow)
    for w_mult, al in [(14, 28), (7, 55)]:
        dPG.line([(x0, y0), (x1, y1)], fill=(255, 220, 170, al), width=SUPER * w_mult)
    pointer_glow = blur_layer(pointer_glow, radius=SUPER * 8)

    # crisp pointer shaft
    dC.line([(x0, y0), (x1, y1)], fill=(250, 235, 205, 255), width=SUPER * 3)

    # pointer tip — warm ember
    tip = SUPER * 18
    for rr in range(7, 0, -1):
        al = int(22 * (8 - rr))
        dG.ellipse(
            [x1 - tip * rr * 0.45, y1 - tip * rr * 0.45,
             x1 + tip * rr * 0.45, y1 + tip * rr * 0.45],
            fill=(255, 200, 130, al),
        )
    dC.ellipse([x1 - tip, y1 - tip, x1 + tip, y1 + tip], fill=(255, 222, 170, 255))
    dC.ellipse([x1 - tip * 0.4, y1 - tip * 0.9, x1 + tip * 0.2, y1 - tip * 0.3],
               fill=(255, 248, 228, 230))

    # --- small brushed-brass hub at dial center ---
    hub_r = SUPER * 38
    # hub base gradient: use small numpy gradient
    hub = Image.new("RGBA", (hub_r * 2, hub_r * 2), (0, 0, 0, 0))
    hArr = np.zeros((hub_r * 2, hub_r * 2, 4), dtype=np.uint8)
    yy, xx = np.ogrid[:hub_r * 2, :hub_r * 2]
    dd = np.sqrt((xx - hub_r) ** 2 + (yy - hub_r) ** 2)
    mask = dd <= hub_r
    # brass gradient: lighter top-left → darker bottom-right
    tl = np.array([178, 142, 96])
    br = np.array([102,  78,  52])
    ux = np.clip((xx - hub_r) / hub_r, -1, 1)
    uy = np.clip((yy - hub_r) / hub_r, -1, 1)
    factor = np.clip((ux + uy) * 0.5 + 0.5, 0, 1)[..., None]
    col = tl[None, None, :] * (1 - factor) + br[None, None, :] * factor
    hArr[..., :3] = col
    hArr[..., 3] = np.where(mask, 255, 0)
    hub = Image.fromarray(hArr, "RGBA")
    crisp.paste(hub, (cx - hub_r, cy - hub_r), hub)
    # hub inner dot
    dC.ellipse([cx - SUPER * 10, cy - SUPER * 10, cx + SUPER * 10, cy + SUPER * 10],
               fill=(40, 32, 22, 255))

    # --- vignette: darken corners slightly ---
    vig = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dV = ImageDraw.Draw(vig)
    for i in range(14):
        a = int(9 * (i + 1))
        inset = int(SIZE * 0.02 * (14 - i))
        dV.rectangle([inset, inset, SIZE - inset, SIZE - inset], outline=(0, 0, 0, a), width=SUPER * 6)
    vig = blur_layer(vig, radius=SUPER * 30)

    final = composite([bg, glow, pointer_glow, crisp, vig])
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- B — Nocturne Window ----------
def logo_b():
    bg = make_background(side=(0.20, 0.22), hi=(46, 58, 78), lo=(11, 15, 22))

    w_w = int(SIZE * 0.55)
    w_h = int(SIZE * 0.76)
    w_x = (SIZE - w_w) // 2
    w_y = (SIZE - w_h) // 2 + int(SIZE * 0.02)

    # ---- night sky inside window ----
    # deep navy gradient: darker up top, slight urban haze at bottom
    sky = np.zeros((w_h, w_w, 3), dtype=np.uint8)
    for yy in range(w_h):
        t = yy / w_h
        top = np.array([14, 20, 34])
        mid = np.array([22, 26, 40])
        bot = np.array([34, 32, 44])  # faint urban glow
        if t < 0.6:
            k = t / 0.6
            c = top * (1 - k) + mid * k
        else:
            k = (t - 0.6) / 0.4
            c = mid * (1 - k) + bot * k
        sky[yy, :] = c
    sky_img = Image.fromarray(sky, "RGB").convert("RGBA")

    # moon (crescent) in upper-left of window
    moon_cx = int(w_w * 0.27)
    moon_cy = int(w_h * 0.23)
    moon_r = SUPER * 34
    moonL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dM = ImageDraw.Draw(moonL)
    # halo
    halo_r = moon_r * 4
    for rr in range(7, 0, -1):
        al = int(7 * (8 - rr))
        dM.ellipse([moon_cx - halo_r * rr * 0.35, moon_cy - halo_r * rr * 0.35,
                    moon_cx + halo_r * rr * 0.35, moon_cy + halo_r * rr * 0.35],
                   fill=(242, 234, 212, al))
    # moon body
    dM.ellipse([moon_cx - moon_r, moon_cy - moon_r,
                moon_cx + moon_r, moon_cy + moon_r], fill=(238, 228, 208, 255))
    # crescent cutout (shifted darker ellipse)
    sh_off = int(moon_r * 0.32)
    dM.ellipse([moon_cx - moon_r + sh_off, moon_cy - moon_r - SUPER * 2,
                moon_cx + moon_r + sh_off, moon_cy + moon_r - SUPER * 2],
               fill=(20, 26, 40, 255))
    moonL = blur_layer(moonL, radius=SUPER * 1)  # slight softening

    # stars: a few faint specks in upper panes
    starL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dS = ImageDraw.Draw(starL)
    rng = np.random.default_rng(42)
    for _ in range(18):
        sx = int(rng.random() * w_w)
        sy = int(rng.random() * w_h * 0.45)
        sr = SUPER * (1 + int(rng.random() * 2))
        al = int(140 + rng.random() * 100)
        dS.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(230, 228, 218, al))

    # ---- distant skyline silhouette ----
    skyL = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dSk = ImageDraw.Draw(skyL)
    dark = (9, 12, 20, 255)
    # two layered skylines for depth
    # far layer (softer, higher contrast with sky)
    far_buildings = [
        (0.02, 0.62, 0.11),
        (0.14, 0.56, 0.07),
        (0.22, 0.64, 0.09),
        (0.32, 0.58, 0.14),
        (0.47, 0.62, 0.10),
        (0.58, 0.55, 0.08),
        (0.67, 0.62, 0.11),
        (0.79, 0.58, 0.07),
        (0.87, 0.63, 0.13),
    ]
    far_color = (14, 18, 28, 255)
    for xf, hf, wf in far_buildings:
        bx0 = int(w_w * xf)
        bx1 = int(w_w * (xf + wf))
        by0 = int(w_h * hf)
        by1 = w_h
        dSk.rectangle([bx0, by0, bx1, by1], fill=far_color)

    # near layer
    near_buildings = [
        (0.00, 0.70, 0.15),
        (0.13, 0.76, 0.09),
        (0.24, 0.66, 0.16),
        (0.42, 0.82, 0.08),
        (0.52, 0.72, 0.12),
        (0.66, 0.68, 0.14),
        (0.82, 0.78, 0.10),
        (0.93, 0.74, 0.08),
    ]
    for xf, hf, wf in near_buildings:
        bx0 = int(w_w * xf)
        bx1 = int(w_w * (xf + wf))
        by0 = int(w_h * hf)
        by1 = w_h
        dSk.rectangle([bx0, by0, bx1, by1], fill=dark)
        # warm windows: a few random small rects
        nw = max(1, int((bx1 - bx0) / (SUPER * 18)))
        nh = max(1, int((by1 - by0) / (SUPER * 22)))
        brng = np.random.default_rng(int(xf * 1000) + 17)
        for wi in range(nw):
            for hi in range(nh):
                if brng.random() < 0.30:
                    wx = bx0 + int((wi + 0.5) * (bx1 - bx0) / nw) - SUPER * 3
                    wy = by0 + int((hi + 0.4) * (by1 - by0) / nh) - SUPER * 5
                    ww = SUPER * 5
                    wh = SUPER * 8
                    warmth = (255, 195, 122, int(220 + brng.random() * 35))
                    dSk.rectangle([wx, wy, wx + ww, wy + wh], fill=warmth)

    # a tiny warm glow from windows (very subtle)
    window_glow = Image.new("RGBA", (w_w, w_h), (0, 0, 0, 0))
    dWG = ImageDraw.Draw(window_glow)
    for xf, hf, wf in near_buildings:
        bx0 = int(w_w * xf)
        bx1 = int(w_w * (xf + wf))
        by0 = int(w_h * hf)
        mid_x = (bx0 + bx1) // 2
        mid_y = by0 + SUPER * 30
        dWG.ellipse([mid_x - SUPER * 40, mid_y - SUPER * 40,
                     mid_x + SUPER * 40, mid_y + SUPER * 40], fill=(255, 180, 110, 45))
    window_glow = blur_layer(window_glow, radius=SUPER * 18)

    # compose the inside-window scene
    inside = Image.alpha_composite(sky_img, starL)
    inside = Image.alpha_composite(inside, moonL)
    inside = Image.alpha_composite(inside, window_glow)
    inside = Image.alpha_composite(inside, skyL)

    # paste inside onto background
    result = bg.copy()
    result.paste(inside, (w_x, w_y), inside)

    # ---- window frame (brass) ----
    dF = ImageDraw.Draw(result)
    f_t = SUPER * 9  # frame thickness
    brass = (152, 118, 76, 255)
    brass_hi = (194, 156, 102, 255)
    brass_lo = (88, 64, 40, 255)

    # outer frame strips
    # top
    dF.rectangle([w_x - f_t, w_y - f_t, w_x + w_w + f_t, w_y], fill=brass)
    # bottom
    dF.rectangle([w_x - f_t, w_y + w_h, w_x + w_w + f_t, w_y + w_h + f_t], fill=brass)
    # left
    dF.rectangle([w_x - f_t, w_y, w_x, w_y + w_h], fill=brass)
    # right
    dF.rectangle([w_x + w_w, w_y, w_x + w_w + f_t, w_y + w_h], fill=brass)

    # highlight on top/left (light from upper-left)
    dF.rectangle([w_x - f_t, w_y - f_t, w_x + w_w + f_t, w_y - f_t + SUPER * 2], fill=brass_hi)
    dF.rectangle([w_x - f_t, w_y - f_t, w_x - f_t + SUPER * 2, w_y + w_h + f_t], fill=brass_hi)
    # shadow on bottom/right
    dF.rectangle([w_x - f_t, w_y + w_h + f_t - SUPER * 2, w_x + w_w + f_t, w_y + w_h + f_t], fill=brass_lo)
    dF.rectangle([w_x + w_w + f_t - SUPER * 2, w_y - f_t, w_x + w_w + f_t, w_y + w_h + f_t], fill=brass_lo)

    # inner dividers: 1 vertical + 2 horizontal → 2×3 grid
    div = SUPER * 4
    vx = w_x + w_w // 2
    dF.rectangle([vx - div // 2, w_y, vx + div // 2, w_y + w_h], fill=brass)
    # small highlight on dividers
    dF.rectangle([vx - div // 2, w_y, vx - div // 2 + SUPER, w_y + w_h], fill=brass_hi)
    for i in [1, 2]:
        hy = w_y + int(w_h * i / 3)
        dF.rectangle([w_x, hy - div // 2, w_x + w_w, hy + div // 2], fill=brass)
        dF.rectangle([w_x, hy - div // 2, w_x + w_w, hy - div // 2 + SUPER], fill=brass_hi)

    # ---- warm room lamp halo (bottom-right, outside the window) ----
    lamp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dL = ImageDraw.Draw(lamp)
    lx, ly = int(SIZE * 0.87), int(SIZE * 0.88)
    for rr in range(10, 0, -1):
        al = int(5 * (11 - rr))
        r_here = SIZE * 0.20 * rr / 10
        dL.ellipse([lx - r_here, ly - r_here, lx + r_here, ly + r_here],
                   fill=(255, 196, 128, al))
    lamp = blur_layer(lamp, radius=SUPER * 26)

    # ---- vignette ----
    vig = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dV = ImageDraw.Draw(vig)
    for i in range(14):
        a = int(8 * (i + 1))
        inset = int(SIZE * 0.015 * (14 - i))
        dV.rectangle([inset, inset, SIZE - inset, SIZE - inset], outline=(0, 0, 0, a), width=SUPER * 6)
    vig = blur_layer(vig, radius=SUPER * 30)

    final = Image.alpha_composite(result, lamp)
    final = Image.alpha_composite(final, vig)
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("Rendering A…")
    a = logo_a()
    a.save(os.path.join(OUT, "A_radio_dial.png"), "PNG", optimize=True)
    print("Rendering B…")
    b = logo_b()
    b.save(os.path.join(OUT, "B_nocturne_window.png"), "PNG", optimize=True)
    print("Done.")
