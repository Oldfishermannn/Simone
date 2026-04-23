"""E series compare + 60/120/180 homescreen readability."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
CELL = 380
PAD = 28
LABEL_H = 80

items = [
    ("E1_call_sign.png",      "E1 — Call Sign",         "双色块 + 信号塔 + 呼号字"),
    ("E2_didone_s.png",       "E2 — Didone S",          "杂志衬线大 S"),
    ("E3_cassette_print.png", "E3 — Cassette Print",    "磁带盒丝网印刷"),
]

try:
    font_t = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 20)
    font_s = ImageFont.truetype("/System/Library/Fonts/SFNS.ttf", 14)
except Exception:
    font_t = ImageFont.load_default()
    font_s = ImageFont.load_default()

W = PAD + (CELL + PAD) * 3
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
out.save(os.path.join(OUT, "compare_e.png"), "PNG", optimize=True)

# 60/120/180 homescreen
BG = (20, 22, 30)
SIZES = [60, 120, 180]
ROW_H = max(SIZES) + 60
ROW_W = PAD + sum(s + PAD for s in SIZES) + 120
Wh = PAD + ROW_W + PAD + 400
Hh = PAD + (ROW_H + PAD) * 3 + 40
home = Image.new("RGB", (Wh, Hh), BG)
dh = ImageDraw.Draw(home)
CORNER_R = {60: 13, 120: 26, 180: 40}

for idx, (fn, title, _) in enumerate(items):
    ry = PAD + idx * (ROW_H + PAD)
    im_full = Image.open(os.path.join(OUT, fn)).convert("RGB")
    dh.text((PAD, ry), title, fill=(235, 235, 230), font=font_t)
    cur_x = PAD
    cy = ry + 32
    for s in SIZES:
        sm = im_full.resize((s, s), Image.LANCZOS)
        mask = Image.new("L", (s, s), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, s, s], radius=CORNER_R[s], fill=255)
        home.paste(sm, (cur_x, cy + (max(SIZES) - s)), mask)
        dh.text((cur_x, cy + max(SIZES) + 4), f"{s}px", fill=(140, 140, 135), font=font_s)
        cur_x += s + PAD
home.save(os.path.join(OUT, "preview_e_homescreen.png"), "PNG", optimize=True)
print("saved compare_e.png, preview_e_homescreen.png")
