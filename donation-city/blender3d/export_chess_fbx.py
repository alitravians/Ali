import bpy, bmesh, math, os
from mathutils import Vector

# Export the 6 Staunton chess piece meshes to a single FBX for Roblox Open Cloud.
# Each piece is one named mesh (Pawn, Knight, Bishop, Rook, Queen, King) so the
# in-game loader can clone + recolor (white/black) per square. Built in white;
# black is just a runtime recolor of the same geometry.

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.01

def mat(name, rgb, rough=0.4):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

WHITE = mat("white", (0.90, 0.82, 0.62))

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
    return o

def box(name, loc, size, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2); o.rotation_euler = rot
    o.data.materials.append(m); return o

def sph(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc)
    o = bpy.context.object; o.name = name; o.data.materials.append(m)
    return o

def join(objs, name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    objs[0].data.materials.clear(); objs[0].data.materials.append(WHITE)
    return objs[0]

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
    return join(parts, "Rook")

def bishop(loc, m, tag):
    p = [(0.54, 0), (0.54, 0.10), (0.42, 0.20), (0.28, 0.34), (0.22, 0.62),
         (0.30, 0.74), (0.34, 0.80), (0.28, 0.88), (0.16, 0.96),
         (0.20, 1.06), (0.30, 1.24), (0.24, 1.34),
         (0.26, 1.42), (0.32, 1.62), (0.30, 1.86), (0.20, 2.06), (0.10, 2.22), (0.0, 2.30)]
    body = lathe("BishopBody_" + tag, p, m, loc)
    slit = box("BishopSlit_" + tag, (loc[0], loc[1], loc[2] + 2.0), (0.10, 0.7, 0.5), m,
               rot=(math.radians(20), 0, 0))
    ball = sph("BishopBall_" + tag, (loc[0], loc[1], loc[2] + 2.40), 0.12, m)
    return join([body, slit, ball], "Bishop")

def knight(loc, m, tag):
    p = [(0.58, 0), (0.58, 0.10), (0.46, 0.20), (0.32, 0.34), (0.28, 0.70),
         (0.34, 0.80), (0.40, 0.90), (0.40, 1.02), (0.30, 1.08), (0.0, 1.08)]
    body = lathe("KnightBody_" + tag, p, m, loc)
    parts = [body]
    neck = box("KnightNeck_" + tag, (loc[0], loc[1] - 0.05, loc[2] + 1.42),
               (0.42, 0.5, 0.95), m, rot=(math.radians(-18), 0, 0))
    head = box("KnightHead_" + tag, (loc[0], loc[1] - 0.34, loc[2] + 1.78),
               (0.40, 0.78, 0.46), m, rot=(math.radians(20), 0, 0))
    muzzle = box("KnightMuz_" + tag, (loc[0], loc[1] - 0.58, loc[2] + 1.66),
                 (0.34, 0.42, 0.34), m, rot=(math.radians(45), 0, 0))
    earL = box("KnightEarL_" + tag, (loc[0] - 0.13, loc[1] + 0.04, loc[2] + 2.12),
               (0.10, 0.12, 0.26), m, rot=(math.radians(-10), 0, 0))
    earR = box("KnightEarR_" + tag, (loc[0] + 0.13, loc[1] + 0.04, loc[2] + 2.12),
               (0.10, 0.12, 0.26), m, rot=(math.radians(-10), 0, 0))
    mane = box("KnightMane_" + tag, (loc[0], loc[1] + 0.16, loc[2] + 1.78),
               (0.20, 0.28, 0.9), m, rot=(math.radians(8), 0, 0))
    parts += [neck, head, muzzle, earL, earR, mane]
    return join(parts, "Knight")

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
    return join(parts, "Queen")

def king(loc, m, tag):
    p = [(0.62, 0), (0.62, 0.10), (0.50, 0.20), (0.34, 0.36), (0.26, 0.78),
         (0.34, 0.92), (0.38, 1.00), (0.32, 1.10), (0.20, 1.22),
         (0.24, 1.38), (0.36, 1.66), (0.30, 1.80),
         (0.32, 1.92), (0.44, 2.24), (0.48, 2.44), (0.42, 2.58), (0.48, 2.70), (0.40, 2.78)]
    body = lathe("KingBody_" + tag, p, m, loc)
    cv = box("KingCrossV_" + tag, (loc[0], loc[1], loc[2] + 3.06), (0.14, 0.14, 0.62), m)
    ch = box("KingCrossH_" + tag, (loc[0], loc[1], loc[2] + 3.06), (0.42, 0.14, 0.16), m)
    return join([body, cv, ch], "King")

# Build one of each piece, spaced along X so they never overlap.
pieces = []
_pawn = pawn((0, 0, 0), WHITE, "x"); _pawn.name = "Pawn"
pieces.append(_pawn)
pieces.append(rook((3, 0, 0), WHITE, "x"))
pieces.append(knight((6, 0, 0), WHITE, "x"))
pieces.append(bishop((9, 0, 0), WHITE, "x"))
pieces.append(queen((12, 0, 0), WHITE, "x"))
pieces.append(king((15, 0, 0), WHITE, "x"))

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

for o in pieces:
    print("PIECE", o.name)

OUT = "/home/ubuntu/tools/blender3d/chess_set.fbx"
bpy.ops.export_scene.fbx(filepath=OUT, use_selection=False, apply_unit_scale=True,
    global_scale=1.0, apply_scale_options='FBX_SCALE_UNITS', object_types={'MESH'},
    use_mesh_modifiers=True, mesh_smooth_type='FACE', path_mode='COPY',
    axis_forward='-Z', axis_up='Y', bake_space_transform=True, add_leaf_bones=False, bake_anim=False)
print("FBX EXPORTED", os.path.getsize(OUT))
