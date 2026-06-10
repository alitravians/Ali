import sys, math, os
sys.path.insert(0, '/home/ubuntu/models')
import bpy
from mcommon import *

OUT = '/home/ubuntu/models/fbx'
os.makedirs(OUT, exist_ok=True)

clear()
wall = mat('Wall', (0.35, 0.33, 0.40), rough=0.8)
red = mat('RedWall', (0.78, 0.15, 0.22), rough=0.6)
white = mat('White', (0.95, 0.95, 0.95), rough=0.4)
goldm = mat('Gold', (1.0, 0.78, 0.2), metallic=0.9, rough=0.3)
neon = mat('Neon', (1.0, 0.95, 0.7), emit=2.0)
neon_red = mat('NeonRed', (1.0, 0.25, 0.3), emit=1.5)
glass = mat('Glass', (0.6, 0.8, 0.9), rough=0.05, alpha=0.4)
poster = mat('PosterA', (0.95, 0.65, 0.25), rough=0.6)
poster2 = mat('PosterB', (0.35, 0.55, 0.9), rough=0.6)
carpet_m = mat('Carpet', (0.75, 0.10, 0.18), rough=0.9)

# main building facade
box('Main_Building', (0, -6, 5), (12, 5, 5), wall)
box('Entrance_Block', (0, 0.5, 3.2), (6, 1.5, 3.2), red)
# marquee band
box('Marquee_Band', (0, 1.6, 6.9), (5.4, 1.1, 1.0), white)
box('Marquee_Trim_Top', (0, 1.6, 8.0), (5.6, 1.2, 0.12), goldm)
box('Marquee_Trim_Bottom', (0, 1.6, 5.8), (5.6, 1.2, 0.12), goldm)
for i in range(6):
    box(f'Letter{i}', (-3.4 + i*1.35, 2.78, 6.9), (0.5, 0.1, 0.62), neon)
for i in range(9):
    sphere(f'Bulb{i}', (-4.8 + i*1.2, 2.85, 5.55), 0.12, neon, subdiv=2)
# vertical neon side sign
box('VSign', (-8.5, -0.8, 7.0), (0.9, 0.25, 3.2), neon_red)
# gold columns
for sx, nm in ((-5.2, 'L'), (5.2, 'R')):
    cyl(f'Column_{nm}', (sx, 1.6, 3.0), 0.45, 6.0, goldm, verts=20)
    cyl(f'Column_{nm}_Base', (sx, 1.6, 0.25), 0.6, 0.5, goldm, verts=20)
    cyl(f'Column_{nm}_Cap', (sx, 1.6, 5.85), 0.6, 0.3, goldm, verts=20)
# glass doors
for i, dx in enumerate((-1.8, 0, 1.8)):
    box(f'Door{i}', (dx, 2.05, 1.5), (0.8, 0.06, 1.5), glass)
    box(f'DoorFrame{i}', (dx, 2.02, 1.5), (0.88, 0.05, 1.58), goldm)
# posters
box('Poster_A', (-9.5, -0.95, 3.4), (1.4, 0.1, 2.0), poster)
box('Poster_A_Frame', (-9.5, -1.0, 3.4), (1.6, 0.08, 2.2), goldm)
box('Poster_B', (9.5, -0.95, 3.4), (1.4, 0.1, 2.0), poster2)
box('Poster_B_Frame', (9.5, -1.0, 3.4), (1.6, 0.08, 2.2), goldm)
# ticket window
box('TicketWindow', (7.0, 1.95, 2.0), (1.5, 0.15, 1.2), white)
box('TicketWindow_Glass', (7.0, 2.1, 2.2), (1.1, 0.05, 0.7), glass)
# red carpet + rope posts
box('Carpet', (0, 6.5, 0.05), (2.2, 4.5, 0.04), carpet_m)
for sy in range(4):
    for sx, nm in ((-2.8, 'L'), (2.8, 'R')):
        cyl(f'Post_{nm}{sy}', (sx, 3.5 + sy*2.4, 0.7), 0.12, 1.4, goldm, verts=14)
        sphere(f'PostBall_{nm}{sy}', (sx, 3.5 + sy*2.4, 1.45), 0.18, goldm, subdiv=2)
# searchlight beams (animated by Lua in-game)
beam = mat('Beam', (1, 1, 0.85), emit=1.2, alpha=0.18)
for sx, nm in ((-7, 'L'), (7, 'R')):
    cone(f'Searchlight_Beam_{nm}', (sx, 4, 8.5), 0.12, 1.6, 7.0, beam, rot=(0.5, -0.4 if sx > 0 else 0.4, 0), verts=16)
    cyl(f'Searchlight_Base_{nm}', (sx, 4, 0.5), 0.5, 1.0, wall, verts=14)

export_fbx(f'{OUT}/cinema_facade.fbx')
print('CINEMA EXPORTED')
