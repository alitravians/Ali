"""
Royal Descent parachute — Blender model + reference render.
Run: blender --background --python parachute.py

Outputs (next to this script so upload_parachute.py picks them up):
  - parachute.fbx          (asset uploaded to Roblox)
  - parachute_ref.png      (reference render)

Design: a lobed ("pumpkin") canopy with 12 alternating navy/gold gore panels
built as TWO separate objects (CanopyNavy / CanopyGold) so Roblox imports them
as distinct MeshParts that can be recolored crisply by name at runtime. A
scalloped skirt, 12 visible suspension lines converging to a dark harness ring,
and a gold apex vent. Shahad identity (navy #1C2A4E + gold #D6AF5C).
"""
import bpy, bmesh, math, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
OUT_FBX = os.path.join(HERE, "parachute.fbx")
OUT_PNG = os.path.join(HERE, "parachute_ref.png")

NAVY = (0.055, 0.090, 0.210, 1.0)
GOLD = (0.780, 0.560, 0.150, 1.0)
ROPE = (0.85, 0.85, 0.88, 1.0)
HARN = (0.10, 0.10, 0.13, 1.0)

# ---------- reset scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def new_mat(name, rgba, rough=0.55, metal=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return m


mat_navy = new_mat("Navy", NAVY, rough=0.62)
mat_gold = new_mat("Gold", GOLD, rough=0.38, metal=0.35)
mat_rope = new_mat("Rope", ROPE, rough=0.7)
mat_harn = new_mat("Harness", HARN, rough=0.5, metal=0.3)

GORES = 12        # colored panels around the canopy
ASEG = 6          # angular subdivisions per gore
RINGS = 12        # vertical rings apex -> rim
R = 3.0           # canopy radius
H = 1.75          # canopy dome height
LOBE = 0.16       # outward bulge at each panel centre (pumpkin look)
SKIRT = 0.42      # scallop depth at rim seams


def gore_vertex(g, ri, a):
    seg = g * ASEG + a
    ang = (seg / (GORES * ASEG)) * math.tau
    t = ri / RINGS
    base_rad = R * math.sin(t * math.pi * 0.5)
    base_z = H * math.cos(t * math.pi * 0.5)
    la = a / ASEG                      # 0..1 within the gore
    lobe = math.sin(la * math.pi)      # 0 at seams, 1 at panel centre
    rad = base_rad * (1.0 + LOBE * lobe * math.sin(t * math.pi))
    z = base_z
    if ri == RINGS:
        z -= SKIRT * (1.0 - lobe)      # rim dips between lobes -> scallop
    return Vector((rad * math.cos(ang), rad * math.sin(ang), z))


def build_canopy(name, parity, mat):
    bm = bmesh.new()
    apex = bm.verts.new((0, 0, H))
    grid = {}
    for ri in range(1, RINGS + 1):
        for a in range(ASEG + 1):
            grid[(ri, a)] = None
    for g in range(GORES):
        if g % 2 != parity:
            continue
        cols = {}
        for a in range(ASEG + 1):
            for ri in range(1, RINGS + 1):
                cols[(ri, a)] = bm.verts.new(gore_vertex(g, ri, a))
        # apex fan
        for a in range(ASEG):
            bm.faces.new((apex, cols[(1, a)], cols[(1, a + 1)]))
        # quad body
        for ri in range(1, RINGS):
            for a in range(ASEG):
                bm.faces.new((cols[(ri, a)], cols[(ri + 1, a)],
                              cols[(ri + 1, a + 1)], cols[(ri, a + 1)]))
    bm.normal_update()
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    obj.data.materials.append(mat)
    for p in obj.data.polygons:
        p.use_smooth = True
    md = obj.modifiers.new("Solid", 'SOLIDIFY'); md.thickness = 0.05
    sub = obj.modifiers.new("Sub", 'SUBSURF'); sub.levels = 1; sub.render_levels = 2
    return obj


build_canopy("CanopyNavy", 0, mat_navy)
build_canopy("CanopyGold", 1, mat_gold)


# ---------- suspension lines + harness ----------
def cylinder(p1, p2, r, mat, name):
    v = Vector(p2) - Vector(p1)
    depth = v.length
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=r, depth=depth,
                                         location=(Vector(p1) + v / 2))
    o = bpy.context.active_object
    o.name = name
    z = Vector((0, 0, 1))
    axis = z.cross(v.normalized())
    if axis.length > 1e-6:
        o.rotation_mode = 'AXIS_ANGLE'
        o.rotation_axis_angle = (z.angle(v.normalized()), *axis.normalized())
    o.data.materials.append(mat)
    return o


harness_pt = (0, 0, -2.7)
for i in range(GORES):
    ang = (i / GORES) * math.tau            # anchor at gore seams
    rim = (R * 0.99 * math.cos(ang), R * 0.99 * math.sin(ang), H * 0.02 - SKIRT * 0.5)
    cylinder(rim, harness_pt, 0.03, mat_rope, f"Line{i}")

bpy.ops.mesh.primitive_torus_add(major_radius=0.24, minor_radius=0.07,
                                 location=harness_pt)
ring = bpy.context.active_object; ring.name = "HarnessRing"
ring.data.materials.append(mat_harn)

bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.38, depth=0.14,
                                    location=(0, 0, H + 0.03))
cap = bpy.context.active_object; cap.name = "ApexVent"
cap.data.materials.append(mat_gold)

# ---------- export FBX (Roblox settings) ----------
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.01
for o in scene.objects:
    o.select_set(True)
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
bpy.ops.export_scene.fbx(filepath=OUT_FBX, apply_unit_scale=True,
                         global_scale=1.0, apply_scale_options='FBX_SCALE_UNITS',
                         axis_forward='-Z', axis_up='Y', use_mesh_modifiers=True,
                         path_mode='COPY', embed_textures=True,
                         add_leaf_bones=False, bake_space_transform=True)
print("FBX_EXPORTED", OUT_FBX)

# ---------- reference render ----------
world = bpy.data.worlds.new("W"); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.32, 0.56, 0.86, 1.0)
bg.inputs[1].default_value = 0.7

bpy.ops.object.light_add(type='SUN', location=(6, -6, 12))
sun = bpy.context.active_object; sun.data.energy = 4.5
sun.data.color = (1.0, 0.94, 0.82)
sun.rotation_euler = (math.radians(45), 0, math.radians(30))

bpy.ops.object.camera_add(location=(7.8, -8.8, 2.2))
cam = bpy.context.active_object
scene.camera = cam
tt = cam.constraints.new('TRACK_TO'); tt.track_axis = 'TRACK_NEGATIVE_Z'; tt.up_axis = 'UP_Y'
empty = bpy.data.objects.new("Aim", None); scene.collection.objects.link(empty)
empty.location = (0, 0, -0.4)
tt.target = empty

scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1100
scene.render.resolution_y = 1100
scene.render.filepath = OUT_PNG
try:
    scene.cycles.device = 'CPU'
except Exception:
    pass
bpy.ops.render.render(write_still=True)
print("RENDER_DONE", OUT_PNG)
