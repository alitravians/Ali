#!/usr/bin/env python3
"""Generate professional Game Pass / Dev Product icons for مدينة التبرعات.
Theme: Cyber-Neon — black + purple + gold (+ neon blue/red accents)."""
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

RAQM = ImageFont.Layout.RAQM


def afont(path, size):
    return ImageFont.truetype(path, size, layout_engine=RAQM)

S = 512
KUFI_BOLD = "/usr/share/fonts/truetype/noto/NotoKufiArabic-Bold.ttf"
NASKH_BOLD = "/usr/share/fonts/truetype/noto/NotoNaskhArabic-Bold.ttf"
LATIN_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

GOLD1 = (255, 224, 130)
GOLD2 = (212, 160, 23)
GOLD_DK = (150, 105, 10)
PURPLE = (124, 58, 237)
NEON_BLUE = (56, 189, 248)
NEON_RED = (244, 63, 94)


def ar(text):
    # RAQM layout engine handles Arabic shaping + bidi directly
    return text


def vgradient(size, top, bottom):
    w, h = size
    base = Image.new("RGB", (1, h))
    for y in range(h):
        t = y / max(1, h - 1)
        base.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)))
    return base.resize((w, h))


def radial_glow(size, color, cx, cy, radius, strength=1.0):
    w, h = size
    img = Image.new("L", size, 0)
    px = img.load()
    for y in range(h):
        for x in range(w):
            d = math.hypot(x - cx, y - cy)
            v = max(0.0, 1.0 - d / radius)
            px[x, y] = int(255 * (v ** 2) * strength)
    glow = Image.new("RGB", size, color)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(glow, (0, 0))
    out.putalpha(img)
    return out


def gold_text(draw_size, text, font, anchor_xy):
    """Return an RGBA image of text filled with vertical gold gradient + glow."""
    layer = Image.new("RGBA", draw_size, (0, 0, 0, 0))
    mask = Image.new("L", draw_size, 0)
    md = ImageDraw.Draw(mask)
    md.text(anchor_xy, text, font=font, fill=255, anchor="mm")
    grad = vgradient(draw_size, GOLD1, GOLD2).convert("RGBA")
    grad.putalpha(mask)
    return grad, mask


def rounded_border(img, pad, radius, color, width):
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([pad, pad, S - pad, S - pad], radius=radius, outline=color, width=width)


def star(draw, cx, cy, r_out, r_in, points, fill):
    pts = []
    for i in range(points * 2):
        ang = -math.pi / 2 + i * math.pi / points
        r = r_out if i % 2 == 0 else r_in
        pts.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(pts, fill=fill)


def crown(draw, cx, cy, w, h, fill, outline):
    # simple 3-peak crown
    left = cx - w / 2
    right = cx + w / 2
    base_y = cy + h / 2
    top_y = cy - h / 2
    mid_y = cy - h / 6
    pts = [
        (left, base_y), (left, mid_y),
        (cx - w * 0.28, cy + h * 0.05),
        (left + w * 0.30, top_y),
        (cx, cy - h * 0.10),
        (right - w * 0.30, top_y),
        (cx + w * 0.28, cy + h * 0.05),
        (right, mid_y), (right, base_y),
    ]
    draw.polygon(pts, fill=fill, outline=outline)
    draw.rectangle([left, base_y - 6, right, base_y + 10], fill=fill, outline=outline)


