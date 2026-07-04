import bpy, bmesh, math, os
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.01

def mat(name, rgb, rough=0.45, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    m.diffuse_color = (*rgb, 1)  # Workbench viewport/render color
    m.roughness = rough
    m.metallic = metal
    return m

WHITE = mat("white", (0.90, 0.82, 0.62), 0.35)   # boxwood cream
BLACK = mat("black", (0.17, 0.15, 0.16), 0.40)    # ebony
LIGHT_SQ = mat("lsq", (0.86, 0.74, 0.52), 0.4)
DARK_SQ = mat("dsq", (0.42, 0.26, 0.14), 0.45)
FRAME = mat("frame", (0.30, 0.18, 0.09), 0.4)

ALL = []

def lathe(name, profile, m, loc=(0, 0, 0), seg=56):
    bm = bmesh.new()
    rings = []
    for (r, z) in profile:
        if r <= 1e-6:
            v = bm.verts.new((0, 0, z)); rings.append((0.0, [v] * seg))
        else:
            ring = [bm.verts.new((r * math.cos(2 * math.pi * i / seg),
                                  r * math.sin(2 * math.pi * i / seg), z)) for i in range(seg)]
            rings.append((r, ring))
    for k in range(len(rings) - 1):
        _, ra = rings[k]; _, rb = rings[k + 1]
        for i in range(seg):
            j = (i + 1) % seg
            quad = [ra[i], ra[j], rb[j], rb[i]]
            uniq = []
            for v in quad:
                if v not in uniq:
                    uniq.append(v)
            if len(uniq) >= 3:
                try: bm.faces.new(uniq)
                except Exception: pass
    r0, ring0 = rings[0]
    if r0 > 1e-6:
        try: bm.faces.new(list(reversed(ring0)))
        except Exception: pass
    rn, ringn = rings[-1]
    if rn > 1e-6:
        try: bm.faces.new(list(ringn))
        except Exception: pass
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    o.location = loc; o.data.materials.append(m)
    for p in o.data.polygons:
        p.use_smooth = True
    ALL.append(o); return o

def box(name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); o.rotation_euler = rot
    o.data.materials.append(m); ALL.append(o); return o

def cyl(name, loc, r, h, m, rot=(0, 0, 0), verts=40):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts)
    o = bpy.context.object; o.name = name; o.rotation_euler = rot
    o.data.materials.append(m); ALL.append(o); return o

def sph(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc)
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    ALL.append(o); return o

def join(objs, name):
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    return objs[0]

# ---- shared Staunton base profile (collar + skirt) ----
def base_profile(rb, h):
    # rb=base radius, returns profile up to collar height h
    return [(rb, 0), (rb, 0.10), (rb * 0.82, 0.18), (rb * 0.62, 0.30),
            (rb * 0.50, h * 0.5), (rb * 0.40, h)]

def pawn(loc, m, tag):
    p = [(0.50, 0), (0.50, 0.09), (0.40, 0.16), (0.26, 0.30), (0.20, 0.55),
         (0.30, 0.66), (0.34, 0.72), (0.30, 0.78), (0.17, 0.86),
         (0.20, 0.95), (0.30, 1.06), (0.22, 1.13),
         (0.24, 1.20), (0.34, 1.42), (0.30, 1.60), (0.16, 1.74), (0.0, 1.84)]
    return lathe("Pawn_" + tag, p, m, loc)

def rook(loc, m, tag):
    p = [(0.58, 0), (0.58, 0.10), (0.46, 0.20), (0.34, 0.34), (0.30, 0.95),
         (0.34, 1.05), (0.40, 1.12), (0.40, 1.30), (0.46, 1.36), (0.46, 1.58),
         (0.30, 1.58), (0.30, 1.40), (0.0, 1.40)]
    body = lathe("RookBody_" + tag, p, m, loc)
    parts = [body]
    for k in range(6):
        a = math.radians(k * 60)
        parts.append(box("RookCren_%s%d" % (tag, k),
                         (loc[0] + math.cos(a) * 0.40, loc[1] + math.sin(a) * 0.40, loc[2] + 1.62),
                         (0.18, 0.18, 0.22), m, rot=(0, 0, a)))
    return join(parts, "Rook_" + tag)

