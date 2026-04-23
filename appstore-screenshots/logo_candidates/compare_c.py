"""Compare C1-C4 + 60px homescreen readability."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
CELL = 360
PAD = 28
LABEL_H = 76

items = [
    ("C1_dial_reloaded.png",  "C1 — Dial Reloaded",     "thick dial · pointer = warm lamp"),
    ("C2_letter_s.png",       "C2 — Letter S",          "brand letter + waveform bars"),
    ("C3_orb_rings.png",      "C3 — Glowing Orb",       "warm core + sound rings"),
    ("C4_moon_rings.png",     "C4 — Moon Waveform",     "crescent + moonlight signal"),
]

try:
    font_t = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 20)
    font_s = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 14)
except Exception:
    font_t = ImageFont.load_default()
    font_s = ImageFont.load_default()

# 4 across, 1 row for big previews
W = PAD + (CELL + PAD) * 4
H = PAD + CELL + LABEL_H + PAD
out = Image.new("RGB", (W, H), (14, 17, 24))
d = ImageDraw.Draw(out)

for i, (fn, title, sub) in enumerate(items):
    im = Image.open(os.path.join(OUT, fn)).convert("RGB").resize((CELL, CELL), Image.LANCZOS)
    x = PAD + i * (CELL + PAD)
    y = PAD
    out.paste(im, (x, y))
    d.text((x, y + CELL + 10), title, fill=(235, 235, 230), font=font_t)
    d.text((x, y + CELL + 42), sub, fill=(150, 150, 145), font=font_s)

out.save(os.path.join(OUT, "compare_c.png"), "PNG", optimize=True)

# Home screen preview: 60 / 120 / 180 px side by side for each candidate
BG = (20, 22, 30)
SIZES = [60, 120, 180]
ROW_H = max(SIZES) + 60
ROW_W = PAD + sum(s + PAD for s in SIZES) + 200

Wh = PAD + (ROW_W + PAD) * 2
Hh = PAD + (ROW_H + PAD) * 2 + 40
home = Image.new("RGB", (Wh, Hh), BG)
dh = ImageDraw.Draw(home)

CORNER_R = {60: 13, 120: 26, 180: 40}  # iOS-ish

for idx, (fn, title, _) in enumerate(items):
    r = idx // 2
    c = idx % 2
    rx = PAD + c * (ROW_W + PAD)
    ry = PAD + r * (ROW_H + PAD)
    im_full = Image.open(os.path.join(OUT, fn)).convert("RGB")
    dh.text((rx, ry), title, fill=(235, 235, 230), font=font_t)
    cur_x = rx
    cy = ry + 32
    for s in SIZES:
        sm = im_full.resize((s, s), Image.LANCZOS)
        mask = Image.new("L", (s, s), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, s, s], radius=CORNER_R[s], fill=255)
        home.paste(sm, (cur_x, cy + (max(SIZES) - s)), mask)
        dh.text((cur_x, cy + max(SIZES) + 4), f"{s}px", fill=(140, 140, 135), font=font_s)
        cur_x += s + PAD

home.save(os.path.join(OUT, "preview_c_homescreen.png"), "PNG", optimize=True)
print("saved compare_c.png, preview_c_homescreen.png")
