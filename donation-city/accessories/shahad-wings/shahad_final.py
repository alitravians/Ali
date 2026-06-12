"""Final UGC 'Shahad Wings' Back accessory: single mesh <=4000 tris, palette texture, FBX export.
Design per approved v4 mockup: V-shape white wings hugging gold cursive 'Shahad'."""
import bpy, bmesh, math, os
from mathutils import Vector

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "shahad_out")
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)

# ---------- palette texture ----------
CELLS = {
    "pearl":  (0.961, 0.949, 0.922),  # F5F2EB
    "white":  (0.99, 0.97, 0.94),
    "cream":  (0.93, 0.90, 0.84),
    "gold":   (0.831, 0.686, 0.216),  # D4AF37
    "dgold":  (0.62, 0.48, 0.13),
    "lgold":  (0.97, 0.85, 0.45),
}
names = list(CELLS)
SZ = 256
img = bpy.data.images.new("ShahadPalette", SZ, SZ)
px = [0.0] * (SZ * SZ * 4)
cols = 3
ch, cw = 128, 85
for idx, n in enumerate(names):
    cx, cy = idx % cols, idx // cols
    r, g, b = CELLS[n]
    for y in range(cy * ch, cy * ch + ch):
        for x in range(cx * cw, min(cx * cw + cw, SZ)):
            o = (y * SZ + x) * 4
            px[o:o+4] = [r, g, b, 1.0]
img.pixels[:] = px
img.filepath_raw = os.path.join(OUT, "ShahadPalette.png")
img.file_format = 'PNG'
img.save()

def uv_center(n):
    idx = names.index(n)
    cx, cy = idx % cols, idx // cols
    return ((cx * cw + cw / 2) / SZ, (cy * ch + ch / 2) / SZ)

matl = bpy.data.materials.new("ShahadWings")
matl.use_nodes = True
bsdf = matl.node_tree.nodes['Principled BSDF']
tex = matl.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = img
matl.node_tree.links.new(tex.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.5

ALL = []

def finish(o, cell):
    o.data.materials.append(matl)
    if not o.data.uv_layers:
        o.data.uv_layers.new()
    u, v = uv_center(cell)
    for l in o.data.uv_layers.active.data:
        l.uv = (u, v)
    ALL.append(o)
    return o

def cylinder(name, loc, radius, depth, rot, cell, verts=6):
    bpy.ops.mesh.primitive_cylinder_add(location=loc, rotation=rot, radius=radius, depth=depth, vertices=verts)
    o = bpy.context.object; o.name = name
    finish(o, cell)
    return o

# ---------- wing geometry (same shape as approved v4 mockup) ----------
def arc(t, side):
    x = side * (0.5 + 2.0 * t + 0.9 * t * t)
    z = 1.0 + 4.6 * (t ** 0.78)
    y = 0.55 + 0.3 * t
    return x, y, z

def dir_th(t, side):
    return side * math.radians(8 + 38 * (t ** 0.85))

def flen(t):
    return 1.2 + 2.2 * math.sin(t * math.pi * 0.8)

def feather(name, root, theta, length, width, thick, cell, y):
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
            v.co.x *= 0.22
            v.co.y *= 0.4
    bmesh.update_edit_mesh(o.data)
    bpy.ops.object.mode_set(mode='OBJECT')
    finish(o, cell)
    return o

def build_wing(side):
    # Layer 1: large feathers (14)
    for i in range(14):
        t = i / 13
        ax, ay, az = arc(t, side)
        cell = "pearl" if i % 2 == 0 else "white"
        feather(f"L{side}_{i}", (ax, az), dir_th(t, side), flen(t), 0.30 - 0.04 * t, 0.05, cell, ay + 0.10)
    # Layer 2: medium feathers (16)
    for i in range(16):
        t = (i + 0.35) / 16
        ax, ay, az = arc(t, side)
        cell = "white" if i % 2 == 0 else "cream"
        feather(f"M{side}_{i}", (ax + side * 0.04, az + 0.10), dir_th(t, side) * 0.9,
                flen(t) * 0.68, 0.28 - 0.04 * t, 0.045, cell, ay + 0.0)
    # Layer 3: small coverts (14)
    for i in range(14):
        t = (i + 0.2) / 14
        ax, ay, az = arc(t * 0.92 + 0.03, side)
        feather(f"S{side}_{i}", (ax + side * 0.07, az + 0.18), dir_th(t, side) * 0.7,
                flen(t) * 0.38, 0.24, 0.04, "cream", ay - 0.10)
    # Gold border along leading edge
    prev = None
    for i in range(11):
        t = i / 10
        ax, ay, az = arc(t, side)
        ax += side * 0.08; az += 0.16
        if prev:
            mx, mz = (ax + prev[0]) / 2, (az + prev[2]) / 2
            my = (ay + prev[1]) / 2
            dx, dz = ax - prev[0], az - prev[2]
            L = math.hypot(dx, dz)
            ry = math.atan2(dx, dz)
            cylinder(f"arm{side}_{i}", (mx, my - 0.05, mz), 0.15 - 0.005 * i, L * 1.15, (0, ry, 0), "gold", verts=6)
        prev = (ax, ay, az)
    # gold tip beads
    tx, ty, tz = arc(1.0, side)
    for j in range(3):
        a = math.radians(25 + j * 45)
        bpy.ops.mesh.primitive_ico_sphere_add(
            location=(tx + side * (0.10 + 0.18 * math.cos(a)), ty - 0.05, tz + 0.16 + 0.18 * math.sin(a)),
            radius=0.11 - 0.02 * j, subdivisions=1)
        o = bpy.context.object; o.name = f"curl{side}_{j}"
        finish(o, "lgold")

build_wing(+1)
build_wing(-1)

# ---------- gold cursive text "Shahad" ----------
bpy.ops.object.text_add(location=(0, 1.2, 0.55), rotation=(math.radians(90), 0, math.radians(180)))
txt = bpy.context.object
txt.name = "ShahadText"
txt.data.body = "Shahad"
txt.data.align_x = 'CENTER'
txt.data.align_y = 'CENTER'
txt.data.size = 2.4
txt.data.extrude = 0.10
txt.data.resolution_u = 3
txt.data.font = bpy.data.fonts.load(os.path.expanduser("~/fonts/GreatVibes.ttf"))
bpy.ops.object.convert(target='MESH')
txt = bpy.context.object
# place baseline slightly above origin
bpy.context.view_layer.update()
mn = min((txt.matrix_world @ v.co).z for v in txt.data.vertices)
txt.location.z += 0.15 - mn
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
# cleanup + reduce
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.remove_doubles(threshold=0.004)
bpy.ops.mesh.dissolve_limited(angle_limit=math.radians(4))
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode='OBJECT')
print("TEXT tris before decimate:", len(txt.data.polygons))
if len(txt.data.polygons) > 1500:
    dm = txt.modifiers.new("dec", 'DECIMATE')
    dm.ratio = 1500 / len(txt.data.polygons)
    bpy.context.view_layer.objects.active = txt
    bpy.ops.object.modifier_apply(modifier="dec")
