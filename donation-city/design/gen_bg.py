#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Professional main-menu background generator for "مدينة التبرعات".
Clean atmospheric scenes (NO competing title text — the in-game GUI draws
the title/tagline/buttons on top). Calm center so the button column stays
readable. Also renders a menu-overlay PREVIEW that mimics the real menu.
Output: 1920x1080 (16:9).
"""
import math, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import arabic_reshaper
from bidi.algorithm import get_display

W, H = 1920, 1080
FONTS = "/home/ubuntu/fonts"

def ar(t): return get_display(arabic_reshaper.reshape(t))
def font(p, s): return ImageFont.truetype(f"{FONTS}/{p}", s)
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def vgrad(size, stops):
    w, h = size
    img = Image.new("RGB", size); px = img.load()
    for y in range(h):
        t = y / (h - 1); c = stops[-1][1]
        for i in range(len(stops) - 1):
            p0, c0 = stops[i]; p1, c1 = stops[i + 1]
            if p0 <= t <= p1:
                tt = (t - p0) / (p1 - p0) if p1 > p0 else 0; c = lerp(c0, c1, tt); break
        for x in range(w): px[x, y] = c
    return img

def radial_glow(size, center, radius, color, strength=1.0):
    layer = Image.new("L", size, 0); d = ImageDraw.Draw(layer)
    cx, cy = center; steps = 60
    for i in range(steps, 0, -1):
        r = radius * i / steps; a = int(255 * strength * (1 - i / steps) ** 2)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=a)
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.15))
    glow = Image.new("RGB", size, color); out = Image.new("RGB", size, (0, 0, 0))
    out.paste(glow, (0, 0), layer); return out

def skyline(size, base_y, color, light_color, density=0.5, max_h=380, seed=1):
    rnd = random.Random(seed); w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    x = -20
    while x < w + 20:
        bw = rnd.randint(60, 150); bh = rnd.randint(int(max_h * 0.35), max_h)
        top = base_y - bh
        d.rectangle([x, top, x + bw, base_y + 40], fill=color)
        if rnd.random() < 0.3:
            ax = x + bw // 2; d.rectangle([ax - 3, top - rnd.randint(20, 60), ax + 3, top], fill=color)
        for wy in range(top + 14, base_y, 22):
            for wx in range(x + 10, x + bw - 10, 20):
                if rnd.random() < density:
                    lc = light_color if rnd.random() < 0.75 else (255, 240, 200)
                    d.rectangle([wx, wy, wx + 8, wy + 11], fill=lc + (rnd.randint(120, 235),))
        x += bw + rnd.randint(-8, 16)
    return layer

def bokeh(size, color, n=60, seed=3, ymax=0.7):
    rnd = random.Random(seed); w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    for _ in range(n):
        x = rnd.randint(0, w); y = rnd.randint(0, int(h * ymax))
        r = rnd.randint(2, 10); a = rnd.randint(20, 90)
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (a,))
    return layer.filter(ImageFilter.GaussianBlur(2))

def coin(d, cx, cy, r, c1, c2):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c1, outline=c2, width=max(2, r // 6))
    d.ellipse([cx - r * 0.55, cy - r * 0.55, cx + r * 0.55, cy + r * 0.55], outline=c2, width=max(2, r // 7))

def heart(d, cx, cy, s, color):
    rr = s * 0.5
    d.pieslice([cx - s, cy - rr, cx, cy + rr], 180, 360, fill=color)
    d.pieslice([cx, cy - rr, cx + s, cy + rr], 180, 360, fill=color)
    d.polygon([(cx - s, cy), (cx + s, cy), (cx, cy + s * 1.15)], fill=color)

def motifs(size, accent, warm, seed=51):
    """Subtle floating coins/hearts near top corners (donation theme, center kept clear)."""
    rnd = random.Random(seed); w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    spots = [(0.10, 0.18), (0.16, 0.40), (0.88, 0.16), (0.83, 0.38), (0.06, 0.62), (0.92, 0.58)]
    for (fx, fy) in spots:
        cx, cy = int(w * fx), int(h * fy); r = rnd.randint(16, 30)
        if rnd.random() < 0.5:
            coin(d, cx, cy, r, warm + (180,), (120, 80, 20, 220))
        else:
            heart(d, cx, cy, r, accent + (160,))
    return layer.filter(ImageFilter.GaussianBlur(1))

def vignette(base, strength=0.55):
    w, h = base.size
    mask = Image.new("L", (w, h), 0); d = ImageDraw.Draw(mask)
    d.ellipse([-w * 0.25, -h * 0.25, w * 1.25, h * 1.25], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(220))
    dark = Image.new("RGB", (w, h), (0, 0, 0))
    base.paste(Image.composite(base, dark, mask), (0, 0))
    inv = Image.eval(mask, lambda p: int((255 - p) * strength))
    base.paste(dark, (0, 0), inv); return base

def add(base, layer):
    b = base.convert("RGBA"); b.alpha_composite(layer); return b.convert("RGB")
def screen_blend(base, rgb): return ImageChops.screen(base, rgb)

# ---------------- variants (CLEAN, no title) ----------------
def build_neon():
    base = vgrad((W, H), [(0.0,(8,10,30)),(0.4,(18,22,58)),(0.68,(40,34,86)),
                          (0.85,(150,64,124)),(1.0,(255,150,92))])
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.92),1150,(255,120,60),0.5))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.5),760,(40,120,200),0.22))  # soft central stage
    base = add(base, bokeh((W,H),(120,200,255),70,seed=7))
    base = add(base, motifs((W,H),(255,90,120),(255,205,120),seed=7))
    base = add(base, skyline((W,H),int(H*0.97),(10,10,26),(95,205,255),0.5,440,seed=11))
    base = add(base, skyline((W,H),int(H*1.0),(5,5,16),(255,180,120),0.4,300,seed=5))
    gl = Image.new("RGBA",(W,H),(0,0,0,0)); ImageDraw.Draw(gl).line([0,int(H*0.7),W,int(H*0.7)],fill=(120,220,255,110),width=3)
    base = add(base, gl.filter(ImageFilter.GaussianBlur(6)))
    return vignette(base, 0.5)

def build_gold():
    base = vgrad((W, H), [(0.0,(10,16,38)),(0.5,(24,40,82)),(0.8,(54,74,126)),(1.0,(238,194,116))])
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.9),1250,(255,200,110),0.55))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.5),720,(255,220,150),0.18))
    base = add(base, bokeh((W,H),(255,220,150),80,seed=21))
    base = add(base, motifs((W,H),(255,120,110),(255,215,130),seed=21))
    base = add(base, skyline((W,H),int(H*0.98),(16,20,40),(255,210,130),0.5,430,seed=33))
    return vignette(base, 0.5)

def build_cinema():
    base = vgrad((W, H), [(0.0,(6,8,22)),(0.45,(16,14,42)),(0.75,(60,22,62)),(1.0,(180,52,72))])
    beams = Image.new("RGBA",(W,H),(0,0,0,0)); bd = ImageDraw.Draw(beams)
    for bx,col in [(W*0.30,(120,180,255,55)),(W*0.70,(255,140,160,55))]:
        bd.polygon([(bx,H),(bx-300,0),(bx+80,0)], fill=col)
    base = add(base, beams.filter(ImageFilter.GaussianBlur(48)))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.92),1050,(255,90,90),0.38))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.5),720,(120,150,255),0.16))
    base = add(base, bokeh((W,H),(200,210,255),60,seed=44))
    base = add(base, motifs((W,H),(255,200,90),(255,170,150),seed=44))
    base = add(base, skyline((W,H),int(H*0.99),(8,8,20),(255,120,140),0.45,410,seed=9))
    return vignette(base, 0.55)

def wave_band(size, y_center, amp, thick, color, seed=1):
    rnd = random.Random(seed); w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    pts_top, pts_bot = [], []
    ph = rnd.uniform(0, 6.28); fr = rnd.uniform(1.5, 3.0)
    for x in range(0, w + 10, 10):
        yy = y_center + math.sin(x / w * fr * 6.28 + ph) * amp
        pts_top.append((x, yy)); pts_bot.append((x, yy + thick))
    poly = pts_top + pts_bot[::-1]
    d.polygon(poly, fill=color)
    return layer.filter(ImageFilter.GaussianBlur(28))

def balloon(d, cx, cy, r, body, accent):
    d.ellipse([cx - r, cy - r, cx + r, cy + r * 1.25], fill=body)
    d.arc([cx - r*0.5, cy - r, cx + r*0.5, cy + r*1.25], 250, 290, fill=accent, width=max(2, r//8))
    d.polygon([(cx - r*0.18, cy + r*1.2), (cx + r*0.18, cy + r*1.2), (cx, cy + r*1.45)], fill=accent)
    d.line([cx, cy + r*1.45, cx, cy + r*2.1], fill=(255,255,255,120), width=2)
    bw = r*0.32
    d.rectangle([cx-bw, cy+r*2.1, cx+bw, cy+r*2.5], fill=(120,80,50))

def giftbox(d, cx, cy, s, box, ribbon):
    d.rectangle([cx-s, cy-s*0.7, cx+s, cy+s], fill=box)
    d.rectangle([cx-s, cy-s*0.95, cx+s, cy-s*0.7], fill=ribbon)
    d.rectangle([cx-s*0.18, cy-s*0.7, cx+s*0.18, cy+s], fill=ribbon)
    d.polygon([(cx, cy-s*0.95),(cx-s*0.5,cy-s*1.3),(cx-s*0.1,cy-s*0.95)], fill=ribbon)
    d.polygon([(cx, cy-s*0.95),(cx+s*0.5,cy-s*1.3),(cx+s*0.1,cy-s*0.95)], fill=ribbon)

def confetti(size, n=180, seed=5):
    rnd = random.Random(seed); w, h = size
    layer = Image.new("RGBA", size, (0,0,0,0))
    cols = [(255,90,120),(120,200,255),(255,210,120),(150,110,255),(120,230,180)]
    for _ in range(n):
        x = rnd.randint(0, w); y = rnd.randint(0, int(h*0.75))
        s = rnd.randint(5, 13); c = rnd.choice(cols) + (rnd.randint(120, 220),)
        ang = rnd.uniform(0, 360)
        rect = Image.new("RGBA", (s, max(2,int(s*0.5))), c)
        rect = rect.rotate(ang, expand=True)
        layer.alpha_composite(rect, (x, y))
    return layer

def build_aurora():
    base = vgrad((W, H), [(0.0,(4,8,26)),(0.5,(8,18,44)),(0.8,(14,30,58)),(1.0,(20,44,70))])
    base = add(base, bokeh((W,H),(180,220,255),90,seed=61,ymax=0.55))
    base = add(base, wave_band((W,H), int(H*0.30), 70, 150, (80,255,180,90), seed=2))
    base = add(base, wave_band((W,H), int(H*0.40), 90, 120, (120,200,255,80), seed=8))
    base = add(base, wave_band((W,H), int(H*0.24), 60, 90, (160,120,255,70), seed=15))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.5),700,(40,120,160),0.16))
    base = add(base, motifs((W,H),(255,120,150),(255,210,140),seed=61))
    base = add(base, skyline((W,H),int(H*0.99),(6,12,26),(120,230,200),0.45,420,seed=23))
    return vignette(base, 0.5)

def build_dawn():
    base = vgrad((W, H), [(0.0,(28,30,72)),(0.4,(70,60,120)),(0.66,(220,120,140)),
                          (0.85,(255,170,120)),(1.0,(255,214,150))])
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.82),900,(255,210,150),0.55))
    base = add(base, bokeh((W,H),(255,225,180),70,seed=71))
    bl = Image.new("RGBA",(W,H),(0,0,0,0)); bd = ImageDraw.Draw(bl)
    for (fx,fy,r,body,acc) in [(0.16,0.30,46,(255,110,120),(255,235,235)),
                               (0.84,0.24,38,(120,180,255),(235,245,255)),
                               (0.74,0.46,30,(255,200,110),(255,245,225))]:
        balloon(bd, int(W*fx), int(H*fy), r, body, acc)
    base = add(base, bl)
    base = add(base, motifs((W,H),(255,90,120),(255,210,130),seed=71))
    base = add(base, skyline((W,H),int(H*1.0),(60,40,70),(255,220,160),0.35,260,seed=29))
    return vignette(base, 0.45)

def build_gala():
    base = vgrad((W, H), [(0.0,(20,6,40)),(0.45,(48,12,72)),(0.75,(96,24,110)),(1.0,(190,60,150))])
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.5),820,(180,80,200),0.22))
    base = screen_blend(base, radial_glow((W,H),(W*0.5,H*0.92),1050,(255,120,180),0.4))
    base = add(base, confetti((W,H), 200, seed=5))
    gl = Image.new("RGBA",(W,H),(0,0,0,0)); gd = ImageDraw.Draw(gl)
    giftbox(gd, int(W*0.12), int(H*0.40), 40, (255,90,140), (255,225,120))
    giftbox(gd, int(W*0.88), int(H*0.36), 34, (120,200,255), (255,225,120))
    coin(gd, int(W*0.90), int(H*0.58), 24, (255,215,120,220),(150,100,20,230))
    coin(gd, int(W*0.09), int(H*0.62), 20, (255,215,120,220),(150,100,20,230))
    base = add(base, gl)
    base = add(base, skyline((W,H),int(H*0.99),(20,8,32),(255,150,210),0.4,380,seed=37))
    return vignette(base, 0.5)

# ---------------- menu overlay preview ----------------
def glow_text(base, xy, text, fnt, fill, glow_color, anchor="mm", gr=16, gs=3):
    w,h = base.size; gl = Image.new("RGBA",(w,h),(0,0,0,0))
    ImageDraw.Draw(gl).text(xy, text, font=fnt, fill=glow_color+(255,), anchor=anchor)
    bl = gl.filter(ImageFilter.GaussianBlur(gr))
    for _ in range(gs): base.paste(bl,(0,0),bl)
    ImageDraw.Draw(base).text(xy, text, font=fnt, fill=fill, anchor=anchor)

def grad_text(base, xy, text, fnt, c_top, c_bot, anchor="mm"):
    # draw text filled with a vertical gradient
    w,h = base.size
    tmp = Image.new("L",(w,h),0); ImageDraw.Draw(tmp).text(xy,text,font=fnt,fill=255,anchor=anchor)
    bbox = tmp.getbbox()
    if not bbox: return
    grad = vgrad((w,h),[(0,c_top),(1,c_bot)])
    base.paste(grad,(0,0),tmp)

def rounded(d, box, r, fill, outline=None, ow=0):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=outline, width=ow)

def menu_preview(bg, path):
    base = bg.copy()
    # global dim like in-game (BackgroundImageDim 0.5)
    dim = Image.new("RGBA",(W,H),(6,8,20,120)); base = add(base, dim)
    cx = W//2
    # title (GUI overlays this — gradient cyan->violet, Amiri for full glyphs)
    glow_text(base,(cx,int(H*0.16)),ar("مدينة التبرعات"),font("Amiri-Bold.ttf",150),
              (180,235,255),(70,150,255),gr=22,gs=3)
    grad_text(base,(cx,int(H*0.16)),ar("مدينة التبرعات"),font("Amiri-Bold.ttf",150),
              (150,225,255),(150,110,255))
    d = ImageDraw.Draw(base)
    glow_text(base,(cx,int(H*0.27)),ar("تبرّع  •  اكسب  •  استمتع"),font("Amiri-Bold.ttf",46),
              (225,240,255),(60,130,210),gr=8,gs=2)
    # buttons
    btns = [("بدء اللعبة",(96,86,255),(150,110,255),True),
            ("قوانين و هدف اللعبة",(28,26,54),(90,90,140),False),
            ("تحديثات اللعبة",(28,26,54),(90,90,140),False)]
    bw, bh = 470, 78; gap = 26; y0 = int(H*0.42)
    for i,(txt,fill,stroke,prim) in enumerate(btns):
        y = y0 + i*(bh+gap); box=[cx-bw//2,y,cx+bw//2,y+bh]
        if prim:
            grad = vgrad((W,H),[(0,(120,90,255)),(1,(70,120,255))])
            m = Image.new("L",(W,H),0); ImageDraw.Draw(m).rounded_rectangle(box,radius=16,fill=255)
            base.paste(grad,(0,0),m); d = ImageDraw.Draw(base)
        else:
            rounded(d, box, 16, fill)
        d.rounded_rectangle(box,radius=16,outline=stroke,width=2)
        d.text((cx,y+bh//2), ar(txt), font=font("Amiri-Bold.ttf",36), fill=(255,255,255), anchor="mm")
    d.text((cx,int(H*0.93)), ar("الإصدار ٢.٩.٢٨"), font=font("Amiri-Bold.ttf",26), fill=(200,210,230), anchor="mm")
    base.save(path, quality=95)

def storyboard(concepts, bgs, path):
    cols, rows = 3, 2
    pad, gap, top = 40, 28, 150
    cw, ch = 540, 304
    SW = pad*2 + cols*cw + (cols-1)*gap
    SH = top + pad + rows*(ch+58) + (rows-1)*gap
    board = vgrad((SW, SH), [(0,(14,16,30)),(1,(26,22,46))])
    d = ImageDraw.Draw(board)
    glow_text(board, (SW//2, 64), ar("مدينة التبرعات — لوحة تصاميم الخلفية"),
              font("Amiri-Bold.ttf", 56), (210,235,255),(70,150,255), gr=14, gs=2)
    d.text((SW//2, 112), ar("اختر المفهوم الأنسب (A–F)"), fill=(180,195,225),
           font=font("Amiri-Bold.ttf", 30), anchor="mm")
    for i,(name, fn, label) in enumerate(concepts):
        r, c = divmod(i, cols)
        x = pad + c*(cw+gap); y = top + r*(ch+58+gap)
        thumb = bgs[name].resize((cw, ch))
        board.paste(thumb, (x, y))
        d.rectangle([x, y, x+cw, y+ch], outline=(120,160,230), width=3)
        lb = [x, y+ch, x+cw, y+ch+54]
        d.rectangle(lb, fill=(18,20,36))
        d.rectangle(lb, outline=(90,120,190), width=2)
        d.text((x+cw//2, y+ch+27), ar(label), fill=(245,245,255),
               font=font("Amiri-Bold.ttf", 34), anchor="mm")
    board.save(path, quality=95)

if __name__ == "__main__":
    import os
    o = "/home/ubuntu/design/out"; os.makedirs(o, exist_ok=True)
    concepts = [
        ("A_neon",   build_neon,   "A — نيون ليلي"),
        ("B_gold",   build_gold,   "B — ذهبي فخم"),
        ("C_cinema", build_cinema, "C — أضواء سينمائية"),
        ("D_aurora", build_aurora, "D — شفق قطبي"),
        ("E_dawn",   build_dawn,   "E — فجر العطاء"),
        ("F_gala",   build_gala,   "F — حفل أرجواني"),
    ]
    bgs = {}
    for name, fn, label in concepts:
        bg = fn(); bg.save(f"{o}/bg_{name}.jpg", quality=95); bgs[name] = bg
        menu_preview(bg, f"{o}/preview_{name}.jpg")
    storyboard(concepts, bgs, f"{o}/storyboard.jpg")
    print("done")
