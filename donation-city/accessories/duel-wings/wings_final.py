"""Final UGC wing accessory: single mesh <=4000 tris, single palette texture, FBX export."""
import bpy, bmesh, math, random, os

OUT = os.path.expanduser("~/models/wings_out")
os.makedirs(OUT, exist_ok=True)

# ---------- clean scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------- palette texture ----------
CELLS = {
    "crimson": (0.60, 0.09, 0.10),
    "ivory":   (0.93, 0.89, 0.82),
    "gold":    (0.88, 0.64, 0.16),
    "charcoal":(0.07, 0.06, 0.10),
    "dpurple": (0.20, 0.08, 0.36),
    "bolt":    (0.62, 0.30, 1.00),
    "boltcore":(0.93, 0.82, 1.00),
    "shadow":  (0.30, 0.03, 0.04),
}
names = list(CELLS)
SZ = 256
img = bpy.data.images.new("WingsPalette", SZ, SZ)
px = [0.0] * (SZ * SZ * 4)
cols = 4
for idx, n in enumerate(names):
    cx, cy = idx % cols, idx // cols
    r, g, b = CELLS[n]
    for y in range(cy * 128, cy * 128 + 128):
        for x in range(cx * 64, cx * 64 + 64):
            o = (y * SZ + x) * 4
            px[o:o+4] = [r, g, b, 1.0]
img.pixels[:] = px
img.filepath_raw = os.path.join(OUT, "WingsPalette.png")
img.file_format = 'PNG'
img.save()

def uv_center(n):
    idx = names.index(n)
    cx, cy = idx % cols, idx // cols
    return ((cx * 64 + 32) / SZ, (cy * 128 + 64) / SZ)

# single material with the palette
matl = bpy.data.materials.new("Wings")
matl.use_nodes = True
bsdf = matl.node_tree.nodes['Principled BSDF']
tex = matl.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = img
matl.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.6

ALL = []

def finish(o, cell):
    o.data.materials.append(matl)
    if not o.data.uv_layers:
        o.data.uv_layers.new()
    u, v = uv_center(cell)
    uvl = o.data.uv_layers.active.data
    for l in uvl:
        l.uv = (u, v)
    ALL.append(o)
    return o

def cube(name, loc, scale, rot, cell):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = scale
    return o, cell

def cylinder(name, loc, radius, depth, rot, cell, verts=6):
    bpy.ops.mesh.primitive_cylinder_add(location=loc, rotation=rot, radius=radius, depth=depth, vertices=verts)
    o = bpy.context.object; o.name = name
    finish(o, cell)
    return o

# ---------- wing geometry (same proportions as approved mockup) ----------
def arc(t, side):
    ax = side * (1.2 + 5.6 * t + 1.2 * t * t)
    az = 2.6 + 7.6 * (t ** 0.9)
    return ax, az

def dir_th(t, side):
    return side * math.radians(8 + 62 * (t ** 1.1))

def flen(t):
    return 3.4 + 3.4 * (t ** 1.3)

