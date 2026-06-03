#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Professional Roblox THUMBNAIL + ICON generator for "مدينة التبرعات".
Unlike the in-game menu background (which is clean/no text), the store
thumbnail/icon SHOULD carry a big readable title + feature highlights,
because that is what sells the game on the Roblox page (mostly mobile).

Outputs:
  - banner concepts : 1920x1080  (store thumbnail / promo)
  - icon   concepts :  512x512   (square game icon)
  - storyboard boards for both sizes
Reuses atmospheric primitives from gen_bg.py for a unified identity with
the new Aurora menu background.
"""
import math, random, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops
import arabic_reshaper
from bidi.algorithm import get_display

import gen_bg as G   # reuse vgrad, radial_glow, skyline, bokeh, wave_band, coin, heart, vignette, screen_blend, add, font, ar

FONTS = "/home/ubuntu/fonts"
def ar(t): return arabic_reshaper.reshape(t)  # python-bidi 0.6.x reverses; reshape-only is correct here
def font(p, s): return ImageFont.truetype(f"{FONTS}/{p}", s)

# ---------------- drawn feature icons (vector-ish) ----------------
def ic_cinema(d, cx, cy, s, fg=(255,255,255), ac=(120,90,255)):
    # screen + play triangle (clapper feel via top bar)
    d.rounded_rectangle([cx-s, cy-s*0.72, cx+s, cy+s*0.72], radius=s*0.18, fill=(18,20,40), outline=fg, width=max(2,int(s*0.10)))
    d.rectangle([cx-s, cy-s*0.72, cx+s, cy-s*0.40], fill=ac)
    for i in range(-2,3):
        d.polygon([(cx+i*s*0.42-6, cy-s*0.72),(cx+i*s*0.42+6, cy-s*0.72),(cx+i*s*0.42+2, cy-s*0.40),(cx+i*s*0.42-10, cy-s*0.40)], fill=(20,20,30))
    d.polygon([(cx-s*0.22, cy-s*0.08),(cx-s*0.22, cy+s*0.36),(cx+s*0.30, cy+s*0.14)], fill=fg)

def ic_popcorn(d, cx, cy, s, fg=(255,235,180), ac=(230,70,90)):
    # striped cup
    d.polygon([(cx-s*0.6, cy+s*0.8),(cx+s*0.6, cy+s*0.8),(cx+s*0.5, cy-s*0.2),(cx-s*0.5, cy-s*0.2)], fill=(245,245,250))
    for i in range(-2,3):
        xx = cx + i*s*0.26
        d.line([(xx, cy-s*0.2),(xx*0.96+cx*0.04, cy+s*0.8)], fill=ac, width=max(2,int(s*0.14)))
    for (dx,dy,r) in [(-0.3,-0.35,0.26),(0.0,-0.5,0.30),(0.32,-0.32,0.26),(-0.12,-0.3,0.22),(0.16,-0.28,0.22)]:
        d.ellipse([cx+dx*s-r*s, cy+dy*s-r*s, cx+dx*s+r*s, cy+dy*s+r*s], fill=fg)

def ic_fountain(d, cx, cy, s, fg=(150,225,255), ac=(255,255,255)):
    d.ellipse([cx-s*0.8, cy+s*0.4, cx+s*0.8, cy+s*0.85], fill=(40,90,150))
    d.rectangle([cx-s*0.12, cy-s*0.2, cx+s*0.12, cy+s*0.5], fill=(90,120,160))
    for ang in (-55,-20,20,55):
        rad=math.radians(ang-90)
        d.line([(cx,cy-s*0.2),(cx+math.cos(rad)*s*0.7, cy-s*0.2+math.sin(rad)*s*0.7)], fill=fg, width=max(2,int(s*0.12)))
    d.ellipse([cx-s*0.16, cy-s*0.46, cx+s*0.16, cy-s*0.14], fill=ac)

def ic_coins(d, cx, cy, s, fg=(255,215,120), ac=(150,100,20)):
    for i,dy in enumerate((0.45,0.12,-0.22)):
        G.coin(d, cx, int(cy+dy*s), int(s*0.55), fg+(255,), ac+(255,))

def ic_star(d, cx, cy, s, fg=(255,225,130), ac=(180,120,20)):
    pts=[]
    for i in range(10):
        ang=math.radians(-90+i*36); r=s if i%2==0 else s*0.45
        pts.append((cx+math.cos(ang)*r, cy+math.sin(ang)*r))
    d.polygon(pts, fill=fg, outline=ac)

def feature_strip(base, items, y, accent):
    """Bottom strip of pill badges: items=[(icon_fn,label,iconcolor), ...]"""
    w,h = base.size
    d = ImageDraw.Draw(base)
    n=len(items); pill_w=int(w*0.205); pill_h=int(h*0.115); gap=int(w*0.018)
    total=n*pill_w+(n-1)*gap; x=(w-total)//2
    for (fn,label,icol) in items:
        box=[x, y, x+pill_w, y+pill_h]
        panel=Image.new("RGBA",(w,h),(0,0,0,0)); pd=ImageDraw.Draw(panel)
        pd.rounded_rectangle(box, radius=pill_h//2, fill=(12,16,34,205), outline=accent+(235,), width=3)
        base.alpha_composite(panel)
        d=ImageDraw.Draw(base)
        icx=x+pill_h//2+4; icy=y+pill_h//2
        fn(d, icx, icy, pill_h*0.30, *icol)
        d.text((x+pill_h+int(pill_w*0.04), icy), ar(label), font=font("Amiri-Bold.ttf", int(pill_h*0.34)),
               fill=(245,248,255), anchor="lm")
        x+=pill_w+gap

# ---------------- title block (strong contrast for store) ----------------
def title_block(base, title, tagline, c_top, c_bot, glow, y=0.30, ts=190, badge=None, badge_col=(255,205,90)):
    w,h=base.size; cx=w//2
    # subtle dark plate behind title for legibility on any bg
    plate=Image.new("RGBA",(w,h),(0,0,0,0))
    ImageDraw.Draw(plate).rounded_rectangle([cx-w*0.42, int(h*y)-ts*0.78, cx+w*0.42, int(h*y)+ts*0.62],
                                            radius=40, fill=(6,8,22,120))
    base.alpha_composite(plate.filter(ImageFilter.GaussianBlur(8)))
    if badge:
        bf=font("Amiri-Bold.ttf", int(ts*0.20)); tb=ar(badge)
        bb=ImageDraw.Draw(base).textbbox((0,0),tb,font=bf); bw=bb[2]-bb[0]
        by=int(h*y)-ts*0.92
        bp=Image.new("RGBA",(w,h),(0,0,0,0))
        ImageDraw.Draw(bp).rounded_rectangle([cx-bw//2-26, by-int(ts*0.16), cx+bw//2+26, by+int(ts*0.20)],
                                             radius=100, fill=badge_col+(235,))
        base.alpha_composite(bp)
        ImageDraw.Draw(base).text((cx,by+int(ts*0.02)), tb, font=bf, fill=(40,28,10), anchor="mm")
    # glow + dark outline + gradient fill title
    f=font("Amiri-Bold.ttf", ts)
    gl=Image.new("RGBA",(w,h),(0,0,0,0))
    ImageDraw.Draw(gl).text((cx,int(h*y)),ar(title),font=f,fill=glow+(255,),anchor="mm")
    bl=gl.filter(ImageFilter.GaussianBlur(26))
    for _ in range(3): base.alpha_composite(bl)
    # dark outline
    outl=Image.new("RGBA",(w,h),(0,0,0,0)); od=ImageDraw.Draw(outl)
    for dx in range(-5,6,2):
        for dy in range(-5,6,2):
            od.text((cx+dx,int(h*y)+dy),ar(title),font=f,fill=(4,6,18,255),anchor="mm")
    base.alpha_composite(outl)
    # gradient fill
    mask=Image.new("L",(w,h),0); ImageDraw.Draw(mask).text((cx,int(h*y)),ar(title),font=f,fill=255,anchor="mm")
    grad=G.vgrad((w,h),[(0,c_top),(1,c_bot)])
    base.paste(grad,(0,0),mask)
    if tagline:
        G.glow_text(base,(cx,int(h*y)+int(ts*0.62)),ar(tagline),font("Amiri-Bold.ttf",int(ts*0.26)),
                    (235,244,255),glow,gr=8,gs=2)

FEATURES = [
    (ic_cinema,  "سينما",  ((255,255,255),(120,90,255))),
    (ic_popcorn, "مقصف",   ((255,235,180),(230,70,90))),
    (ic_fountain,"نافورة", ((150,225,255),(255,255,255))),
    (ic_coins,   "متجر",   ((255,215,120),(150,100,20))),
]

# ---------------- BANNER concepts (1920x1080) ----------------
def banner_aurora():
    base=G.build_aurora().convert("RGBA")
    title_block(base,"مدينة التبرعات","سينما • مقاهي • مغامرات",
                (170,235,255),(150,110,255),(70,150,255),y=0.30,ts=200,
                badge="أحدث تحديث",badge_col=(120,220,200))
    feature_strip(base,FEATURES,int(1080*0.78),(90,200,200))
    return base.convert("RGB")

def banner_gold():
    base=G.build_gold().convert("RGBA")
    title_block(base,"مدينة التبرعات","تبرّع • اكسب • استمتع",
                (255,240,200),(255,190,90),(255,180,80),y=0.30,ts=200,
                badge="تجربة فاخرة",badge_col=(255,215,120))
    feature_strip(base,FEATURES,int(1080*0.78),(255,190,90))
    return base.convert("RGB")

def banner_cinema():
    base=G.build_cinema().convert("RGBA")
    title_block(base,"مدينة التبرعات","افلام • بوب كورن • اصدقاء",
                (255,235,235),(255,120,140),(255,90,110),y=0.30,ts=200,
                badge="ليلة سينما",badge_col=(255,140,150))
    feature_strip(base,FEATURES,int(1080*0.78),(255,120,140))
    return base.convert("RGB")

def banner_neon():
    base=G.build_neon().convert("RGBA")
    title_block(base,"مدينة التبرعات","العب • تبرّع • تصدّر",
                (190,240,255),(120,160,255),(80,150,255),y=0.30,ts=200,
                badge="مدينة حيّة",badge_col=(120,200,255))
    feature_strip(base,FEATURES,int(1080*0.78),(110,190,255))
    return base.convert("RGB")

def banner_gala():
    base=G.build_gala().convert("RGBA")
    title_block(base,"مدينة التبرعات","هدايا • حفلات • مفاجآت",
                (255,225,245),(255,140,200),(255,110,180),y=0.30,ts=200,
                badge="أجواء احتفال",badge_col=(255,170,210))
    feature_strip(base,FEATURES,int(1080*0.78),(255,140,200))
    return base.convert("RGB")

# ---------------- ICON concepts (512x512, square) ----------------
def _square_aurora(size):
    w=h=size
    base=G.vgrad((w,h),[(0,(4,8,26)),(0.55,(8,20,46)),(1,(18,40,66))])
    base=G.add(base, G.bokeh((w,h),(180,220,255),40,seed=61,ymax=0.6))
    base=G.add(base, G.wave_band((w,h),int(h*0.30),46,90,(80,255,180,95),seed=2))
    base=G.add(base, G.wave_band((w,h),int(h*0.40),60,70,(120,200,255,85),seed=8))
    base=G.add(base, G.skyline((w,h),int(h*0.99),(6,12,26),(120,230,200),0.5,int(h*0.42),seed=23))
    return G.vignette(base,0.5).convert("RGBA")

def icon_emblem():
    """City emblem: aurora + skyline + big title + feature dots."""
    S=512; base=_square_aurora(S); cx=S//2
    # title (two lines, big) with gradient + outline
    f1=font("Amiri-Bold.ttf",120); f2=font("Amiri-Bold.ttf",120)
    def big(text,y):
        outl=Image.new("RGBA",(S,S),(0,0,0,0)); od=ImageDraw.Draw(outl)
        for dx in range(-4,5,2):
            for dy in range(-4,5,2):
                od.text((cx+dx,y+dy),ar(text),font=f1,fill=(4,6,18,255),anchor="mm")
        base.alpha_composite(outl)
        gl=Image.new("RGBA",(S,S),(0,0,0,0)); ImageDraw.Draw(gl).text((cx,y),ar(text),font=f1,fill=(70,150,255,255),anchor="mm")
        for _ in range(3): base.alpha_composite(gl.filter(ImageFilter.GaussianBlur(16)))
        m=Image.new("L",(S,S),0); ImageDraw.Draw(m).text((cx,y),ar(text),font=f1,fill=255,anchor="mm")
        base.paste(G.vgrad((S,S),[(0,(180,235,255)),(1,(150,110,255))]),(0,0),m)
    big("مدينة",int(S*0.34))
    big("التبرعات",int(S*0.55))
    # small feature icons row
    d=ImageDraw.Draw(base)
    xs=[S*0.22,S*0.40,S*0.60,S*0.78]; yy=int(S*0.84)
    ic_cinema(d,int(xs[0]),yy,26,(255,255,255),(120,90,255))
    ic_popcorn(d,int(xs[1]),yy,24,(255,235,180),(230,70,90))
    ic_fountain(d,int(xs[2]),yy,24,(150,225,255),(255,255,255))
    ic_coins(d,int(xs[3]),yy,22,(255,215,120),(150,100,20))
    return base.convert("RGB")

def icon_cinemark():
    """Bold mark: glowing play + popcorn over aurora, title small below."""
    S=512; base=_square_aurora(S); cx=S//2; d=ImageDraw.Draw(base)
    # central glowing disc
    glow=G.radial_glow((S,S),(cx,int(S*0.42)),230,(80,160,255),0.6)
    base=G.screen_blend(base.convert("RGB"),glow).convert("RGBA"); d=ImageDraw.Draw(base)
    d.ellipse([cx-150,int(S*0.42)-150,cx+150,int(S*0.42)+150], outline=(150,220,255), width=8)
    ic_cinema(d,cx,int(S*0.40),110,(255,255,255),(120,90,255))
    ic_popcorn(d,int(S*0.74),int(S*0.30),70,(255,235,180),(230,70,90))
    G.glow_text(base,(cx,int(S*0.80)),ar("مدينة التبرعات"),font("Amiri-Bold.ttf",78),
                (180,235,255),(70,150,255),gr=14,gs=3)
    return base.convert("RGB")

def icon_gold():
    """Premium gold square emblem."""
    S=512
    base=G.vgrad((S,S),[(0,(10,16,38)),(0.6,(30,48,92)),(1,(238,194,116))]).convert("RGB")
    base=G.screen_blend(base, G.radial_glow((S,S),(S//2,int(S*0.5)),300,(255,210,130),0.45)).convert("RGBA")
    base=G.add(base, G.skyline((S,S),int(S*0.99),(16,20,40),(255,210,130),0.55,int(S*0.4),seed=33)).convert("RGBA") if hasattr(G,'skyline') else base
    cx=S//2
    f=font("Amiri-Bold.ttf",118)
    def big(text,y,col):
        outl=Image.new("RGBA",(S,S),(0,0,0,0)); od=ImageDraw.Draw(outl)
        for dx in range(-4,5,2):
            for dy in range(-4,5,2):
                od.text((cx+dx,y+dy),ar(text),font=f,fill=(40,24,6,255),anchor="mm")
        base.alpha_composite(outl)
        m=Image.new("L",(S,S),0); ImageDraw.Draw(m).text((cx,y),ar(text),font=f,fill=255,anchor="mm")
        base.paste(G.vgrad((S,S),[(0,(255,244,210)),(1,col)]),(0,0),m)
    big("مدينة",int(S*0.36),(255,190,90))
    big("التبرعات",int(S*0.57),(255,175,70))
    d=ImageDraw.Draw(base); ic_star(d,int(S*0.5),int(S*0.84),34,(255,225,130),(180,120,20))
    return base.convert("RGB")

# ---------------- storyboards ----------------
def board(items, path, title, sub, cols, cw, ch):
    pad,gap,top=40,28,150
    rows=(len(items)+cols-1)//cols
    SW=pad*2+cols*cw+(cols-1)*gap
    SH=top+pad+rows*(ch+58)+(rows-1)*gap
    bd=G.vgrad((SW,SH),[(0,(14,16,30)),(1,(26,22,46))]); d=ImageDraw.Draw(bd)
    G.glow_text(bd,(SW//2,64),ar(title),font("Amiri-Bold.ttf",54),(210,235,255),(70,150,255),gr=14,gs=2)
    d.text((SW//2,112),ar(sub),fill=(180,195,225),font=font("Amiri-Bold.ttf",28),anchor="mm")
    for i,(img,label) in enumerate(items):
        r,c=divmod(i,cols); x=pad+c*(cw+gap); y=top+r*(ch+58+gap)
        bd.paste(img.resize((cw,ch)),(x,y))
        d.rectangle([x,y,x+cw,y+ch],outline=(120,160,230),width=3)
        d.rectangle([x,y+ch,x+cw,y+ch+54],fill=(18,20,36),outline=(90,120,190),width=2)
        d.text((x+cw//2,y+ch+27),ar(label),fill=(245,245,255),font=font("Amiri-Bold.ttf",32),anchor="mm")
    bd.save(path,quality=95); return bd

if __name__=="__main__":
    o="/home/ubuntu/design/out"; os.makedirs(o,exist_ok=True)
    banners=[
        ("aurora", banner_aurora, "A — شفق المدينة"),
        ("gold",   banner_gold,   "B — ذهبي فخم"),
        ("cinema", banner_cinema, "C — ليلة سينما"),
        ("neon",   banner_neon,   "D — نيون حيّ"),
        ("gala",   banner_gala,   "E — حفل احتفالي"),
    ]
    bimgs=[]
    for name,fn,label in banners:
        img=fn(); img.save(f"{o}/thumb_{name}.jpg",quality=95); bimgs.append((img,label))
    board(bimgs, f"{o}/storyboard_banner.jpg",
          "مدينة التبرعات — لوحة تصاميم الثَمبنيل (بانر 16:9)",
          "اختر المفهوم الأنسب (A–E)", 3, 540, 304)

    icons=[
        ("emblem",  icon_emblem,  "1 — شعار المدينة"),
        ("cinemark",icon_cinemark,"2 — علامة السينما"),
        ("gold",    icon_gold,    "3 — ذهبي فخم"),
    ]
    iimgs=[]
    for name,fn,label in icons:
        img=fn(); img.save(f"{o}/icon_{name}.jpg",quality=95); iimgs.append((img,label))
    board(iimgs, f"{o}/storyboard_icon.jpg",
          "مدينة التبرعات — لوحة تصاميم الأيقونة (مربّع 1:1)",
          "اختر الأنسب (1–3)", 3, 360, 360)
    print("done")