print("TEXT tris after decimate:", len(txt.data.polygons))
finish(txt, "gold")

# small gold ornament under the text
bpy.ops.mesh.primitive_cone_add(location=(0, 1.2, 0.05), rotation=(0, math.radians(180), 0),
                                 radius1=0.16, radius2=0.01, depth=0.4, vertices=4)
orn = bpy.context.object; orn.name = "ornament"
finish(orn, "lgold")

# ---------- join all into ONE mesh ----------
bpy.ops.object.select_all(action='DESELECT')
for o in ALL:
    o.select_set(True)
bpy.context.view_layer.objects.active = ALL[0]
bpy.ops.object.join()
mesh = bpy.context.object
mesh.name = "ShahadWings"
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.quads_convert_to_tris()
bpy.ops.object.mode_set(mode='OBJECT')

tris = len(mesh.data.polygons)
print(f"TRIANGLES: {tris}")
assert tris <= 4000, f"tri budget exceeded: {tris} > 4000"

# ---------- scale/center to Back accessory budget (10 x 7 x 4.5 studs) ----------
def bounds(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx

mn, mx = bounds(mesh)
dim = mx - mn
s = min(10.0 / dim.x, 7.0 / dim.z, 4.5 / dim.y) * 0.98
mesh.scale = (s, s, s)
bpy.ops.object.transform_apply(scale=True)
mn, mx = bounds(mesh)
ctr = (mn + mx) / 2
mesh.location = -ctr
bpy.ops.object.transform_apply(location=True)
mn, mx = bounds(mesh)
dim = mx - mn
print("SIZE studs:", dim.x, dim.y, dim.z)
assert dim.x <= 10.0 and dim.z <= 7.0 and dim.y <= 4.5

# ---------- save blend + export FBX ----------
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "ShahadWings.blend"))
sc = bpy.context.scene
sc.unit_settings.system = 'METRIC'
sc.unit_settings.scale_length = 0.01
bpy.ops.object.select_all(action='DESELECT')
mesh.select_set(True)
bpy.ops.export_scene.fbx(
    filepath=os.path.join(OUT, "ShahadWings.fbx"),
    use_selection=True,
    path_mode='COPY',
    embed_textures=True,
    apply_scale_options='FBX_SCALE_UNITS',
    add_leaf_bones=False,
    bake_anim=False,
)
print("EXPORTED", os.path.join(OUT, "ShahadWings.fbx"))