def feather(name, root, theta, length, width, thick, cell, sharp, y):
    dx, dz = math.sin(theta), -math.cos(theta)
    cx = root[0] + dx * length * 0.5
    cz = root[1] + dz * length * 0.5
    bpy.ops.mesh.primitive_cube_add(location=(cx, y, cz), rotation=(0, -theta, 0))
    o = bpy.context.object
    o.name = name
    o.scale = (width, thick, length * 0.5)
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(o.data)
    for v in bm.verts:
        if v.co.z < 0:
            v.co.x *= 0.18 if sharp else 0.45
            v.co.y *= 0.5
        else:
            v.co.x *= 0.92
    bmesh.update_edit_mesh(o.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    finish(o, cell)
    return o

def silhouette(side, cell, y, scallop):
    pts = []
    for i in range(20):
        t = i / 19
        ax, az = arc(t, side)
        pts.append((ax, az + 0.3))
    for i in range(48):
        t = 1.0 - i / 47
        ax, az = arc(t, side)
        th = dir_th(t, side)
        L = flen(t) - scallop * abs(math.sin(t * 13 * math.pi)) ** 0.7
        pts.append((ax + math.sin(th) * L, az - math.cos(th) * L))
    me = bpy.data.meshes.new(f"sil{side}")
    ob = bpy.data.objects.new(f"sil{side}", me)
    bpy.context.collection.objects.link(ob)
    bm = bmesh.new()
    vs = [bm.verts.new((x, y, z)) for x, z in pts]
    edges = [bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    bmesh.ops.triangle_fill(bm, use_beauty=True, use_dissolve=False, edges=edges)
    bm.to_mesh(me); bm.free()
    m = ob.modifiers.new("sol", 'SOLIDIFY'); m.thickness = 0.28
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier="sol")
    finish(ob, cell)
    return ob

def build_wing(side, base_cell, feather_cell, edge_cell, sharp):
    silhouette(side, base_cell, 0.05, 0.5 if not sharp else 0.85)
    for i in range(15):
        t = i / 14
        ax, az = arc(t, side)
        theta = dir_th(t, side)
        length = flen(t) * 0.88
        w = 0.55 - 0.12 * t
        feather(f"prim{side}{i}", (ax, az), theta, length, w, 0.10, feather_cell, sharp, -0.18)
        if i % 2 == 0:
            feather(f"edge{side}{i}", (ax, az), theta, length * 0.88, w * 0.22, 0.05, edge_cell, sharp, -0.30)
    for i in range(10):
        t = i / 9
        ax, az = arc(t * 0.92 + 0.03, side)
        theta = side * math.radians(10 + 56 * t)
        length = (3.4 + 3.4 * t) * 0.5
        feather(f"cov{side}{i}", (ax, az + 0.2), theta, length, 0.46, 0.09, base_cell, sharp, -0.40)
    prev = None
    for i in range(9):
        t = i / 8
        ax, az = arc(t, side)
        ax += side * 0.25; az += 0.25
        if prev:
            mx, mz = (ax + prev[0]) / 2, (az + prev[1]) / 2
            dx, dz = ax - prev[0], az - prev[1]
            L = math.hypot(dx, dz)
            ry = math.atan2(dx, dz)
            cylinder(f"arm{side}{i}", (mx, -0.25, mz), 0.30 - 0.015 * i, L * 1.2, (0, ry, 0), edge_cell, verts=6)
        prev = (ax, az)

build_wing(+1, "crimson", "ivory", "gold", sharp=False)
build_wing(-1, "charcoal", "dpurple", "charcoal", sharp=True)

# lightning strands (left wing)
random.seed(11)
def bolt_path(start, end, segs, cell, r):
    pts = [start]
    for i in range(1, segs):
        t = i / segs
        x = start[0] + (end[0] - start[0]) * t + random.uniform(-0.35, 0.35)
        z = start[2] + (end[2] - start[2]) * t + random.uniform(-0.35, 0.35)
        pts.append((x, start[1], z))
    pts.append(end)
    for a, b in zip(pts, pts[1:]):
        mx, mz = (a[0] + b[0]) / 2, (a[2] + b[2]) / 2
        dx, dz = b[0] - a[0], b[2] - a[2]
        L = math.hypot(dx, dz)
        ry = math.atan2(dx, dz)
        cylinder("bolt", (mx, a[1], mz), r, L * 1.08, (0, ry, 0), cell, verts=5)

for (t0, fr, cell, r) in [(0.20, 0.75, "bolt", 0.09), (0.40, 0.85, "boltcore", 0.07),
                          (0.58, 0.85, "bolt", 0.09), (0.76, 0.85, "boltcore", 0.06),
                          (0.32, 0.6, "boltcore", 0.05)]:
    ax, az = arc(t0, -1)
    th = -math.radians(8 + 62 * (t0 ** 1.1))
    drop = flen(t0) * fr
    bolt_path((ax, -0.55, az - 0.4), (ax + math.sin(th) * drop, -0.55, az - math.cos(th) * drop), 6, cell, r)

# ---------- join into single mesh ----------
bpy.ops.object.select_all(action='DESELECT')
for o in ALL:
    o.select_set(True)
bpy.context.view_layer.objects.active = ALL[0]
bpy.ops.object.join()
wings = bpy.context.object
wings.name = "DuelWings"
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# triangulate + count
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode='OBJECT')
tris = len(wings.data.polygons)
print(f"TRIANGLES: {tris}")

# ---------- scale to Back accessory budget (10 x 7 x 4.5 studs) ----------
from mathutils import Vector
bb = [wings.matrix_world @ Vector(c) for c in wings.bound_box]
w = max(v.x for v in bb) - min(v.x for v in bb)
h = max(v.z for v in bb) - min(v.z for v in bb)
d = max(v.y for v in bb) - min(v.y for v in bb)
s = min(10.0 / w, 7.0 / h, 4.5 / d) * 0.98
wings.scale = (s, s, s)
bpy.ops.object.transform_apply(scale=True)
# center mesh on origin (attachment point = center)
bb = [Vector(c) for c in wings.bound_box]
cx = (max(v.x for v in bb) + min(v.x for v in bb)) / 2
cy = (max(v.y for v in bb) + min(v.y for v in bb)) / 2
cz = (max(v.z for v in bb) + min(v.z for v in bb)) / 2
wings.location = (-cx, -cy, -cz)
bpy.ops.object.transform_apply(location=True)
bb = [Vector(c) for c in wings.bound_box]
print("SIZE studs:", max(v.x for v in bb)-min(v.x for v in bb),
      max(v.y for v in bb)-min(v.y for v in bb),
      max(v.z for v in bb)-min(v.z for v in bb))

# ---------- save blend + export FBX ----------
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "DuelWings.blend"))

# Roblox: scene in cm, unit scale 0.01 (1 stud = 1 unit)
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'
sc.unit_settings.scale_length = 0.01
bpy.ops.object.select_all(action='DESELECT')
wings.select_set(True)
bpy.ops.export_scene.fbx(
    filepath=os.path.join(OUT, "DuelWings.fbx"),
    use_selection=True,
    path_mode='COPY',
    embed_textures=True,
    apply_scale_options='FBX_SCALE_UNITS',
    add_leaf_bones=False,
    bake_anim=False,
)
print("EXPORTED", os.path.join(OUT, "DuelWings.fbx"))
