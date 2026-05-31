#!/usr/bin/env python3
# Extracts MapBlue tower geometry from tower.rbxmx -> Lua part list, repositioned
# so the tower's horizontal center sits at the old parkour center (-138, *, 42)
# and its base stays at Y=18.
import re, xml.etree.ElementTree as ET

SRC = "/home/ubuntu/tower.rbxmx"
OUT = "tower_parts.lua"

# target placement
TARGET_X, TARGET_Z = -138.0, 42.0   # horizontal center of old parkour
BASE_Y = 18.0                        # keep base at 18

t = ET.parse(SRC); r = t.getroot()
def nm(it):
    for p in it.findall('./Properties/*'):
        if p.get('name')=='Name': return p.text
    return None

# locate MapBlue
mapblue=None
for it in r.iter('Item'):
    if it.get('class')=='Model' and nm(it)=='MapBlue':
        mapblue=it; break
assert mapblue is not None, "MapBlue not found"

def cframe(it):
    c=it.find('./Properties/CoordinateFrame')
    if c is None: return None
    d={x.tag:float(x.text) for x in c}
    return d
def vsize(it):
    v=it.find("./Properties/Vector3[@name='size']")
    if v is None: return None
    return (float(v.find('X').text),float(v.find('Y').text),float(v.find('Z').text))
def gettok(it,name):
    e=it.find("./Properties/token[@name='%s']"%name)
    return int(e.text) if e is not None else None
def getfloat(it,name,default=0.0):
    e=it.find("./Properties/float[@name='%s']"%name)
    return float(e.text) if e is not None else default
def getbool(it,name,default=True):
    e=it.find("./Properties/bool[@name='%s']"%name)
    if e is None: return default
    return e.text=='true'
def getcolor(it):
    e=it.find("./Properties/Color3uint8[@name='Color3uint8']")
    if e is None: return (160,160,160)
    v=int(e.text); return ((v>>16)&255,(v>>8)&255,v&255)

MAT={256:"Plastic",272:"SmoothPlastic",288:"Neon",512:"Wood",1088:"Metal",1536:"Ice",848:"Brick"}
SHAPE={0:"Ball",1:"Block",2:"Cylinder"}

# group membership: walk children, tag by parent group name
parts=[]
def walk(it, group):
    cls=it.get('class')
    n=nm(it)
    if cls in ('Part','TrussPart','SpawnLocation','WedgePart','CornerWedgePart','MeshPart'):
        cf=cframe(it); sz=vsize(it)
        if cf and sz:
            parts.append(dict(cls=cls, name=n, group=group, cf=cf, size=sz,
                color=getcolor(it), mat=gettok(it,'Material'),
                trans=getfloat(it,'Transparency',0.0),
                cancollide=getbool(it,'CanCollide',True),
                shape=gettok(it,'shape'), style=gettok(it,'style')))
        return
    for ch in it.findall('./Item'):
        g = group
        if cls=='Model' and n in ('Steps','Walls','Trusses','KillParts'):
            g=n
        walk(ch, g)
for ch in mapblue.findall('./Item'):
    cls=ch.get('class'); n=nm(ch)
    if cls=='Model' and n in ('Steps','Walls','Trusses','KillParts'):
        walk(ch,n)
    else:
        walk(ch, n if n in ('Finish','Spawn') else 'Misc')

# compute bbox center (x,z) and min y
xs=[p['cf']['X'] for p in parts]; ys=[p['cf']['Y'] for p in parts]; zs=[p['cf']['Z'] for p in parts]
cx=(min(xs)+max(xs))/2; cz=(min(zs)+max(zs))/2; miny=min(ys)
dx=TARGET_X-cx; dz=TARGET_Z-cz; dy=BASE_Y-miny
print("parts:",len(parts)," center=(%.1f,%.1f) miny=%.1f"%(cx,cz,miny)," offset=(%.1f,%.1f,%.1f)"%(dx,dy,dz))
from collections import Counter
print("groups:",dict(Counter(p['group'] for p in parts)))

def fmt(v): return ("%.4f"%v).rstrip('0').rstrip('.') if '.' in ("%.4f"%v) else "%.4f"%v

lines=["-- AUTO-GENERATED from store asset 73677237540529 (ToH Win Tower, MapBlue).",
       "-- Repositioned: horizontal center -> (-138,42), base Y -> 18.",
       "-- Each entry: {cls,group,name, cf={x,y,z,R00..R22}, size={x,y,z}, color={r,g,b}, mat, trans, col(canCollide), shape, style}",
       "return {"]
for p in parts:
    cf=p['cf']
    cfv=[cf['X']+dx, cf['Y']+dy, cf['Z']+dz, cf['R00'],cf['R01'],cf['R02'],cf['R10'],cf['R11'],cf['R12'],cf['R20'],cf['R21'],cf['R22']]
    cfs=",".join(fmt(x) for x in cfv)
    sz=",".join(fmt(x) for x in p['size'])
    co=",".join(str(int(x)) for x in p['color'])
    mat=MAT.get(p['mat'],"SmoothPlastic")
    shape=SHAPE.get(p['shape']) if p['shape'] is not None else None
    extra=""
    if shape and p['cls']=='Part': extra+=',shape="%s"'%shape
    if p['style'] is not None: extra+=',style=%d'%p['style']
    lines.append('{cls="%s",grp="%s",nm=%s,cf={%s},sz={%s},c={%s},mat="%s",tr=%s,col=%s%s},'%(
        p['cls'], p['group'], ('"%s"'%p['name']) if p['name'] else 'nil',
        cfs, sz, co, mat, fmt(p['trans']), 'true' if p['cancollide'] else 'false', extra))
lines.append("}")
open(OUT,'w').write("\n".join(lines))
print("wrote",OUT, len(parts),"parts")