def bishop(loc, m, tag):
    p = [(0.54, 0), (0.54, 0.10), (0.42, 0.20), (0.28, 0.34), (0.22, 0.62),
         (0.30, 0.74), (0.34, 0.80), (0.28, 0.88), (0.16, 0.96),
         (0.20, 1.06), (0.30, 1.24), (0.24, 1.34),
         (0.26, 1.42), (0.32, 1.62), (0.30, 1.86), (0.20, 2.06), (0.10, 2.22), (0.0, 2.30)]
    body = lathe("BishopBody_" + tag, p, m, loc)
    slit = box("BishopSlit_" + tag, (loc[0], loc[1], loc[2] + 2.0), (0.10, 0.7, 0.5), m,
               rot=(math.radians(20), 0, 0))
    ball = sph("BishopBall_" + tag, (loc[0], loc[1], loc[2] + 2.40), 0.12, m)
    return join([body, slit, ball], "Bishop_" + tag)

def knight(loc, m, tag):
    p = [(0.58, 0), (0.58, 0.10), (0.46, 0.20), (0.32, 0.34), (0.28, 0.70),
         (0.34, 0.80), (0.40, 0.90), (0.40, 1.02), (0.30, 1.08), (0.0, 1.08)]
    body = lathe("KnightBody_" + tag, p, m, loc)
    parts = [body]
    # neck (tilted block) + head + muzzle, facing -Y
    neck = box("KnightNeck_" + tag, (loc[0], loc[1] - 0.05, loc[2] + 1.42),
               (0.42, 0.5, 0.95), m, rot=(math.radians(-18), 0, 0))
    head = box("KnightHead_" + tag, (loc[0], loc[1] - 0.34, loc[2] + 1.78),
               (0.40, 0.78, 0.46), m, rot=(math.radians(20), 0, 0))
    muzzle = box("KnightMuz_" + tag, (loc[0], loc[1] - 0.58, loc[2] + 1.66),
                 (0.34, 0.42, 0.34), m, rot=(math.radians(45), 0, 0))
    # ears
    earL = box("KnightEarL_" + tag, (loc[0] - 0.13, loc[1] + 0.04, loc[2] + 2.12),
               (0.10, 0.12, 0.26), m, rot=(math.radians(-10), 0, 0))
    earR = box("KnightEarR_" + tag, (loc[0] + 0.13, loc[1] + 0.04, loc[2] + 2.12),
               (0.10, 0.12, 0.26), m, rot=(math.radians(-10), 0, 0))
    # mane
    mane = box("KnightMane_" + tag, (loc[0], loc[1] + 0.16, loc[2] + 1.78),
               (0.20, 0.28, 0.9), m, rot=(math.radians(8), 0, 0))
    parts += [neck, head, muzzle, earL, earR, mane]
    return join(parts, "Knight_" + tag)

def queen(loc, m, tag):
    p = [(0.60, 0), (0.60, 0.10), (0.48, 0.20), (0.32, 0.36), (0.24, 0.72),
         (0.32, 0.86), (0.36, 0.94), (0.30, 1.04), (0.18, 1.14),
         (0.22, 1.28), (0.34, 1.52), (0.28, 1.64),
         (0.30, 1.74), (0.42, 2.04), (0.46, 2.22), (0.40, 2.36), (0.46, 2.46), (0.30, 2.50)]
    body = lathe("QueenBody_" + tag, p, m, loc)
    parts = [body]
    for k in range(9):
        a = math.radians(k * 40)
        parts.append(sph("QueenPt_%s%d" % (tag, k),
                         (loc[0] + math.cos(a) * 0.40, loc[1] + math.sin(a) * 0.40, loc[2] + 2.56), 0.085, m))
    parts.append(sph("QueenTop_" + tag, (loc[0], loc[1], loc[2] + 2.66), 0.16, m))
    return join(parts, "Queen_" + tag)

