"""Draws public/og-image.png (1200x630), the picture shown when a link to the site is shared."""
import json, pathlib
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[1]
catalog = json.loads((ROOT / 'public/data/catalog.json').read_text('utf8'))
S = 2  # supersampling
W, H = 1200 * S, 630 * S
BG, LIME, INK, TEXT, MUTED = '#0c0e0f', '#d8f36a', '#10130a', '#f4f5f0', '#a4aba6'

def font(names, size):
    for name in names:
        try:
            return ImageFont.truetype(name, size * S)
        except OSError:
            pass
    return ImageFont.load_default(size * S)

bold = ['segoeuib.ttf', 'arialbd.ttf', 'DejaVuSans-Bold.ttf']
regular = ['segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf']

img = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(img)

# The logo mark, drawn from its 64-unit grid.
K, OX, OY = 6.2 * S, 70 * S, 96 * S
def P(x, y): return (OX + x * K, OY + y * K)
def circle(cx, cy, r, **kw): d.ellipse([*P(cx - r, cy - r), *P(cx + r, cy + r)], **kw)
circle(43, 21, 17.5, outline='#4f5a2c', width=int(3 * K))
circle(35, 29, 19.5, fill=BG, outline='#9bb04f', width=int(3 * K))
circle(27, 37, 22.5, fill=BG)
circle(27, 37, 21, fill=LIME)
face = Image.new('L', (W, H), 0)
f = ImageDraw.Draw(face)
f.line([P(5, 25), P(49, 40)], fill=255, width=int(2.6 * K))
f.ellipse([*P(35.5 - 6.8, 34.5 - 6.2), *P(35.5 + 6.8, 34.5 + 6.2)], fill=255)
f.ellipse([*P(18.5 - 3.3, 34 - 3.3), *P(18.5 + 3.3, 34 + 3.3)], fill=255)
smile = [P(17.5 + (35 - 17.5) * t + 0, (1 - t) ** 2 * 45.5 + 2 * (1 - t) * t * 52.5 + t * t * 46.5) for t in [i / 40 for i in range(41)]]
smile = [P((1 - t) ** 2 * 17.5 + 2 * (1 - t) * t * 25.5 + t * t * 35, (1 - t) ** 2 * 45.5 + 2 * (1 - t) * t * 52.5 + t * t * 46.5) for t in [i / 40 for i in range(41)]]
f.line(smile, fill=255, width=int(3 * K), joint='curve')
for x, y in (smile[0], smile[-1]):
    f.ellipse([x - 1.5 * K, y - 1.5 * K, x + 1.5 * K, y + 1.5 * K], fill=255)
disc = Image.new('L', (W, H), 0)
ImageDraw.Draw(disc).ellipse([*P(6, 16), *P(48, 58)], fill=255)
from PIL import ImageChops
img.paste(INK, mask=ImageChops.multiply(face, disc))

# Words.
x = 520 * S
d.text((x, 150 * S), 'ODIN', font=font(bold, 112), fill=TEXT)
d.text((x, 284 * S), 'Avatar Library', font=font(regular, 64), fill=MUTED)
d.text((x, 400 * S), f"{catalog['packCount']} packs · {catalog['imageCount']:,} avatars", font=font(bold, 40), fill=LIME)
d.text((x, 462 * S), 'Profile pictures for your Odin profiles', font=font(regular, 30), fill=MUTED)

out = ROOT / 'public/og-image.png'
img.resize((1200, 630), Image.LANCZOS).quantize(64, dither=Image.Dither.NONE).save(out, optimize=True)
print(out.name, out.stat().st_size, 'bytes')
