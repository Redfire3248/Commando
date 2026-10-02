"""COMMANDO's app icon: JAX and DUKE (the two starter agents) from their idle art over a jungle scene.
Writes assets/icons/icon-<size>.png, a maskable 512 and favicon.png. Run: python tools/make_icon.py"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', 'assets')
OUT = os.path.join(ROOT, 'icons')


def first_frame(name, frames=4):
    im = Image.open(os.path.join(ROOT, 'atlas', name + '.png')).convert('RGBA')
    w = im.width // frames
    f = im.crop((0, 0, w, im.height))
    return f.crop(f.getbbox())


def bust(name, keep=0.62):
    """head, chest and rifle: the top part of the standing frame"""
    f = first_frame(name)
    return f.crop((0, 0, f.width, int(f.height * keep)))


def backdrop(S):
    bg = Image.open(os.path.join(ROOT, 'atlas', 'bg15_1.png')).convert('RGB')
    side = bg.height
    bg = bg.crop(((bg.width - side) // 2, 0, (bg.width + side) // 2, side)).resize((S, S), Image.LANCZOS)
    bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(S / 160))).enhance(0.55)
    # darken towards the edges so the agents stand out
    shade = Image.new('L', (S, S), 0)
    ImageDraw.Draw(shade).ellipse((-S * .25, -S * .1, S * 1.25, S * 1.35), fill=255)
    shade = shade.filter(ImageFilter.GaussianBlur(S / 6))
    return Image.composite(bg, Image.new('RGB', (S, S), (7, 9, 11)), shade).convert('RGBA')


def paste_px(canvas, img, h, cx, bottom):
    """pixel art scaled by nearest neighbour to height h, centred on cx, standing on bottom"""
    w = round(img.width * h / img.height)
    img = img.resize((w, h), Image.NEAREST)
    canvas.alpha_composite(img, (int(cx - w / 2), int(bottom - h)))


def icon(S, safe=1.0):
    c = backdrop(S)
    inner = S * safe                      # maskable icons keep the art inside the middle 80 %
    off = (S - inner) / 2
    jax, duke = bust('idle_jax'), bust('idle_duke')
    paste_px(c, ImageEnhance.Brightness(jax).enhance(0.8), int(inner * .74), off + inner * .27, S)
    paste_px(c, duke, int(inner * .84), off + inner * .64, S)
    # orange band along the bottom, the menus' accent colour
    d = ImageDraw.Draw(c)
    d.rectangle((0, S - S * .05, S, S), fill=(255, 138, 40, 255))
    return c


def rounded(img, r):
    m = Image.new('L', img.size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, img.width - 1, img.height - 1), r, fill=255)
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.paste(img, (0, 0), m)
    return out


os.makedirs(OUT, exist_ok=True)
big = icon(512)
big.save(os.path.join(OUT, 'icon-512.png'))
big.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'icon-192.png'))
icon(512, safe=0.8).save(os.path.join(OUT, 'icon-512-maskable.png'))
big.resize((180, 180), Image.LANCZOS).save(os.path.join(OUT, 'apple-touch-icon.png'))
rounded(big, 80).resize((64, 64), Image.LANCZOS).save(os.path.join(OUT, 'favicon.png'))
print('icons in', OUT)
