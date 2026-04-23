"""E3 Level — cassette, fully horizontal, fully centered (no tilt, no offset)."""
from PIL import Image, ImageDraw
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gen_e import add_grain

FINAL = 1024
SUPER = 2
SIZE = FINAL * SUPER
OUT = os.path.dirname(os.path.abspath(__file__))


def logo_e3_level():
    BLACK = (0, 0, 0)
    BODY_CREAM = (232, 222, 198)
    LABEL_STRIPE = (168, 128, 82)
    TRANSPORT_DARK = (28, 22, 18)
    REEL_HUB = (178, 138, 90)
    REEL_CORE = (58, 42, 28)
    LINE_GRAY = (150, 140, 118)
    TAPE_BROWN = (48, 34, 22)

    bg = Image.new("RGB", (SIZE, SIZE), BLACK).convert("RGBA")
    cass = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(cass)

    body_w = int(SIZE * 0.78)
    body_h = int(SIZE * 0.50)
    body_x = (SIZE - body_w) // 2
    body_y = (SIZE - body_h) // 2
    body_r = int(SIZE * 0.013)
    d.rounded_rectangle([body_x, body_y, body_x + body_w, body_y + body_h],
                        radius=body_r, fill=BODY_CREAM)

    label_pad_x = int(body_w * 0.05)
    label_pad_y = int(body_h * 0.06)
    lx0 = body_x + label_pad_x
    lx1 = body_x + body_w - label_pad_x
    ly0 = body_y + label_pad_y
    ly1 = body_y + int(body_h * 0.42)

    stripe_w = int((lx1 - lx0) * 0.20)
    stripe_h = int((ly1 - ly0) * 0.14)
    stripe_x = lx0 + int((lx1 - lx0) * 0.02)
    stripe_y = ly0 + int((ly1 - ly0) * 0.12)
    d.rectangle([stripe_x, stripe_y, stripe_x + stripe_w, stripe_y + stripe_h],
                fill=LABEL_STRIPE)

    rule_y0 = ly0 + int((ly1 - ly0) * 0.45)
    rule_y1 = ly1 - int((ly1 - ly0) * 0.08)
    n_rules = 4
    rule_thick = max(2, int(SIZE * 0.0015))
    for i in range(n_rules):
        ry = rule_y0 + i * (rule_y1 - rule_y0) // (n_rules - 1)
        d.rectangle([lx0 + int((lx1 - lx0) * 0.02), ry,
                     lx1 - int((lx1 - lx0) * 0.02), ry + rule_thick],
                    fill=LINE_GRAY)

    tw_x0 = body_x + int(body_w * 0.09)
    tw_x1 = body_x + body_w - int(body_w * 0.09)
    tw_y0 = body_y + int(body_h * 0.50)
    tw_y1 = body_y + int(body_h * 0.86)
    tw_r = int(SIZE * 0.008)
    d.rounded_rectangle([tw_x0, tw_y0, tw_x1, tw_y1], radius=tw_r, fill=TRANSPORT_DARK)

    reel_cy = (tw_y0 + tw_y1) // 2
    reel_r = int(body_h * 0.13)
    reel_gap = int(body_w * 0.22)
    cx_mid = body_x + body_w // 2
    reel_xs = [cx_mid - reel_gap, cx_mid + reel_gap]
    for rx in reel_xs:
        d.ellipse([rx - reel_r, reel_cy - reel_r, rx + reel_r, reel_cy + reel_r],
                  fill=REEL_CORE)
        hub_r = int(reel_r * 0.62)
        d.ellipse([rx - hub_r, reel_cy - hub_r, rx + hub_r, reel_cy + hub_r],
                  fill=REEL_HUB)
        core_r = int(reel_r * 0.16)
        d.ellipse([rx - core_r, reel_cy - core_r, rx + core_r, reel_cy + core_r],
                  fill=REEL_CORE)

    tape_x0 = reel_xs[0] + int(reel_r * 0.55)
    tape_x1 = reel_xs[1] - int(reel_r * 0.55)
    tape_y_top = reel_cy + int(reel_r * 0.15)
    tape_dip = int(body_h * 0.035)
    tape_thick = max(2, int(SIZE * 0.0025))
    n_seg = 40
    pts = []
    for i in range(n_seg + 1):
        t = i / n_seg
        x = tape_x0 + (tape_x1 - tape_x0) * t
        y = tape_y_top + tape_dip * 4 * t * (1 - t)
        pts.append((x, y))
    for i in range(len(pts) - 1):
        d.line([pts[i], pts[i + 1]], fill=TAPE_BROWN, width=tape_thick)

    n_dots = 5
    dot_r = max(2, int(SIZE * 0.004))
    dot_y = body_y + body_h - int(body_h * 0.07)
    dot_x0 = body_x + int(body_w * 0.28)
    dot_x1 = body_x + body_w - int(body_w * 0.28)
    for i in range(n_dots):
        dx = dot_x0 + i * (dot_x1 - dot_x0) // (n_dots - 1)
        d.ellipse([dx - dot_r, dot_y - dot_r, dx + dot_r, dot_y + dot_r],
                  fill=REEL_CORE)

    rng_specks = np.random.default_rng(13)
    for _ in range(22):
        sx = body_x + int(rng_specks.random() * body_w)
        sy = body_y + int(rng_specks.random() * body_h)
        if tw_x0 <= sx <= tw_x1 and tw_y0 <= sy <= tw_y1:
            continue
        sr = max(1, int(SIZE * (0.0015 + rng_specks.random() * 0.002)))
        shade = tuple(int(c * 0.86) for c in BODY_CREAM)
        d.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=shade + (180,))

    # NO rotation — horizontal + centered
    final = Image.alpha_composite(bg, cass)
    final = add_grain(final, amount=2, seed=41)
    return final.convert("RGB").resize((FINAL, FINAL), Image.LANCZOS)


if __name__ == "__main__":
    print("E3 Level — horizontal + centered cassette …")
    img = logo_e3_level()
    img.save(os.path.join(OUT, "E3_level.png"), "PNG", optimize=True)
    dest = os.path.abspath(os.path.join(OUT, "..", "..",
        "simone ios", "Simone", "Assets.xcassets", "AppIcon.appiconset", "AppIcon.png"))
    img.save(dest, "PNG", optimize=True)
    print(f"Saved: {dest}")