def base_canvas(top, bottom, glow_color, accent_dots=True):
    img = vgradient((S, S), top, bottom).convert("RGBA")
    img.alpha_composite(radial_glow((S, S), glow_color, S // 2, int(S * 0.46), int(S * 0.62), 0.9))
    # subtle vignette corners
    if accent_dots:
        d = ImageDraw.Draw(img)
        for (col, cx) in [(NEON_RED, 70), (NEON_BLUE, S - 70)]:
            g = radial_glow((S, S), col, cx, S - 80, 120, 0.55)
            img.alpha_composite(g)
    return img


def finalize(img, title_ar):
    rounded_border(img, 14, 54, GOLD2, 8)
    rounded_border(img, 22, 48, (255, 240, 200), 2)
    img = img.filter(ImageFilter.SMOOTH_MORE)
    return img


# ---------- VIP ----------
def make_vip():
    img = base_canvas((10, 8, 22), (32, 16, 54), PURPLE)
    d = ImageDraw.Draw(img)
    # crown glow
    cg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cg)
    crown(cd, S // 2, 150, 190, 130, GOLD1, GOLD_DK)
    cg_blur = cg.filter(ImageFilter.GaussianBlur(10))
    img.alpha_composite(cg_blur)
    crown(d, S // 2, 150, 190, 130, GOLD1, GOLD_DK)
    # small gems on crown
    for gx, gc in [(S//2 - 55, NEON_RED), (S//2, GOLD2), (S//2 + 55, NEON_BLUE)]:
        d.ellipse([gx-9, 150-9, gx+9, 150+9], fill=gc, outline=(255,255,255))
    # VIP text
    f = ImageFont.truetype(LATIN_BOLD, 175)
    grad, mask = gold_text((S, S), "VIP", f, (S // 2, 300))
    glow = grad.filter(ImageFilter.GaussianBlur(14))
    img.alpha_composite(glow)
    img.alpha_composite(grad)
    # arabic tagline
    fa = afont(NASKH_BOLD, 46)
    ga, _ = gold_text((S, S), ar("عضوية مميزة"), fa, (S // 2, 418))
    img.alpha_composite(ga)
    img = finalize(img, "VIP")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/vip.png", quality=95)


# ---------- Coins packs ----------
def coin_stack(d, cx, cy, n, rx=58, ry=20, gap=26):
    for i in range(n):
        y = cy - i * gap
        d.ellipse([cx-rx, y-ry, cx+rx, y+ry], fill=GOLD2, outline=GOLD_DK, width=3)
    # top face
    y = cy - (n-1) * gap
    d.ellipse([cx-rx, y-ry, cx+rx, y+ry], fill=GOLD1, outline=GOLD_DK, width=3)
    f = ImageFont.truetype(LATIN_BOLD, 30)
    d.text((cx, y), "$", font=f, fill=GOLD_DK, anchor="mm")


def make_coins(name, amount_ar, stacks):
    img = base_canvas((10, 8, 22), (30, 22, 12), GOLD2)
    d = ImageDraw.Draw(img)
    # coins glow
    cg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    cd = ImageDraw.Draw(cg)
    positions = [(S//2, 250, 4)]
    if stacks >= 2:
        positions = [(S//2 - 90, 270, 3), (S//2 + 90, 260, 4), (S//2, 300, 5)]
    if stacks >= 3:
        positions = [(S//2 - 110, 280, 4), (S//2 + 110, 270, 5), (S//2, 310, 6)]
    for (x, y, n) in positions:
        coin_stack(cd, x, y, n)
    cg_blur = cg.filter(ImageFilter.GaussianBlur(12))
    img.alpha_composite(cg_blur)
    img.alpha_composite(cg)
    # amount
    fa = afont(NASKH_BOLD, 60)
    ga, _ = gold_text((S, S), ar(amount_ar), fa, (S // 2, 380))
    img.alpha_composite(ga)
    fl = afont(NASKH_BOLD, 34)
    gl, _ = gold_text((S, S), ar("كوينز"), fl, (S // 2, 438))
    img.alpha_composite(gl)
    img = finalize(img, name)
    img.convert("RGB").save(f"/home/ubuntu/donation_city/icons/{name}.png", quality=95)


# ---------- Ticket ----------
def make_ticket():
    img = base_canvas((10, 8, 22), (40, 14, 30), NEON_RED)
    d = ImageDraw.Draw(img)
    # ticket shape
    tl = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(tl)
    x0, y0, x1, y1 = 96, 170, S-96, 360
    td.rounded_rectangle([x0, y0, x1, y1], radius=26, fill=GOLD1, outline=GOLD_DK, width=5)
    # perforation notches
    midx = (x0 + x1)//2
    for yy in range(y0+18, y1, 30):
        td.ellipse([midx-7, yy, midx+7, yy+14], fill=(30, 16, 22))
    img.alpha_composite(tl.filter(ImageFilter.GaussianBlur(9)))
    img.alpha_composite(tl)
    # star on ticket
    star(d, x0+70, (y0+y1)//2, 34, 15, 5, GOLD2)
    fa = afont(NASKH_BOLD, 40)
    ga, _ = gold_text((S, S), ar("تذكرة"), fa, (midx+55, (y0+y1)//2 - 22))
    img.alpha_composite(ga)
    gb, _ = gold_text((S, S), ar("فورية"), fa, (midx+55, (y0+y1)//2 + 30))
    img.alpha_composite(gb)
    fl = afont(NASKH_BOLD, 44)
    gl, _ = gold_text((S, S), ar("دخول فوري للعرض"), fl, (S//2, 420))
    img.alpha_composite(gl)
    img = finalize(img, "ticket")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/ticket.png", quality=95)


WHITE = (250, 248, 240)

# ---------- بوفيه مفتوح (Popcorn) ----------
def make_buffet():
    img = base_canvas((10, 8, 22), (44, 14, 18), NEON_RED)
    d = ImageDraw.Draw(img)
    cx = S // 2
    # popcorn box (red/white vertical stripes), trapezoid
    box_top_y, box_bot_y = 250, 430
    tw, bw = 150, 120  # half widths top/bottom
    stripes = 7
    for i in range(stripes):
        t0 = i / stripes
        t1 = (i + 1) / stripes
        col = NEON_RED if i % 2 == 0 else WHITE
        xt0 = cx - tw + 2 * tw * t0
        xt1 = cx - tw + 2 * tw * t1
        xb0 = cx - bw + 2 * bw * t0
        xb1 = cx - bw + 2 * bw * t1
        d.polygon([(xt0, box_top_y), (xt1, box_top_y), (xb1, box_bot_y), (xb0, box_bot_y)], fill=col)
    d.line([(cx - tw, box_top_y), (cx - bw, box_bot_y)], fill=GOLD_DK, width=4)
    d.line([(cx + tw, box_top_y), (cx + bw, box_bot_y)], fill=GOLD_DK, width=4)
    # popcorn pieces puffing out the top
    pg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pg)
    import random
    random.seed(7)
    for _ in range(46):
        px = cx + random.randint(-150, 150)
        py = box_top_y - 60 + random.randint(-90, 70)
        r = random.randint(16, 26)
        col = random.choice([GOLD1, WHITE, GOLD2])
        for _ in range(4):
            ox, oy = random.randint(-r, r), random.randint(-r, r)
            rr = random.randint(8, 14)
            pd.ellipse([px + ox - rr, py + oy - rr, px + ox + rr, py + oy + rr], fill=col, outline=GOLD_DK)
    img.alpha_composite(pg.filter(ImageFilter.GaussianBlur(7)))
    img.alpha_composite(pg)
    fa = afont(KUFI_BOLD, 52)
    ga, _ = gold_text((S, S), ar("بوفيه مفتوح"), fa, (cx, 470))
    img.alpha_composite(ga)
    img = finalize(img, "buffet")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/buffet.png", quality=95)


# ---------- مالك العرض (Showrunner / clapperboard + play) ----------
def make_showrunner():
    img = base_canvas((10, 8, 22), (24, 16, 54), PURPLE)
    d = ImageDraw.Draw(img)
    cx = S // 2
    # clapperboard base
    bx0, by0, bx1, by1 = 110, 220, S - 110, 410
    d.rounded_rectangle([bx0, by0, bx1, by1], radius=18, fill=(22, 18, 36), outline=GOLD2, width=5)
    # clapper top (angled bar with teeth)
    top = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    td = ImageDraw.Draw(top)
    td.rounded_rectangle([bx0, by0 - 56, bx1, by0 - 10], radius=10, fill=(14, 12, 24), outline=GOLD2, width=4)
    for i in range(7):
        x = bx0 + 16 + i * 52
        td.polygon([(x, by0 - 52), (x + 30, by0 - 52), (x + 16, by0 - 16), (x - 14, by0 - 16)], fill=WHITE)
    top = top.rotate(-8, center=(cx, by0 - 30), resample=Image.BICUBIC)
    img.alpha_composite(top)
    # play triangle (neon)
    pg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pg)
    pcy = (by0 + by1) // 2 + 16
    pd.polygon([(cx - 42, pcy - 52), (cx - 42, pcy + 52), (cx + 56, pcy)], fill=NEON_BLUE)
    img.alpha_composite(pg.filter(ImageFilter.GaussianBlur(10)))
    img.alpha_composite(pg)
    fa = afont(KUFI_BOLD, 52)
    ga, _ = gold_text((S, S), ar("مالك العرض"), fa, (cx, 462))
    img.alpha_composite(ga)
    img = finalize(img, "showrunner")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/showrunner.png", quality=95)


# ---------- أثر نيون (Neon Trail) ----------
def make_neontrail():
    img = base_canvas((10, 8, 22), (18, 20, 48), NEON_BLUE)
    cx, cy = S // 2, 280
    trail = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    tdraw = ImageDraw.Draw(trail)
    # comet streak: series of fading dots along a curve
    n = 26
    for i in range(n):
        t = i / (n - 1)
        x = 120 + t * 300
        y = 360 - math.sin(t * math.pi) * 200
        r = 6 + t * 30
        # color blend cyan -> pink
        col = tuple(int(NEON_BLUE[k] + (NEON_RED[k] - NEON_BLUE[k]) * t) for k in range(3))
        tdraw.ellipse([x - r, y - r, x + r, y + r], fill=col)
    img.alpha_composite(trail.filter(ImageFilter.GaussianBlur(16)))
    img.alpha_composite(trail.filter(ImageFilter.GaussianBlur(4)))
    # bright head
    hd = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    hdd = ImageDraw.Draw(hd)
    hx, hy = 120 + 300, 360 - 0
    hdd.ellipse([hx - 30, hy - 30, hx + 30, hy + 30], fill=WHITE)
    img.alpha_composite(hd.filter(ImageFilter.GaussianBlur(12)))
    img.alpha_composite(hd)
    # sparkles
    d = ImageDraw.Draw(img)
    for sx, sy, sr in [(150, 180, 8), (360, 150, 6), (300, 300, 7), (200, 360, 5)]:
        star(d, sx, sy, sr * 2, sr, 4, WHITE)
    fa = afont(KUFI_BOLD, 56)
    ga, _ = gold_text((S, S), ar("أثر نيون"), fa, (cx, 460))
    img.alpha_composite(ga)
    img = finalize(img, "neontrail")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/neontrail.png", quality=95)


# ---------- مايك الإعلان (Announcer Mic) ----------
def make_mic():
    img = base_canvas((10, 8, 22), (30, 24, 14), GOLD2)
    d = ImageDraw.Draw(img)
    cx = S // 2
    # sound waves (arcs) on both sides
    wg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    wd = ImageDraw.Draw(wg)
    for i, rad in enumerate([60, 100, 140]):
        col = NEON_BLUE if i % 2 == 0 else GOLD1
        wd.arc([cx - rad, 200 - rad, cx + rad, 200 + rad], start=200, end=250, fill=col, width=10)
        wd.arc([cx - rad, 200 - rad, cx + rad, 200 + rad], start=-70, end=-20, fill=col, width=10)
    img.alpha_composite(wg.filter(ImageFilter.GaussianBlur(6)))
    img.alpha_composite(wg)
    # mic head (rounded capsule)
    mx0, my0, mx1, my1 = cx - 58, 170, cx + 58, 330
    d.rounded_rectangle([mx0, my0, mx1, my1], radius=58, fill=GOLD1, outline=GOLD_DK, width=5)
    for gy in range(my0 + 24, my1 - 20, 26):
        d.line([(mx0 + 16, gy), (mx1 - 16, gy)], fill=GOLD_DK, width=4)
    # stand
    d.line([(cx, my1), (cx, my1 + 60)], fill=GOLD2, width=12)
    d.arc([cx - 70, my1 - 50, cx + 70, my1 + 60], start=20, end=160, fill=GOLD2, width=12)
    d.rounded_rectangle([cx - 50, my1 + 58, cx + 50, my1 + 74], radius=8, fill=GOLD2)
    fa = afont(KUFI_BOLD, 50)
    ga, _ = gold_text((S, S), ar("مايك الإعلان"), fa, (cx, 470))
    img.alpha_composite(ga)
    img = finalize(img, "mic")
    img.convert("RGB").save("/home/ubuntu/donation_city/icons/mic.png", quality=95)


import os
os.makedirs("/home/ubuntu/donation_city/icons", exist_ok=True)
make_vip()
make_coins("coins250", "٢٥٠", 1)
make_coins("coins600", "٦٠٠", 2)
make_coins("coins1500", "١٥٠٠", 3)
make_ticket()
make_buffet()
make_showrunner()
make_neontrail()
make_mic()
print("done")
