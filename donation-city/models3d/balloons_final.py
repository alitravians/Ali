import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

def string_segs(prefix, start, n, m):
    x, z = start
    for i in range(n):
        cyl(f'{prefix}{i}', (x, 0, z - 0.3), 0.02, 0.34, m, rot=(0, 0.18*math.sin(i*1.2), 0), verts=6)
        x += 0.05*math.sin(i*1.2)
        z -= 0.32

def balloon_round():
    clear()
    bal = mat('Balloon', (0.9, 0.3, 0.3), rough=0.25)
    strm = mat('String', (0.85, 0.85, 0.9), rough=0.6)
    sphere('Body', (0, 0, 3.0), 0.7, bal, scale=(1, 1, 1.18), subdiv=3)
    cone('Knot', (0, 0, 2.12), 0.12, 0.04, 0.16, bal, rot=(math.pi, 0, 0), verts=10)
    string_segs('String', (0, 2.0), 6, strm)
    export_fbx(f'{OUT}/balloon_round.fbx')

def balloon_heart():
    clear()
    bal = mat('BalloonHeart', (0.95, 0.35, 0.45), rough=0.25)
    strm = mat('String', (0.85, 0.85, 0.9), rough=0.6)
    sphere('LobeL', (-0.30, 0, 3.15), 0.42, bal, subdiv=3)
    sphere('LobeR', (0.30, 0, 3.15), 0.42, bal, subdiv=3)
    cone('Point', (0, 0, 2.55), 0.62, 0.0, 0.85, bal, rot=(math.pi, 0, 0), verts=16)
    cone('Knot', (0, 0, 2.05), 0.10, 0.04, 0.14, bal, rot=(math.pi, 0, 0), verts=10)
    string_segs('String', (0, 1.95), 6, strm)
    export_fbx(f'{OUT}/balloon_heart.fbx')

def balloon_star():
    clear()
    bal = mat('BalloonStar', (0.95, 0.85, 0.30), rough=0.25)
    strm = mat('String', (0.85, 0.85, 0.9), rough=0.6)
    sphere('Center', (0, 0, 3.0), 0.42, bal, subdiv=3)
    for i in range(5):
        a = math.pi/2 + 2*math.pi*i/5
        px, pz = math.cos(a)*0.55, 3.0 + math.sin(a)*0.55
        cone(f'Point{i}', (px, 0, pz), 0.26, 0.0, 0.55, bal, rot=(0, a - math.pi/2, 0), verts=10)
    cone('Knot', (0, 0, 2.45), 0.10, 0.04, 0.14, bal, rot=(math.pi, 0, 0), verts=10)
    string_segs('String', (0, 2.35), 6, strm)
    export_fbx(f'{OUT}/balloon_star.fbx')

balloon_round(); balloon_heart(); balloon_star()
print('ALL BALLOONS EXPORTED')
