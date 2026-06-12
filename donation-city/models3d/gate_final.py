import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

clear()
stone = mat('Stone', (0.93, 0.92, 0.88), rough=0.85)
stone_d = mat('StoneDark', (0.55, 0.55, 0.55), rough=0.85)
blue = mat('RoofBlue', (0.35, 0.6, 0.9), rough=0.5)
goldm = mat('Gold', (1.0, 0.78, 0.2), metallic=0.9, rough=0.3)
flagm = mat('Flag', (0.85, 0.3, 0.35), rough=0.7)
woodm = mat('SignWood', (0.35, 0.22, 0.12), rough=0.7)
neon = mat('SignNeon', (0.4, 0.9, 1.0), emit=1.5)

# towers
for sx, nm in ((-7, 'L'), (7, 'R')):
    box(f'Tower_{nm}', (sx, 0, 3.4), (1.5, 1.5, 3.4), stone)
    box(f'Tower_{nm}_Cap', (sx, 0, 7.0), (1.9, 1.9, 0.35), stone)
    cone(f'Tower_{nm}_Roof', (sx, 0, 8.4), 1.7, 0.0, 2.2, blue, verts=14)
    sphere(f'Tower_{nm}_Orb', (sx, 0, 9.7), 0.3, goldm, subdiv=2)
    cyl(f'Tower_{nm}_Pole', (sx, 0, 10.3), 0.05, 1.0, stone_d, verts=8)
    box(f'Tower_{nm}_Flag', (sx + 0.55, 0, 10.5), (0.5, 0.04, 0.3), flagm)
# arch
n = 15
for i in range(n):
    a = math.pi * i / (n - 1)
    x = -5.9 * math.cos(a)
    z = 6.4 + 2.4 * math.sin(a)
    box(f'Arch{i}', (x, 0, z), (0.65, 0.9, 0.45), stone, rot=(0, a - math.pi/2, 0))
# hanging sign
box('Sign_Board', (0, 0, 5.2), (4.4, 0.25, 0.9), woodm)
box('Sign_Panel', (0, -0.3, 5.2), (3.9, 0.05, 0.6), neon)
for sx, nm in ((-3.0, 'L'), (3.0, 'R')):
    cyl(f'Sign_Chain_{nm}', (sx, 0, 6.6), 0.05, 1.8, stone_d, verts=8)

export_fbx(f'{OUT}/gate.fbx')

# separate wall segment module (repeatable)
clear()
stone2 = mat('Stone2', (0.93, 0.92, 0.88), rough=0.85)
blue2 = mat('RoofBlue2', (0.35, 0.6, 0.9), rough=0.5)
box('Wall_Body', (0, 0, 1.0), (2.0, 0.4, 1.0), stone2)
box('Wall_Cap', (0, 0, 2.1), (2.1, 0.5, 0.12), stone2)
box('Wall_Pillar', (2.0, 0, 1.3), (0.35, 0.55, 1.3), stone2)
sphere('Wall_Pillar_Ball', (2.0, 0, 2.9), 0.28, blue2, subdiv=2)
export_fbx(f'{OUT}/wall_segment.fbx')
print('GATE + WALL EXPORTED')