def king(loc, m, tag):
    p = [(0.62, 0), (0.62, 0.10), (0.50, 0.20), (0.34, 0.36), (0.26, 0.78),
         (0.34, 0.92), (0.38, 1.00), (0.32, 1.10), (0.20, 1.22),
         (0.24, 1.38), (0.36, 1.66), (0.30, 1.80),
         (0.32, 1.92), (0.44, 2.24), (0.48, 2.44), (0.42, 2.58), (0.48, 2.70), (0.40, 2.78)]
    body = lathe("KingBody_" + tag, p, m, loc)
    cv = box("KingCrossV_" + tag, (loc[0], loc[1], loc[2] + 3.06), (0.14, 0.14, 0.62), m)
    ch = box("KingCrossH_" + tag, (loc[0], loc[1], loc[2] + 3.06), (0.42, 0.14, 0.16), m)
    return join([body, cv, ch], "King_" + tag)

# ================= BOARD =================
CELL = 1.6
N = 8
half = N * CELL / 2
board_z = 0.0
# frame
box("Frame", (0, 0, -0.25), (N * CELL + 1.4, N * CELL + 1.4, 0.5), FRAME)
for r in range(N):
    for c in range(N):
        x = -half + (c + 0.5) * CELL
        y = -half + (r + 0.5) * CELL
        sqm = LIGHT_SQ if (r + c) % 2 == 0 else DARK_SQ
        box("Sq_%d_%d" % (r, c), (x, y, 0.02), (CELL, CELL, 0.12), sqm)

def cell_xy(c, r):
    return (-half + (c + 0.5) * CELL, -half + (r + 0.5) * CELL)

PZ = 0.10  # pieces stand on squares
# white on rows r=0,1 ; black on r=6,7  (camera looks from white side)
back = [rook, knight, bishop, queen, king, bishop, knight, rook]
for c in range(8):
    x, y = cell_xy(c, 0); back[c]((x, y, PZ), WHITE, "w%d" % c)
    x, y = cell_xy(c, 1); pawn((x, y, PZ), WHITE, "wp%d" % c)
    x, y = cell_xy(c, 7); back[c]((x, y, PZ), BLACK, "b%d" % c)
    x, y = cell_xy(c, 6); pawn((x, y, PZ), BLACK, "bp%d" % c)

# ================= LIGHTS / WORLD / CAM =================
w = bpy.data.worlds.new("w"); scene.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.85, 0.87, 0.92, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.8
bpy.ops.object.light_add(type='SUN', location=(8, -14, 20))
sun = bpy.context.object; sun.data.energy = 2.0
sun.rotation_euler = (math.radians(52), math.radians(10), math.radians(30))
bpy.ops.object.light_add(type='AREA', location=(-6, -8, 16))
al = bpy.context.object; al.data.energy = 600; al.data.size = 18

scene.render.engine = 'BLENDER_WORKBENCH'
sh = scene.display.shading
sh.light = 'STUDIO'
sh.color_type = 'MATERIAL'
sh.show_shadows = True
sh.show_cavity = True
sh.cavity_type = 'BOTH'
sh.shadow_intensity = 0.35
try: sh.studio_light = 'studio.sl'
except Exception as e: print('sl', e)
scene.display.render_aa = '8'
scene.render.resolution_x = 1100; scene.render.resolution_y = 800
try: scene.view_settings.view_transform = 'Standard'
except Exception as e: print('vt', e)
scene.render.image_settings.file_format = 'PNG'

def cam(loc, look, lens=45):
    bpy.ops.object.camera_add(location=loc); c = bpy.context.object
    dvec = (Vector(look) - Vector(loc)); c.rotation_euler = dvec.to_track_quat('-Z', 'Y').to_euler()
    c.data.lens = lens; scene.camera = c; return c

OUT = "/home/ubuntu/tools/blender3d/renders"
os.makedirs(OUT, exist_ok=True)
cam((0, -17.5, 12.0), (0, 0.0, 0.7), 44)
scene.render.filepath = OUT + "/chess_set.png"
bpy.ops.render.render(write_still=True)
print("RENDERED chess_set")
