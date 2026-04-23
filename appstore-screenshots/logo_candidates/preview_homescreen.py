"""Preview: how the icon looks on the Home Screen at iOS sizes."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = os.path.dirname(os.path.abspath(__file__))

def superellipse_mask(size, radius_frac=0.2237):
    # iOS uses a squircle (superellipse); approximate via rounded rect.
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    r = int(size * radius_frac)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    # slight blur for edge antialias
    return mask.filter(ImageFilter.GaussianBlur(0.8))

def composite_one(icon_path, size):
    ic = Image.open(icon_path).convert("RGB").resize((size, size), Image.LANCZOS)
    mask = superellipse_mask(size)
    cropped = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cropped.paste(ic, (0, 0), mask)
    return cropped

# canvas: dark wallpaper mock with 3 sizes of the icon
W, H = 640, 360
canvas = Image.new("RGB", (W, H), (22, 26, 34))
draw = ImageDraw.Draw(canvas)

for variant, y in [("B3_nocturne_frameless.png", 40)]:
    label = variant.replace(".png", "")
    # three sizes: 60 (home), 120 (settings), 180 (app store list ~)
    x = 40
    for s in [60, 120, 180]:
        ic = composite_one(os.path.join(OUT, variant), s)
        canvas.paste(ic, (x, y + (180 - s)), ic)
        draw.text((x, y + 200), f"{s}px", fill=(150, 146, 136))
        x += s + 40

canvas.save(os.path.join(OUT, "preview_homescreen.png"), "PNG", optimize=True)
print("wrote", canvas.size)
