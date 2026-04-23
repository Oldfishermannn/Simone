"""
Simone AppIcon — D series (反 AI 味: flat · print-feel · single shape).

Rules (all 4):
- NO glow, NO gradient background, NO bokeh, NO vignette, NO metal.
- One shape. Flat color blocks. Vector feel like an indie magazine cover.

D1 — Serif s:     lowercase serif 's' on cream. Bodoni/Didot vibe, independent radio station.
D2 — Cassette:    lo-fi cassette tape silhouette. Two circles + frame. Strong product tie.
D3 — Window:      2×3 geometric window, one lit pane. Abstracted B into Mondrian block.
D4 — Waveform:    4 flat bars, varying heights, rounded caps. Radio signal, but flat.
"""
from PIL import Image, ImageDraw, ImageFont
import os

FINAL = 1024
SIZE = FINAL * 2  # moderate supersample, we don't need heavy AA for flat vector
OUT = os.path.dirname(os.path.abspath(__file__))

# palette: warm cream + deep ink, with one accent color per variant
CREAM = (238, 228, 206)       # paper / magazine cream
INK = (22, 26, 36)            # deep warm black
NAVY = (26, 34, 54)           # alt background
WARM = (232, 148, 82)         # warm accent (one-color hit)
AMBER = (244, 190, 108)       # softer warm


def flat_bg(color):
    return Image.new("RGB", (SIZE, SIZE), color).convert("RGBA")


# ---------- D1 — Serif lowercase s ----------
def logo_d1():
    """Big italic serif lowercase 's' on cream. Reads like a magazine masthead."""
    bg = flat_bg(CREAM)
    d = ImageDraw.Draw(bg)

    # try multiple serif fonts
    serif_candidates = [
        "/System/Library/Fonts/Supplemental/Didot.ttc",
        "/System/Library/Fonts/NewYork.ttf",
        "/System/Library/Fonts/Supplemental/Georgia.ttf",
        "/System/Library/Fonts/Supplemental/Baskerville.ttc",
    ]
    font = None
    for p in serif_candidates:
        if os.path.exists(p):
            try:
                font = ImageFont.truetype(p, int(SIZE * 0.85))
                break
            except Exception:
                continue
    if font is None:
        font = ImageFont.load_default()

    text = "s"
    # measure
    bbox = d.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # center optically (serifs sit below baseline — adjust)
    tx = (SIZE - tw) // 2 - bbox[0]
    ty = (SIZE - th) // 2 - bbox[1] - int(SIZE * 0.02)
    d.text((tx, ty), text, fill=INK, font=font)

    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- D2 — Cassette tape ----------
def logo_d2():
    """Lo-fi cassette: warm cream background, two reel holes, minimal frame."""
    bg = flat_bg(NAVY)
    d = ImageDraw.Draw(bg)

    # cassette body — warm cream rounded rectangle
    body_w = int(SIZE * 0.74)
    body_h = int(SIZE * 0.50)
    body_x = (SIZE - body_w) // 2
    body_y = (SIZE - body_h) // 2 + int(SIZE * 0.02)
    body_r = int(SIZE * 0.04)
    d.rounded_rectangle([body_x, body_y, body_x + body_w, body_y + body_h],
                        radius=body_r, fill=CREAM)

    # label strip — thin bar at top of cassette body
    label_h = int(body_h * 0.22)
    label_y = body_y + int(body_h * 0.14)
    d.rectangle([body_x + int(body_w * 0.08), label_y,
                 body_x + int(body_w * 0.92), label_y + label_h],
                fill=WARM)

    # two reel holes
    reel_r = int(body_h * 0.15)
    reel_y = body_y + int(body_h * 0.62)
    reel_gap = int(body_w * 0.30)
    cx_mid = body_x + body_w // 2
    for rx in [cx_mid - reel_gap, cx_mid + reel_gap]:
        # inner dark hole
        d.ellipse([rx - reel_r, reel_y - reel_r, rx + reel_r, reel_y + reel_r], fill=NAVY)
        # center dot
        dot_r = int(reel_r * 0.28)
        d.ellipse([rx - dot_r, reel_y - dot_r, rx + dot_r, reel_y + dot_r], fill=CREAM)

    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- D3 — Window Block ----------
