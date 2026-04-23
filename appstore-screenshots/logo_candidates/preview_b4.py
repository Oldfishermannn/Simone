"""Preview B v4 with squircle mask at Home Screen sizes."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = os.path.dirname(os.path.abspath(__file__))

def mask(size, radius_frac=0.2237):
    m = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(m)
    r = int(size * radius_frac)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return m.filter(ImageFilter.GaussianBlur(0.8))

def comp(icon_path, size):
    ic = Image.open(icon_path).convert("RGB").resize((size, size), Image.LANCZOS)
    m = mask(size)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(ic, (0, 0), m)
    return out

W, H = 640, 360
canvas = Image.new("RGB", (W, H), (22, 26, 34))
draw = ImageDraw.Draw(canvas)
x = 40
y = 40
for s in [60, 120, 180]:
    ic = comp(os.path.join(OUT, "B4_nocturne_windows.png"), s)
    canvas.paste(ic, (x, y + (180 - s)), ic)
    draw.text((x, y + 200), f"{s}px", fill=(150, 146, 136))
    x += s + 40

canvas.save(os.path.join(OUT, "preview_b4.png"), "PNG", optimize=True)
print("wrote preview_b4.png")
