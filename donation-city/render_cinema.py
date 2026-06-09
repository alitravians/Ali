#!/usr/bin/env python3
"""Quick perspective renderer of the Cinema model from the rbxlx, so we can
visually verify the front layout (marquee, facade, NPC anchors) without Studio.
Reads part CFrame+size+color, draws cuboids with painter's algorithm."""
import sys, math
from lxml import etree
from PIL import Image, ImageDraw

GAME = "DonationCity_FINAL.rbxlx"
P = etree.XMLParser(strip_cdata=False, huge_tree=True)
r = etree.parse(GAME, P).getroot()
ws = next(it for it in r.iter("Item") if it.get("class") == "Workspace")
cinema = next(c for c in ws.findall("Item")
              if c.get("class") == "Model"
              and (c.findtext("Properties/string[@name='Name']") or "") == "Cinema")

def f(e, tag):
    v = e.findtext(tag)
    return float(v) if v is not None else 0.0

parts = []
for it in cinema.iter("Item"):
    if it.get("class") not in ("Part","MeshPart","UnionOperation","WedgePart","Seat"):
        continue
    cf = it.find("Properties/CoordinateFrame[@name='CFrame']")
    sz = it.find("Properties/Vector3[@name='size']")
    if cf is None or sz is None:
        continue
    pos = (f(cf,"X"), f(cf,"Y"), f(cf,"Z"))
    R = [f(cf,"R00"),f(cf,"R01"),f(cf,"R02"),
         f(cf,"R10"),f(cf,"R11"),f(cf,"R12"),
         f(cf,"R20"),f(cf,"R21"),f(cf,"R22")]
    size = (f(sz,"X"), f(sz,"Y"), f(sz,"Z"))
    cu = it.findtext("Properties/Color3uint8[@name='Color3uint8']")
    if cu:
        v=int(cu); col=((v>>16)&255,(v>>8)&255,v&255)
    else:
        col=(160,160,160)
    tr = float(it.findtext("Properties/float[@name='Transparency']") or 0)
    mat = it.findtext("Properties/token[@name='Material']") or ""
    nm = it.findtext("Properties/string[@name='Name']") or ""
    parts.append((pos,R,size,col,tr,mat,nm))

# Camera: stand in plaza, look toward -Z (entrance)
CAM = (0.0, 11.0, -70.0)
YAW = math.radians(0)
PITCH = math.radians(0)
FOV = math.radians(70)
W,H = 1100, 760
fpx = (W/2)/math.tan(FOV/2)

cy,sy = math.cos(-YAW), math.sin(-YAW)
cp,sp = math.cos(-PITCH), math.sin(-PITCH)
def view(p):
    x,y,z = p[0]-CAM[0], p[1]-CAM[1], p[2]-CAM[2]
    # yaw about Y
    x,z = cy*x - sy*z, sy*x + cy*z
    # pitch about X
    y,z = cp*y - sp*z, sp*y + cp*z
    return (x,y,z)
def proj(p):
    x,y,z = view(p)
    zc = -z  # camera looks -Z; depth positive in front
    if zc <= 0.05: return None,1e9
    sx = W/2 + fpx*x/zc
    sy_ = H/2 - fpx*y/zc
    return (sx,sy_), zc

def corners(pos,R,size):
    hx,hy,hz = size[0]/2,size[1]/2,size[2]/2
    out=[]
    for dx in(-hx,hx):
        for dy in(-hy,hy):
            for dz in(-hz,hz):
                wx=pos[0]+R[0]*dx+R[1]*dy+R[2]*dz
                wy=pos[1]+R[3]*dx+R[4]*dy+R[5]*dz
                wz=pos[2]+R[6]*dx+R[7]*dy+R[8]*dz
                out.append((wx,wy,wz))
    return out

FACES=[(0,1,3,2),(4,5,7,6),(0,1,5,4),(2,3,7,6),(0,2,6,4),(1,3,7,5)]
img=Image.new("RGB",(W,H),(135,170,120))  # grass-ish bg
dr=ImageDraw.Draw(img,"RGBA")
# ground
dr.rectangle([0,H//2,W,H],fill=(120,160,105))

draw=[]
for pos,R,size,col,tr,mat,nm in parts:
    if pos[2] < -125: continue  # focus on front half
    cs=corners(pos,R,size)
    pj=[proj(c) for c in cs]
    if any(d>=1e9 for _,d in pj): continue
    depth=sum(d for _,d in pj)/len(pj)
    a=int(255*(1-min(tr,0.95)))
    glow = mat=="288"
    draw.append((depth,pj,col,a,glow,nm,size))

draw.sort(key=lambda t:-t[0])  # far first
for depth,pj,col,a,glow,nm,size in draw:
    pts=[p for p,_ in pj]
    for fa in FACES:
        poly=[pts[i] for i in fa]
        shade=1.0 if glow else max(0.45, min(1.0, 1.2-depth/120))
        c=(int(col[0]*shade),int(col[1]*shade),int(col[2]*shade),a)
        dr.polygon(poly,fill=c,outline=(0,0,0,40))

img.save("cinema_render.png")
print("saved cinema_render.png ; parts drawn:",len(draw))

# ---- Overlay: simulate the runtime SurfaceGui text on Marquee + InfoBoard ----
def find_part(name):
    for pos,R,size,col,tr,mat,nm in parts:
        if nm==name: return pos,R,size
    return None
def draw_text_center(box, lines, fill, bg=None):
    pos,R,size=box
    pj,_=proj(pos)
    if pj is None: return
    try:
        from PIL import ImageFont
        font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 26)
    except Exception:
        font=None
    cx,cy=pj
    if bg:
        w=200; h=30*len(lines)+10
        dr.rectangle([cx-w/2,cy-h/2,cx+w/2,cy+h/2],fill=bg)
    y=cy-12*len(lines)
    for ln in lines:
        if font:
            tb=dr.textbbox((0,0),ln,font=font); tw=tb[2]-tb[0]
            dr.text((cx-tw/2,y),ln,fill=fill,font=font)
        else:
            dr.text((cx-40,y),ln,fill=fill)
        y+=28
m=find_part("Marquee")
if m: draw_text_center(m, ["SINEMA MADINAT", "AL-TABARRU'AT"], (255,255,255), (25,5,5))
ib=find_part("InfoBoard")
if ib: draw_text_center(ib, ["INFO /", "RULES"], (255,225,140), (16,13,26))
img.save("cinema_render.png")
print("overlay saved")
