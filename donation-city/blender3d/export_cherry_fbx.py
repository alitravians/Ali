import bpy, math, os, random
from mathutils import Vector, Quaternion

# Build a realistic branching cherry-blossom tree and export to FBX for Roblox.
# Two joined meshes are exported so they can be recolored by name in-game:
#   "Trunk"  -> trunk + branches + root flare  (brown bark)
#   "Canopy" -> dense pink blossom dome         (pink, wind-swayed in-game)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.01
random.seed(11)

def mat(name, rgb, rough=0.7):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    return m

BARK = mat("bark", (0.30, 0.19, 0.12), 0.85)
PINK = mat("pink", (0.97, 0.55, 0.72), 0.75)

WOOD_PARTS = []
LEAF_PARTS = []

def cyl_between(p0, p1, r0, r1):
    p0 = Vector(p0); p1 = Vector(p1)
    d = p1 - p0; L = d.length
    if L < 1e-4: return None
    bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=r0, radius2=r1, depth=L,
                                    location=(p0 + d * 0.5))
    o = bpy.context.object
    o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(BARK); WOOD_PARTS.append(o); return o

def blossom(loc, r):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=loc)
    o = bpy.context.object; o.data.materials.append(PINK)
    o.scale = (1.0, 0.85, 1.0); LEAF_PARTS.append(o); return o

CLUSTERS = []  # branch tips where blossoms cluster

def grow(p0, direction, length, radius, depth):
    direction = Vector(direction).normalized()
    p1 = Vector(p0) + direction * length
    cyl_between(p0, p1, radius, radius * 0.72)
    if depth <= 0:
        CLUSTERS.append(p1)
        return
    n = 2 if depth > 2 else 3
    for i in range(n):
        ang = math.radians(random.uniform(24, 44))
        roll = math.radians(random.uniform(0, 360) + i * (360 / n))
        perp = direction.cross(Vector((0, 0, 1)))
        if perp.length < 1e-3: perp = Vector((1, 0, 0))
        perp.normalize()
        nd = (Quaternion(direction, roll) @ (Quaternion(perp, ang) @ direction)).normalized()
        nd = (nd + Vector((0, 0, 0.5))).normalized()  # strong upward bias -> straighter, symmetric crown
        grow(p1, nd, length * random.uniform(0.7, 0.82), radius * 0.7, depth - 1)

# trunk (slight base) + branches
grow(Vector((0, 0, 0)), (0, 0, 1), 5.4, 1.15, 4)
# root flare
for a in range(6):
    ang = math.radians(a * 60)
    cyl_between((0, 0, 0.25), (math.cos(ang) * 1.5, math.sin(ang) * 1.5, -0.15), 0.5, 0.18)

# canopy: dense dome of blossoms around the tips + volume fill
top = max(c.z for c in CLUSTERS)
dome_c = Vector((0, 0, top - 2.2))  # centered over trunk for a symmetric dome
for loc in CLUSTERS:
    for _ in range(6):
        off = Vector((random.uniform(-1.3, 1.3), random.uniform(-1.3, 1.3),
                      random.uniform(-0.9, 1.3)))
        blossom(loc + off, random.uniform(1.3, 2.0))
for _ in range(200):
    u = random.uniform(0, 1); th = random.uniform(0, 2 * math.pi)
    ph = math.acos(random.uniform(-0.35, 1.0))
    R = 8.4 * (u ** 0.5)
    p = dome_c + Vector((R * math.sin(ph) * math.cos(th),
                         R * math.sin(ph) * math.sin(th),
                         R * math.cos(ph) * 0.8))
    blossom(p, random.uniform(1.5, 2.3))

def join(parts, name, m):
    bpy.ops.object.select_all(action='DESELECT')
    for o in parts: o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object; obj.name = name
    obj.data.materials.clear(); obj.data.materials.append(m)
    return obj

trunk = join(WOOD_PARTS, "Trunk", BARK)
canopy = join(LEAF_PARTS, "Canopy", PINK)

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

import mathutils
mn = [1e9] * 3; mx = [-1e9] * 3
for o in (trunk, canopy):
    for v in o.bound_box:
        wv = o.matrix_world @ mathutils.Vector(v)
        for k in range(3):
            mn[k] = min(mn[k], wv[k]); mx[k] = max(mx[k], wv[k])
print("BBOX min", [round(x, 2) for x in mn], "max", [round(x, 2) for x in mx],
      "size", [round(mx[k] - mn[k], 2) for k in range(3)])

OUT = "/home/ubuntu/tools/blender3d/cherry_tree.fbx"
bpy.ops.export_scene.fbx(filepath=OUT, use_selection=False, apply_unit_scale=True,
    global_scale=1.0, apply_scale_options='FBX_SCALE_UNITS', object_types={'MESH'},
    use_mesh_modifiers=True, mesh_smooth_type='FACE', path_mode='COPY',
    axis_forward='-Z', axis_up='Y', bake_space_transform=True, add_leaf_bones=False, bake_anim=False)
print("FBX EXPORTED", os.path.getsize(OUT), "wood", len(WOOD_PARTS), "leaf", len(LEAF_PARTS))
