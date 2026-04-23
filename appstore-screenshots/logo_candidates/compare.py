"""3-way comparison strip: old / A / B, with labels under each."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
TILE = 420
PAD = 32
LABEL_H = 68
W = TILE * 3 + PAD * 4
H = TILE + PAD * 2 + LABEL_H

bg_col = (22, 26, 34)
label_col = (214, 210, 198)
sub_col = (150, 146, 136)

canvas = Image.new("RGB", (W, H), bg_col)
draw = ImageDraw.Draw(canvas)

def tile(path, x, label, sub):
    img = Image.open(path).convert("RGB").resize((TILE, TILE), Image.LANCZOS)
    canvas.paste(img, (x, PAD))
    # label
    try:
        f1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 22)
        f2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 16)
    except Exception:
        f1 = ImageFont.load_default()
        f2 = ImageFont.load_default()
    draw.text((x, PAD + TILE + 14), label, fill=label_col, font=f1)
    draw.text((x, PAD + TILE + 42), sub, fill=sub_col, font=f2)

x1 = PAD
x2 = PAD * 2 + TILE
x3 = PAD * 3 + TILE * 2

tile(os.path.join(OUT, "..", "..", "simone ios", "Simone", "Assets.xcassets",
                  "AppIcon.appiconset", "AppIcon.png"),
     x1, "CURRENT", "generic spectrum bars")
tile(os.path.join(OUT, "A_radio_dial.png"),
     x2, "A — RADIO DIAL", "5 station color dots · tuner pointer")
tile(os.path.join(OUT, "B_nocturne_window.png"),
     x3, "B — NOCTURNE WINDOW", "city at night · moon · warm lamp")

canvas.save(os.path.join(OUT, "compare.png"), "PNG", optimize=True)
print("wrote compare.png", canvas.size)
