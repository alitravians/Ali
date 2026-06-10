import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

trunk_m = lambda: mat('Trunk', (0.42, 0.28, 0.15), rough=0.9)
leaf1 = lambda: mat('LeafGreen', (0.35, 0.70, 0.35), rough=0.8)
leaf2 = lambda: mat('LeafPine', (0.55, 0.80, 0.50), rough=0.8)
leafp = lambda: mat('LeafPalm', (0.40, 0.75, 0.45), rough=0.8)
pink = lambda: mat('LeafPink', (0.95, 0.70, 0.80), rough=0.8)

def tree_classic():
    clear()
    cone('Trunk', (0, 0, 1.2), 0.40, 0.22, 2.4, trunk_m(), verts=10)
    for i, (dx, dy, dz, r) in enumerate([(0,0,3.2,1.35),(0.85,0.55,2.85,0.85),(-0.95,0.15,3.0,0.8),(0.25,-0.85,3.3,0.75),(0,0,4.05,0.7)]):
        sphere(f'Leaf{i}', (dx, dy, dz), r, leaf1(), subdiv=1)
    export_fbx(f'{OUT}/tree_classic.fbx')

def tree_pine():
    clear()
    cone('Trunk', (0, 0, 1.0), 0.32, 0.20, 2.0, trunk_m(), verts=10)
    for i in range(4):
        cone(f'Layer{i}', (0, 0, 2.3 + i*1.0), 1.6 - i*0.33, 0.0, 1.5, leaf2(), verts=12)
    export_fbx(f'{OUT}/tree_pine.fbx')

def tree_palm():
    clear()
    # curved trunk segments
    x, z, ang = 0.0, 0.3, 0.0
    for i in range(7):
        cyl(f'Trunk{i}', (x, 0, z), 0.26 - i*0.015, 0.75, trunk_m(), rot=(0, ang, 0), verts=10)
        ang += 0.09
        x += math.sin(ang) * 0.68
        z += math.cos(ang) * 0.68
    top = (x, 0, z + 0.2)
    for i in range(8):
        a = 2*math.pi*i/8
        fx, fy = math.cos(a), math.sin(a)
        box(f'Frond{i}', (top[0]+fx*1.05, fy*1.05, top[2]+0.15), (1.1, 0.3, 0.045), leafp(), rot=(0, 0.42*(-1 if i%2 else 1)*0.0+0.38, a))
    sphere('Coconut1', (top[0]+0.18, 0.12, top[2]-0.12), 0.16, trunk_m(), subdiv=2)
    sphere('Coconut2', (top[0]-0.15, -0.14, top[2]-0.12), 0.16, trunk_m(), subdiv=2)
    export_fbx(f'{OUT}/tree_palm.fbx')

def tree_blossom():
    clear()
    cone('Trunk', (0, 0, 1.1), 0.34, 0.20, 2.2, trunk_m(), verts=10)
    for i, (dx, dy, dz, r) in enumerate([(0,0,2.9,1.2),(0.75,0.5,2.6,0.8),(-0.85,0.15,2.75,0.75),(0.25,-0.75,3.0,0.7),(0,0,3.7,0.65)]):
        sphere(f'Blossom{i}', (dx, dy, dz), r, pink(), subdiv=1)
    export_fbx(f'{OUT}/tree_blossom.fbx')

tree_classic(); tree_pine(); tree_palm(); tree_blossom()
print('ALL TREES EXPORTED')
