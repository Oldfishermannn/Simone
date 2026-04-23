from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.dirname(os.path.abspath(__file__))
TILE = 460
PAD = 32
LABEL_H = 72
W = TILE * 2 + PAD * 3
H = TILE + PAD * 2 + LABEL_H

canvas = Image.new("RGB", (W, H), (22, 26, 34))
draw = ImageDraw.Draw(canvas)

try:
    f1 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 22)
    f2 = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 16)
except Exception:
    f1 = ImageFont.load_default()
    f2 = ImageFont.load_default()

def tile(path, x, label, sub):
    img = Image.open(path).convert("RGB").resize((TILE, TILE), Image.LANCZOS)
    canvas.paste(img, (x, PAD))
    draw.text((x, PAD + TILE + 14), label, fill=(214, 210, 198), font=f1)
    draw.text((x, PAD + TILE + 44), sub, fill=(150, 146, 136), font=f2)

tile(os.path.join(OUT, "B_nocturne_window.png"), PAD, "B v1", "2×3 panes · dense window grid")
tile(os.path.join(OUT, "B2_nocturne_simplified.png"), PAD * 2 + TILE,
     "B v2", "single pane · 4 buildings · 5 lit windows · moon halo")

canvas.save(os.path.join(OUT, "compare_b.png"), "PNG", optimize=True)
print("wrote", canvas.size)