def logo_d3():
    """2×3 window grid, one lit pane. Mondrian-clean, zero glow."""
    bg = flat_bg(INK)
    d = ImageDraw.Draw(bg)

    # window frame
    w_w = int(SIZE * 0.58)
    w_h = int(SIZE * 0.78)
    w_x = (SIZE - w_w) // 2
    w_y = (SIZE - w_h) // 2
    stroke = int(SIZE * 0.012)

    # panes as 2 cols × 3 rows
    cols = 2
    rows = 3
    pane_w = w_w // cols
    pane_h = w_h // rows

    # fill each pane with a slightly different flat dark
    pane_colors = [
        [(34, 40, 54), (30, 36, 50)],
        [(28, 34, 48), (36, 42, 56)],
        [(32, 38, 52), (38, 44, 58)],
    ]
    # lit pane: second column, second row (middle-right)
    lit_row = 1
    lit_col = 1

    for r in range(rows):
        for c in range(cols):
            px = w_x + c * pane_w
            py = w_y + r * pane_h
            color = AMBER if (r == lit_row and c == lit_col) else pane_colors[r][c]
            d.rectangle([px, py, px + pane_w, py + pane_h], fill=color)

    # frame lines — cream, flat
    # outer border
    d.rectangle([w_x, w_y, w_x + w_w, w_y + stroke], fill=CREAM)           # top
    d.rectangle([w_x, w_y + w_h - stroke, w_x + w_w, w_y + w_h], fill=CREAM)   # bottom
    d.rectangle([w_x, w_y, w_x + stroke, w_y + w_h], fill=CREAM)           # left
    d.rectangle([w_x + w_w - stroke, w_y, w_x + w_w, w_y + w_h], fill=CREAM)   # right
    # vertical divider
    vx = w_x + pane_w
    d.rectangle([vx - stroke // 2, w_y, vx + stroke // 2, w_y + w_h], fill=CREAM)
    # horizontal dividers
    for i in range(1, rows):
        hy = w_y + i * pane_h
        d.rectangle([w_x, hy - stroke // 2, w_x + w_w, hy + stroke // 2], fill=CREAM)

    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


# ---------- D4 — Flat Waveform ----------
def logo_d4():
    """4 flat bars with rounded caps. No glow. High contrast."""
    bg = flat_bg(CREAM)
    d = ImageDraw.Draw(bg)

    # 4 bars, varying heights, rounded-rect, warm ink
    n = 4
    bar_w = int(SIZE * 0.08)
    gap = int(SIZE * 0.05)
    total_w = n * bar_w + (n - 1) * gap
    start_x = (SIZE - total_w) // 2
    cy = SIZE // 2

    # heights as fraction of SIZE
    h_fracs = [0.34, 0.58, 0.24, 0.46]
    for i, hf in enumerate(h_fracs):
        h_px = int(SIZE * hf)
        bx = start_x + i * (bar_w + gap)
        d.rounded_rectangle([bx, cy - h_px // 2, bx + bar_w, cy + h_px // 2],
                            radius=bar_w // 2, fill=INK)

    return bg.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("D1 — Serif s (cream)…")
    logo_d1().save(os.path.join(OUT, "D1_serif_s.png"), "PNG", optimize=True)
    print("D2 — Cassette (navy)…")
    logo_d2().save(os.path.join(OUT, "D2_cassette.png"), "PNG", optimize=True)
    print("D3 — Window block (ink)…")
    logo_d3().save(os.path.join(OUT, "D3_window_block.png"), "PNG", optimize=True)
    print("D4 — Flat waveform (cream)…")
    logo_d4().save(os.path.join(OUT, "D4_waveform_flat.png"), "PNG", optimize=True)
    print("Done.")
