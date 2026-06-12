import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

# (name, accent color, metallic, emit)
TIERS = [
    ('Bronze',  (0.72, 0.45, 0.20), 0.6, 0.0),
    ('Silver',  (0.80, 0.82, 0.86), 0.8, 0.0),
    ('Gold',    (1.00, 0.78, 0.20), 0.9, 0.2),
    ('Emerald', (0.10, 0.85, 0.45), 0.3, 0.4),
    ('Ruby',    (0.90, 0.15, 0.30), 0.3, 0.4),
    ('Diamond', (0.65, 0.90, 1.00), 0.2, 1.0),
]

def build_booth(tier_idx, tname, color, metallic, emit):
    clear()
    accent = mat(f'{tname}Accent', color, metallic=metallic, rough=0.35, emit=emit*0.25)
    glassy = mat(f'{tname}Glass', color, metallic=0.1, rough=0.05, alpha=0.35)
    wood = mat('Wood', (0.45, 0.30, 0.16), rough=0.8)
    wood_dark = mat('WoodDark', (0.28, 0.18, 0.10), rough=0.85)
    stone = mat('Stone', (0.75, 0.74, 0.72), rough=0.9)

    # stone platform base (beveled look: two stacked cylinders)
    cyl('Base_Lower', (0, 0, 0.15), 3.4, 0.3, stone, verts=28)
    cyl('Base_Upper', (0, 0, 0.42), 3.15, 0.25, stone, verts=28)
    # counter
    box('Counter_Body', (0, 1.5, 1.05), (1.9, 0.45, 0.5), wood)
    box('Counter_Top', (0, 1.5, 1.62), (2.1, 0.55, 0.07), accent)
    box('Counter_Skirt', (0, 1.93, 0.78), (1.9, 0.05, 0.25), wood_dark)
    # back wall
    box('Back_Wall', (0, -1.6, 1.8), (1.8, 0.12, 1.5), wood_dark)
    box('Back_Shelf', (0, -1.45, 1.7), (1.5, 0.18, 0.05), wood)
    box('Back_Shelf2', (0, -1.45, 2.45), (1.5, 0.18, 0.05), wood)
    # side pillars
    for sx in (-1.85, 1.85):
        cyl(f'Pillar_{"L" if sx<0 else "R"}', (sx, 0.2, 1.8), 0.14, 3.4, accent, verts=16)
    # glass dome canopy
    sphere('Canopy', (0, 0, 3.5), 2.5, glassy, scale=(1.0, 0.78, 0.45), subdiv=3)
    # sign board above
    box('Sign_Board', (0, 0.2, 4.35), (1.6, 0.1, 0.5), accent)
    box('Sign_Frame', (0, 0.2, 4.35), (1.7, 0.08, 0.6), wood_dark)
    # donation box on counter
    box('DonationBox', (0.6, 1.45, 1.95), (0.3, 0.3, 0.28), accent)
    box('DonationBox_Slot', (0.6, 1.45, 2.26), (0.16, 0.04, 0.03), wood_dark)
    # tier decorations
    if tier_idx >= 2:
        for sx in (-1.85, 1.85):
            cone(f'Flag_{"L" if sx<0 else "R"}', (sx, 0.2, 3.75), 0.18, 0.0, 0.5, accent, verts=12)
    if tier_idx >= 4:
        sphere('Orb', (0, 0.2, 4.85), 0.22, accent, subdiv=2)
    if tier_idx == 5:
        cone('Crystal_Top', (0, 0.2, 5.5), 0.32, 0.0, 0.6, glassy, verts=6)
        cone('Crystal_Bottom', (0, 0.2, 4.95), 0.32, 0.0, 0.55, glassy, rot=(math.pi, 0, 0), verts=6)

    export_fbx(f'{OUT}/booth_{tname.lower()}.fbx')

for i, (tname, color, metallic, emit) in enumerate(TIERS):
    build_booth(i, tname, color, metallic, emit)
print('ALL BOOTHS EXPORTED')
