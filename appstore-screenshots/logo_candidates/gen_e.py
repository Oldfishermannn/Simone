"""
Simone AppIcon — E series (Independent Radio Station · Print-object feel).

Design logic: 独立电台呼号卡 / 喫茶店 matchbook / Criterion 封面 —— 不是 app icon
逻辑，是印刷品逻辑。反 AI 套装：NO glow · NO gradient bg · NO bokeh · NO vignette
· NO 拟物金属 · NO cyan-on-dark · NO gradient text。色只两支：
  - fog-blue  oklch(0.15 0.015 250) → RGB 深雾蓝
  - warm cream (like old paper)     → 暖奶纸色
再点 1 个克制暖光（ember）做主灯记忆点，仅 1 处出现。

E1 — Call Sign:       上下双色块 + 极简信号塔 + SIMONE small caps
E2 — Didone S:        一整个高对比衬线大写 S（ball terminals = 隐喻旋钮），独占 shape
E3 — Cassette print:  磁带盒丝网印刷感，cream 底 ink 印，自带 grain
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
import math
import os

FINAL = 1024
SUPER = 2
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))

# oklch(0.15 0.015 250) ≈ RGB (22, 27, 37) — fog city nocturne
FOG = (22, 27, 37)
# warm cream paper (slightly desaturated)
CREAM = (234, 224, 200)
# single ember accent, used sparingly (never as glow, just as a printed dot)
EMBER = (225, 142, 78)
# deep ink (warmer than pure black)
INK = (14, 17, 24)


def flat(color):
    return Image.new("RGB", (SIZE, SIZE), color).convert("RGBA")


def add_grain(img, amount=4, seed=7):
    """Subtle paper-grain noise — not gradient, not glow. Simulates print imperfection."""
    arr = np.array(img).astype(np.float32)
    rng = np.random.default_rng(seed)
    noise = rng.normal(0, amount, arr[..., :3].shape)
    arr[..., :3] = np.clip(arr[..., :3] + noise, 0, 255)
    return Image.fromarray(arr.astype(np.uint8), img.mode)


def find_font(candidates, size):
    for p in candidates:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                continue
    return ImageFont.load_default()


# ---------- E1 — Call Sign ----------
def logo_e1():
    bg = flat(FOG)
    d = ImageDraw.Draw(bg)

    # horizontal cream band across middle-lower — like a ticket / call-sign card
    band_h = int(SIZE * 0.44)
    band_y = int(SIZE * 0.42)
    band_x0 = int(SIZE * 0.10)
    band_x1 = int(SIZE * 0.90)
    d.rectangle([band_x0, band_y, band_x1, band_y + band_h], fill=CREAM)

    # --- signal tower icon (upper fog area) ---
    # tiny geometric: a vertical stroke + 3 widening arcs (broadcasting)
    tower_cx = SIZE // 2
    tower_base_y = int(SIZE * 0.34)
    mast_h = int(SIZE * 0.14)
    mast_w = int(SIZE * 0.012)
    # mast
    d.rectangle([tower_cx - mast_w // 2, tower_base_y - mast_h,
                 tower_cx + mast_w // 2, tower_base_y], fill=CREAM)
    # small triangle top
    tri_h = int(SIZE * 0.022)
    tri_w = int(SIZE * 0.035)
    d.polygon([
        (tower_cx, tower_base_y - mast_h - tri_h),
        (tower_cx - tri_w // 2, tower_base_y - mast_h),
        (tower_cx + tri_w // 2, tower_base_y - mast_h),
    ], fill=CREAM)
    # broadcast arcs — 3 widening, only upper half, thin stroke
    arc_stroke = int(SIZE * 0.008)
    for i, r_frac in enumerate([0.08, 0.13, 0.18]):
        r = int(SIZE * r_frac)
        top = tower_base_y - mast_h - tri_h - r
        bb = [tower_cx - r, top, tower_cx + r, top + r * 2]
        d.arc(bb, 200, 340, fill=CREAM, width=arc_stroke)

    # --- SIMONE small caps inside cream band, left-aligned, offset ---
    # deliberately off-center (print object feel, not centered UI)
    label_font_path = [
        "/System/Library/Fonts/Avenir Next.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Supplemental/Futura.ttc",
    ]
    label_font = find_font(label_font_path, int(SIZE * 0.082))
    label_text = "SIMONE"
    # letter-space manually
    tracking = int(SIZE * 0.022)
    glyphs = list(label_text)
    # measure
    total_w = 0
    widths = []
    for g in glyphs:
        bbox = d.textbbox((0, 0), g, font=label_font)
        widths.append(bbox[2] - bbox[0])
        total_w += bbox[2] - bbox[0]
    total_w += tracking * (len(glyphs) - 1)
    tx = (SIZE - total_w) // 2
    # vertical: upper-half of band
    ty = band_y + int(band_h * 0.18)
    cur = tx
    for g, gw in zip(glyphs, widths):
        d.text((cur, ty), g, fill=INK, font=label_font)
        cur += gw + tracking

    # --- sub-line: "AI MOOD RADIO" very small, beneath, with a horizontal rule ---
    # thin rule
    rule_y = band_y + int(band_h * 0.48)
    rule_margin = int(SIZE * 0.15)
    d.rectangle([rule_margin, rule_y, SIZE - rule_margin, rule_y + int(SIZE * 0.003)],
                fill=INK)
    sub_font = find_font(label_font_path, int(SIZE * 0.030))
    sub_text = "A I  ·  M O O D  ·  R A D I O"
    sb = d.textbbox((0, 0), sub_text, font=sub_font)
    sw = sb[2] - sb[0]
    d.text(((SIZE - sw) // 2, rule_y + int(SIZE * 0.02)), sub_text,
           fill=INK, font=sub_font)

    # --- one ember dot bottom-right of band — the single warm hit ---
    dot_r = int(SIZE * 0.018)
    dx = band_x1 - int(SIZE * 0.055)
    dy = band_y + int(band_h * 0.82)
    d.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=EMBER)

    bg = add_grain(bg, amount=3, seed=11)
    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- E2 — Didone S ----------
def logo_e2():
    bg = flat(FOG)
    d = ImageDraw.Draw(bg)

    # Didot (macOS). Didone high-contrast serif, editorial magazine air.
    s_font = find_font([
        "/System/Library/Fonts/Supplemental/Didot.ttc",
        "/System/Library/Fonts/NewYork.ttf",
        "/System/Library/Fonts/Supplemental/Bodoni 72.ttc",
        "/System/Library/Fonts/Supplemental/Baskerville.ttc",
    ], int(SIZE * 0.98))
    text = "S"
    bb = d.textbbox((0, 0), text, font=s_font)
    tw = bb[2] - bb[0]
    th = bb[3] - bb[1]
    tx = (SIZE - tw) // 2 - bb[0]
    ty = (SIZE - th) // 2 - bb[1] - int(SIZE * 0.02)
    d.text((tx, ty), text, fill=CREAM, font=s_font)

    # tiny caption bottom — asymmetric, left-aligned
    cap_font = find_font([
        "/System/Library/Fonts/Avenir Next.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
    ], int(SIZE * 0.028))
    cap_text = "S I M O N E  ·  A I  R A D I O"
    cap_bb = d.textbbox((0, 0), cap_text, font=cap_font)
    cap_w = cap_bb[2] - cap_bb[0]
    cap_x = int(SIZE * 0.08)
    cap_y = int(SIZE * 0.92)
    d.text((cap_x, cap_y), cap_text, fill=CREAM, font=cap_font)

    # a single ember dot at the bottom-right corner — print register mark
    dot_r = int(SIZE * 0.014)
    dx = int(SIZE * 0.92)
    dy = int(SIZE * 0.935)
    d.ellipse([dx - dot_r, dy - dot_r, dx + dot_r, dy + dot_r], fill=EMBER)

    bg = add_grain(bg, amount=3, seed=23)
    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- E3 — Cassette (hand-drawn lo-fi, dark display, tilted) ----------
def logo_e3():
    BLACK = (0, 0, 0)
    BODY_CREAM = (232, 222, 198)
    LABEL_STRIPE = (168, 128, 82)
    TRANSPORT_DARK = (28, 22, 18)
    REEL_HUB = (178, 138, 90)
    REEL_CORE = (58, 42, 28)
    LINE_GRAY = (150, 140, 118)
    TAPE_BROWN = (48, 34, 22)
    SPECK = (200, 185, 160)

    bg = Image.new("RGB", (SIZE, SIZE), BLACK).convert("RGBA")

    # build cassette on transparent layer, rotate as one piece
    cass = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(cass)

    body_w = int(SIZE * 0.78)
    body_h = int(SIZE * 0.50)
    body_x = (SIZE - body_w) // 2
    body_y = (SIZE - body_h) // 2
    body_r = int(SIZE * 0.013)
    d.rounded_rectangle([body_x, body_y, body_x + body_w, body_y + body_h],
                        radius=body_r, fill=BODY_CREAM)

    # --- label: blank ruled paper with small brown stripe top-left ---
    label_pad_x = int(body_w * 0.05)
    label_pad_y = int(body_h * 0.06)
    lx0 = body_x + label_pad_x
    lx1 = body_x + body_w - label_pad_x
    ly0 = body_y + label_pad_y
    ly1 = body_y + int(body_h * 0.42)

    # small brown stripe (the "title area" left blank to be written on)
    stripe_w = int((lx1 - lx0) * 0.20)
    stripe_h = int((ly1 - ly0) * 0.14)
    stripe_x = lx0 + int((lx1 - lx0) * 0.02)
    stripe_y = ly0 + int((ly1 - ly0) * 0.12)
    d.rectangle([stripe_x, stripe_y, stripe_x + stripe_w, stripe_y + stripe_h],
                fill=LABEL_STRIPE)

    # ruled horizontal lines (4 lines, evenly spaced in lower label area)
    rule_y0 = ly0 + int((ly1 - ly0) * 0.45)
    rule_y1 = ly1 - int((ly1 - ly0) * 0.08)
    n_rules = 4
    rule_thick = max(2, int(SIZE * 0.0015))
    for i in range(n_rules):
        ry = rule_y0 + i * (rule_y1 - rule_y0) // (n_rules - 1)
        d.rectangle([lx0 + int((lx1 - lx0) * 0.02), ry,
                     lx1 - int((lx1 - lx0) * 0.02), ry + rule_thick],
                    fill=LINE_GRAY)

    # --- transport window (dark big block bottom half) ---
    tw_x0 = body_x + int(body_w * 0.09)
    tw_x1 = body_x + body_w - int(body_w * 0.09)
    tw_y0 = body_y + int(body_h * 0.50)
    tw_y1 = body_y + int(body_h * 0.86)
    tw_r = int(SIZE * 0.008)
    d.rounded_rectangle([tw_x0, tw_y0, tw_x1, tw_y1], radius=tw_r, fill=TRANSPORT_DARK)

    # --- reels inside transport: dark ring + copper hub + dark core ---
    reel_cy = (tw_y0 + tw_y1) // 2
    reel_r = int(body_h * 0.13)
    reel_gap = int(body_w * 0.22)
    cx_mid = body_x + body_w // 2
    reel_xs = [cx_mid - reel_gap, cx_mid + reel_gap]
    for rx in reel_xs:
        # outer dark disc (reel body, slightly darker than transport)
        d.ellipse([rx - reel_r, reel_cy - reel_r, rx + reel_r, reel_cy + reel_r],
                  fill=REEL_CORE)
        # copper hub
        hub_r = int(reel_r * 0.62)
        d.ellipse([rx - hub_r, reel_cy - hub_r, rx + hub_r, reel_cy + hub_r],
                  fill=REEL_HUB)
        # tiny dark center
        core_r = int(reel_r * 0.16)
        d.ellipse([rx - core_r, reel_cy - core_r, rx + core_r, reel_cy + core_r],
                  fill=REEL_CORE)

    # --- magnetic tape: thin curve from one reel to the other, dipping slightly ---
    # draw as a series of short line segments approximating a shallow downward arc
    tape_x0 = reel_xs[0] + int(reel_r * 0.55)
    tape_x1 = reel_xs[1] - int(reel_r * 0.55)
    tape_y_top = reel_cy + int(reel_r * 0.15)     # starts just below reel centers
    tape_dip  = int(body_h * 0.035)                # how far it dips
    tape_thick = max(2, int(SIZE * 0.0025))
    n_seg = 40
    pts = []
    for i in range(n_seg + 1):
        t = i / n_seg
        x = tape_x0 + (tape_x1 - tape_x0) * t
        # parabolic dip — y = top + dip * 4 * t * (1-t)
        y = tape_y_top + tape_dip * 4 * t * (1 - t)
        pts.append((x, y))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=TAPE_BROWN, width=tape_thick)

    # --- bottom row of small dark dots (cassette underside holes) ---
    n_dots = 5
    dot_r = max(2, int(SIZE * 0.004))
    dot_y = body_y + body_h - int(body_h * 0.07)
    dot_x0 = body_x + int(body_w * 0.28)
    dot_x1 = body_x + body_w - int(body_w * 0.28)
    for i in range(n_dots):
        dx = dot_x0 + i * (dot_x1 - dot_x0) // (n_dots - 1)
        d.ellipse([dx - dot_r, dot_y - dot_r, dx + dot_r, dot_y + dot_r],
                  fill=REEL_CORE)

    # --- wear specks on cream body (hand-drawn paper feel) ---
    rng_specks = np.random.default_rng(13)
    for _ in range(22):
        sx = body_x + int(rng_specks.random() * body_w)
        sy = body_y + int(rng_specks.random() * body_h)
        # skip if inside transport window
        if tw_x0 <= sx <= tw_x1 and tw_y0 <= sy <= tw_y1:
            continue
        sr = max(1, int(SIZE * (0.0015 + rng_specks.random() * 0.002)))
        shade = tuple(int(c * 0.86) for c in BODY_CREAM)
        d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=shade + (180,))

    # --- rotate the cassette ~-6° (like casually set down on a table) ---
    rotated = cass.rotate(-6, resample=Image.BICUBIC, expand=False)

    # composite onto black bg
    final = Image.alpha_composite(bg, rotated)

    # subtle grain over everything
    final = add_grain(final, amount=2, seed=41)
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("E1 — Call Sign…")
    logo_e1().save(os.path.join(OUT, "E1_call_sign.png"), "PNG", optimize=True)
    print("E2 — Didone S…")
    logo_e2().save(os.path.join(OUT, "E2_didone_s.png"), "PNG", optimize=True)
    print("E3 — Cassette silkscreen…")
    logo_e3().save(os.path.join(OUT, "E3_cassette_print.png"), "PNG", optimize=True)
    print("Done.")
