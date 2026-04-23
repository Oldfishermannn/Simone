"""
Simone AppIcon — v3 candidates (锐化记忆点).

Problem with B4: no single memorable shape, goes dark at 60px.
Goal: a shape you can sketch from memory, readable at 60px, branded to Simone.

C1 — Dial Reloaded:    A dial, cleaner. Pointer tip = one warm lamp.
C2 — Letter S:         Brand letter S with waveform bars inside.
C3 — Glowing Orb:      A warm core + concentric sound rings (radio signal).
C4 — Moon Waveform:    Crescent moon + radiating sound rings (moonlight as signal).
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import numpy as np
import math
import os

SUPER = 4
FINAL = 1024
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))


def make_background(side=(0.30, 0.28), hi=(48, 60, 78), lo=(10, 13, 20), falloff=0.78):
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
    rng = np.random.default_rng(7)
    arr = np.clip(arr + rng.normal(0, 1.6, arr.shape), 0, 255)
    return Image.fromarray(arr.astype(np.uint8), "RGB").convert("RGBA")


def blur_layer(layer, radius):
    return layer.filter(ImageFilter.GaussianBlur(radius=radius))


def vignette():
    vig = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dV = ImageDraw.Draw(vig)
    for i in range(14):
        a = int(9 * (i + 1))
        inset = int(SIZE * 0.02 * (14 - i))
        dV.rectangle([inset, inset, SIZE - inset, SIZE - inset], outline=(0, 0, 0, a), width=SUPER * 6)
    return blur_layer(vig, radius=SUPER * 30)


# ---------- C1 — Dial Reloaded ----------
def logo_c1():
    bg = make_background(side=(0.32, 0.22), hi=(52, 66, 86), lo=(8, 11, 18))

    cx = int(SIZE * 0.50)
    cy = int(SIZE * 0.78)
    outer_r = int(SIZE * 0.46)
    inner_r = int(SIZE * 0.36)

    cream = (240, 228, 200)
    crisp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dC = ImageDraw.Draw(crisp)

    # thick dial arc (much heavier than A)
    outer_bb = [cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r]
    inner_bb = [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r]
    dC.arc(outer_bb, 180, 360, fill=cream + (255,), width=SUPER * 6)
    dC.arc(inner_bb, 180, 360, fill=cream + (130,), width=SUPER * 3)

    # bold ticks
    tick_a0, tick_a1 = 200, 340
    n_ticks = 15  # fewer, bolder
    for i in range(n_ticks):
        a = tick_a0 + i * (tick_a1 - tick_a0) / (n_ticks - 1)
        r = math.radians(a)
        r_in = inner_r + SUPER * 10
        r_out = outer_r - SUPER * 10
        x0 = cx + r_in * math.cos(r)
        y0 = cy + r_in * math.sin(r)
        x1 = cx + r_out * math.cos(r)
        y1 = cy + r_out * math.sin(r)
        dC.line([(x0, y0), (x1, y1)], fill=cream + (220,), width=SUPER * 3)

    # pointer — thick cream shaft
    p_angle = 268  # nearly vertical, slight lean
    r = math.radians(p_angle)
    p_inner_r = SUPER * 30
    p_outer_r = outer_r + SUPER * 6
    x0 = cx + p_inner_r * math.cos(r)
    y0 = cy + p_inner_r * math.sin(r)
    x1 = cx + p_outer_r * math.cos(r)
    y1 = cy + p_outer_r * math.sin(r)

    # pointer glow (warm)
    pglow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dPG = ImageDraw.Draw(pglow)
    for w_mult, al in [(26, 32), (14, 70), (7, 130)]:
        dPG.line([(x0, y0), (x1, y1)], fill=(255, 210, 150, al), width=SUPER * w_mult)
    pglow = blur_layer(pglow, radius=SUPER * 14)

    # pointer shaft
    dC.line([(x0, y0), (x1, y1)], fill=(252, 240, 212, 255), width=SUPER * 5)

    # BIG warm lamp at pointer tip — the memory point
    tip_r = SUPER * 34
    lamp_glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dLG = ImageDraw.Draw(lamp_glow)
    for rr in range(10, 0, -1):
        al = int(14 * (11 - rr))
        halo = tip_r * rr * 0.7
        dLG.ellipse([x1 - halo, y1 - halo, x1 + halo, y1 + halo],
                    fill=(255, 190, 120, al))
    lamp_glow = blur_layer(lamp_glow, radius=SUPER * 18)

    dC.ellipse([x1 - tip_r, y1 - tip_r, x1 + tip_r, y1 + tip_r],
               fill=(255, 220, 160, 255))
    dC.ellipse([x1 - tip_r * 0.5, y1 - tip_r * 0.95, x1 + tip_r * 0.1, y1 - tip_r * 0.35],
               fill=(255, 248, 225, 235))

    # brass hub
    hub_r = SUPER * 34
    hub = Image.new("RGBA", (hub_r * 2, hub_r * 2), (0, 0, 0, 0))
    hArr = np.zeros((hub_r * 2, hub_r * 2, 4), dtype=np.uint8)
    yy, xx = np.ogrid[:hub_r * 2, :hub_r * 2]
    dd = np.sqrt((xx - hub_r) ** 2 + (yy - hub_r) ** 2)
    mask = dd <= hub_r
    tl = np.array([180, 144, 98])
    br = np.array([92, 70, 46])
    ux = np.clip((xx - hub_r) / hub_r, -1, 1)
    uy = np.clip((yy - hub_r) / hub_r, -1, 1)
    factor = np.clip((ux + uy) * 0.5 + 0.5, 0, 1)[..., None]
    col = tl[None, None, :] * (1 - factor) + br[None, None, :] * factor
    hArr[..., :3] = col
    hArr[..., 3] = np.where(mask, 255, 0)
    hub = Image.fromarray(hArr, "RGBA")
    crisp.paste(hub, (cx - hub_r, cy - hub_r), hub)
    dC.ellipse([cx - SUPER * 8, cy - SUPER * 8, cx + SUPER * 8, cy + SUPER * 8],
               fill=(36, 28, 20, 255))

    final = bg
    final = Image.alpha_composite(final, lamp_glow)
    final = Image.alpha_composite(final, pglow)
    final = Image.alpha_composite(final, crisp)
    final = Image.alpha_composite(final, vignette())
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- C2 — Letter S ----------
def logo_c2():
    bg = make_background(side=(0.30, 0.26), hi=(44, 56, 76), lo=(9, 12, 20))

    # Brand letter S — built from a custom path (two arcs forming S)
    # Then 5 waveform bars inside the S counters.
    crisp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dC = ImageDraw.Draw(crisp)

    cream = (250, 238, 210)

    # S made from two arcs (top opens right, bottom opens left)
    # Top arc: center (cx, cy-offset), from 270° to 90° (right side open)
    # Bottom arc: center (cx, cy+offset), from 90° to 270°
    cx = SIZE // 2
    top_cy = int(SIZE * 0.36)
    bot_cy = int(SIZE * 0.66)
    arc_r = int(SIZE * 0.20)
    stroke = SUPER * 32

    # soft warm glow behind S
    sglow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dSG = ImageDraw.Draw(sglow)
    for s_mult, al in [(1.35, 18), (1.15, 45), (1.02, 80)]:
        sr = int(arc_r * s_mult)
        ss = int(stroke * 1.2)
        dSG.arc([cx - sr, top_cy - sr, cx + sr, top_cy + sr], 160, 360, fill=(255, 200, 140, al), width=ss)
        dSG.arc([cx - sr, bot_cy - sr, cx + sr, bot_cy + sr], 0, 200, fill=(255, 200, 140, al), width=ss)
    sglow = blur_layer(sglow, radius=SUPER * 16)

    # crisp S strokes — warm cream
    dC.arc([cx - arc_r, top_cy - arc_r, cx + arc_r, top_cy + arc_r],
           160, 360, fill=cream + (255,), width=stroke)
    dC.arc([cx - arc_r, bot_cy - arc_r, cx + arc_r, bot_cy + arc_r],
           0, 200, fill=cream + (255,), width=stroke)

    # rounded caps for the S terminals (small ellipses at the open ends)
    def cap(cx_, cy_, r_):
        dC.ellipse([cx_ - r_, cy_ - r_, cx_ + r_, cy_ + r_], fill=cream + (255,))

    cap_r = stroke // 2
    # top-right terminal (angle ~0° on top arc)
    cap(cx + arc_r, top_cy, cap_r)
    # bottom-left terminal (angle ~180° on bottom arc)
    cap(cx - arc_r, bot_cy, cap_r)
    # middle: where top arc ends at 160° and bottom starts at 200° — these meet near (cx + cos(160)*r, ..)
    # they naturally connect through the S curve; no extra fill needed

    # Waveform bars inside upper counter — 4 short vertical bars
    bar_colors = [
        (188, 148, 110),   # Lo-fi
        (214, 138, 92),    # Rock warm
        (140, 122, 154),   # Jazz plum
        (112, 190, 210),   # Electronic cyan
    ]
    bar_w = SUPER * 14
    bar_gap = SUPER * 10
    bar_base_y = int(SIZE * 0.50)
    heights = [SUPER * 60, SUPER * 90, SUPER * 45, SUPER * 75]
    total_w = len(heights) * bar_w + (len(heights) - 1) * bar_gap
    start_x = cx - total_w // 2
    for i, (h, col) in enumerate(zip(heights, bar_colors)):
        bx = start_x + i * (bar_w + bar_gap)
        dC.rounded_rectangle([bx, bar_base_y - h // 2, bx + bar_w, bar_base_y + h // 2],
                             radius=bar_w // 2, fill=col + (255,))

    final = bg
    final = Image.alpha_composite(final, sglow)
    final = Image.alpha_composite(final, crisp)
    final = Image.alpha_composite(final, vignette())
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- C3 — Glowing Orb (warm core + sound rings) ----------
def logo_c3():
    bg = make_background(side=(0.50, 0.50), hi=(34, 46, 66), lo=(6, 9, 15), falloff=0.70)

    cx = cy = SIZE // 2

    # big soft warm halo (the core glow, very large)
    core_glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dCG = ImageDraw.Draw(core_glow)
    for rr in range(16, 0, -1):
        al = int(9 * (17 - rr))
        r_here = int(SIZE * 0.32) * rr / 16
        dCG.ellipse([cx - r_here, cy - r_here, cx + r_here, cy + r_here],
                    fill=(255, 190, 120, al))
    core_glow = blur_layer(core_glow, radius=SUPER * 40)

    # crisp orb at center — warm ember
    crisp = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dC = ImageDraw.Draw(crisp)
    orb_r = int(SIZE * 0.075)
    # orb body — soft gradient from warm white to amber
    orb = Image.new("RGBA", (orb_r * 2, orb_r * 2), (0, 0, 0, 0))
    oArr = np.zeros((orb_r * 2, orb_r * 2, 4), dtype=np.uint8)
    yy, xx = np.ogrid[:orb_r * 2, :orb_r * 2]
    dd = np.sqrt((xx - orb_r) ** 2 + (yy - orb_r) ** 2)
    mask = dd <= orb_r
    hot = np.array([255, 248, 225])
    warm = np.array([255, 175, 105])
    t = np.clip(dd / orb_r, 0, 1)[..., None]
    col = hot[None, None, :] * (1 - t) + warm[None, None, :] * t
    oArr[..., :3] = col
    oArr[..., 3] = np.where(mask, 255, 0)
    orb = Image.fromarray(oArr, "RGBA")
    crisp.paste(orb, (cx - orb_r, cy - orb_r), orb)

    # concentric sound rings — 4 rings radiating outward, fading
    rings = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dR = ImageDraw.Draw(rings)
    ring_radii = [0.16, 0.24, 0.33, 0.42]   # as fraction of SIZE
    ring_alphas = [200, 130, 75, 38]
    for rad_frac, al in zip(ring_radii, ring_alphas):
        r_px = int(SIZE * rad_frac)
        # warm cream ring
        dR.ellipse([cx - r_px, cy - r_px, cx + r_px, cy + r_px],
                   outline=(255, 215, 170, al), width=SUPER * 3)

    rings = blur_layer(rings, radius=SUPER * 1)

    final = bg
    final = Image.alpha_composite(final, core_glow)
    final = Image.alpha_composite(final, rings)
    final = Image.alpha_composite(final, crisp)
    final = Image.alpha_composite(final, vignette())
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- C4 — Crescent Moon + Sound Rings ----------
def logo_c4():
    bg = make_background(side=(0.32, 0.30), hi=(40, 52, 72), lo=(7, 10, 18), falloff=0.75)

    cx = int(SIZE * 0.50)
    cy = int(SIZE * 0.46)
    moon_r = int(SIZE * 0.18)

    # moon halo
    halo = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dH = ImageDraw.Draw(halo)
    for rr in range(12, 0, -1):
        al = int(10 * (13 - rr))
        r_here = moon_r * 2.5 * rr / 12
        dH.ellipse([cx - r_here, cy - r_here, cx + r_here, cy + r_here],
                   fill=(248, 230, 200, al))
    halo = blur_layer(halo, radius=SUPER * 24)

    # moon body (crescent — full circle then cut by shifted dark ellipse)
    moonL = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dM = ImageDraw.Draw(moonL)
    dM.ellipse([cx - moon_r, cy - moon_r, cx + moon_r, cy + moon_r],
               fill=(246, 232, 208, 255))
    # shifted dark cutout to form crescent (shadow from top-right)
    sh_off_x = int(moon_r * 0.35)
    sh_off_y = int(-moon_r * 0.08)
    dM.ellipse([cx - moon_r + sh_off_x, cy - moon_r + sh_off_y,
                cx + moon_r + sh_off_x, cy + moon_r + sh_off_y],
               fill=(10, 14, 22, 255))
    moonL = blur_layer(moonL, radius=SUPER * 1)

    # concentric moonlight rings expanding downward (like the moon "broadcasting")
    rings = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dR = ImageDraw.Draw(rings)
    # rings centered on moon, expanding — shown only in lower half for "signal falling down"
    for i, (rad_frac, al) in enumerate([(0.28, 180), (0.38, 110), (0.47, 65), (0.55, 35)]):
        r_px = int(SIZE * rad_frac)
        # only draw the lower arc (bottom 180°) so it reads as "signal falling to earth"
        dR.arc([cx - r_px, cy - r_px, cx + r_px, cy + r_px],
               0, 180, fill=(248, 224, 190, al), width=SUPER * 3)
    rings = blur_layer(rings, radius=SUPER * 1)

    # a single small star (anchor point, upper-right)
    dH2 = ImageDraw.Draw(halo)
    sx, sy = int(SIZE * 0.78), int(SIZE * 0.24)
    sr = SUPER * 3
    dH2.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(240, 232, 215, 220))

    final = bg
    final = Image.alpha_composite(final, halo)
    final = Image.alpha_composite(final, rings)
    final = Image.alpha_composite(final, moonL)
    final = Image.alpha_composite(final, vignette())
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("C1 — Dial Reloaded…")
    logo_c1().save(os.path.join(OUT, "C1_dial_reloaded.png"), "PNG", optimize=True)
    print("C2 — Letter S…")
    logo_c2().save(os.path.join(OUT, "C2_letter_s.png"), "PNG", optimize=True)
    print("C3 — Glowing Orb…")
    logo_c3().save(os.path.join(OUT, "C3_orb_rings.png"), "PNG", optimize=True)
    print("C4 — Moon Waveform…")
    logo_c4().save(os.path.join(OUT, "C4_moon_rings.png"), "PNG", optimize=True)
    print("Done.")
