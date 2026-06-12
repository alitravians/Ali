import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

def mats():
    return (
        mat('Steel', (0.95, 0.65, 0.1), metallic=0.6, rough=0.4),
        mat('SteelDark', (0.85, 0.55, 0.05), metallic=0.6, rough=0.4),
        mat('Grey', (0.6, 0.6, 0.62), rough=0.7),
        mat('Warn', (0.95, 0.8, 0.1), rough=0.6),
        mat('WarnDark', (0.15, 0.15, 0.15), rough=0.6),
        mat('Wood', (0.6, 0.42, 0.25), rough=0.8),
        mat('Concrete', (0.8, 0.8, 0.78), rough=0.9),
    )

# --- tower crane ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
cyl('Crane_Base', (0, 0, 0.4), 1.6, 0.8, concrete, verts=20)
for z in range(6):
    box(f'Crane_Tower{z}', (0, 0, 1.2 + z*1.6), (0.55, 0.55, 0.8), steel)
    box(f'Crane_Brace{z}', (0, 0, 1.2 + z*1.6), (0.62, 0.08, 0.08), steel_d, rot=(0, 0.8, 0))
box('Crane_Cab', (0, 0, 10.6), (0.8, 0.8, 0.6), warn)
box('Crane_Jib', (4.5, 0, 11.3), (5.0, 0.35, 0.35), steel)
box('Crane_CounterJib', (-3.2, 0, 11.3), (2.4, 0.35, 0.35), steel)
box('Crane_Counterweight', (-4.8, 0, 10.6), (0.6, 0.5, 0.5), concrete)
cyl('Crane_Cable', (8.5, 0, 8.6), 0.04, 5.4, warn_dark, verts=8)
box('Crane_Load', (8.5, 0, 5.4), (1.2, 0.9, 0.5), concrete)
export_fbx(f'{OUT}/crane.fbx')

# --- scaffold tower ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
for fz in range(3):
    for px in range(2):
        for py in range(2):
            cyl(f'Pole{fz}{px}{py}', (px*2.4 - 1.2, py*1.6 - 0.8, 1.5 + fz*3.0), 0.08, 3.0, steel, verts=8)
    box(f'Plank{fz}', (0, 0, 3.0 + fz*3.0), (1.45, 0.9, 0.07), wood)
    box(f'RailX{fz}', (0, -0.8, 3.6 + fz*3.0), (1.3, 0.05, 0.05), steel_d)
export_fbx(f'{OUT}/scaffold.fbx')

# --- safety barrier ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
box('Barrier_Board', (0, 0, 0.7), (1.4, 0.12, 0.35), warn)
for i in range(3):
    box(f'Barrier_Stripe{i}', (-0.9 + i*0.9, 0.005, 0.7), (0.22, 0.125, 0.35), warn_dark, rot=(0, 0.5, 0))
for sx, nm in ((-1.1, 'L'), (1.1, 'R')):
    box(f'Barrier_Leg_{nm}', (sx, 0, 0.35), (0.12, 0.12, 0.35), warn_dark)
export_fbx(f'{OUT}/barrier.fbx')

# --- traffic cone ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
cone('Cone_Body', (0, 0, 0.5), 0.35, 0.05, 0.9, steel_d, verts=16)
cyl('Cone_Stripe', (0, 0, 0.55), 0.25, 0.18, mat('WhiteStripe', (0.95, 0.95, 0.95), rough=0.5), verts=16)
box('Cone_Base', (0, 0, 0.06), (0.45, 0.45, 0.06), warn_dark)
export_fbx(f'{OUT}/cone.fbx')

# --- cement mixer ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
sphere('Mixer_Drum', (0, 0, 1.3), 0.9, warn, scale=(1, 1, 1.25), subdiv=3)
cyl('Mixer_Mouth', (0, 0, 2.5), 0.35, 0.5, warn_dark, verts=14)
box('Mixer_Base', (0, 0, 0.35), (0.9, 0.6, 0.35), grey)
for sx in (-0.7, 0.7):
    cyl(f'Mixer_Wheel{int(sx*10)}', (sx, 0.55, 0.3), 0.25, 0.15, warn_dark, rot=(math.pi/2, 0, 0), verts=14)
export_fbx(f'{OUT}/mixer.fbx')

# --- dirt pile + sign ---
clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
cone('DirtPile', (0, 0, 0.7), 1.6, 0.1, 1.4, mat('Dirt', (0.5, 0.35, 0.2), rough=1.0), verts=18)
export_fbx(f'{OUT}/dirtpile.fbx')

clear()
steel, steel_d, grey, warn, warn_dark, wood, concrete = mats()
box('Sign_Post', (0, 0, 1.2), (0.08, 0.08, 1.2), wood)
box('Sign_Board', (0, 0, 2.6), (1.3, 0.08, 0.9), warn)
box('Sign_Trim', (0, 0.005, 2.6), (1.35, 0.075, 0.95), warn_dark)
export_fbx(f'{OUT}/sign.fbx')
print('ALL CONSTRUCTION EXPORTED')
