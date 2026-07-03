"""
Royal Descent parachute — Blender model + reference render.
Run: blender --background --python parachute.py
Outputs:
  - C:/Users/Administrator/tools/blender3d/parachute.fbx   (asset for Roblox)
  - C:/Users/Administrator/renders/parachute_ref.png       (reference render)
Design: canopy dome with 12 alternating navy/gold gore panels, scalloped
skirt, suspension lines converging to a harness ring. Shahad identity
(navy #1C2A4E + gold #D6AF5C).
"""
import bpy, bmesh, math, os
from mathutils import Vector

OUT_FBX = r"C:/Users/Administrator/tools/blender3d/parachute.fbx"
OUT_PNG = r"C:/Users/Administrator/renders/parachute_ref.png"

NAVY = (0.055, 0.090, 0.210, 1.0)   # brighter navy so it reads on camera
GOLD = (0.780, 0.560, 0.150, 1.0)   # richer gold
ROPE = (0.85, 0.85, 0.88, 1.0)
HARN = (0.10, 0.10, 0.13, 1.0)

# ---------- reset scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def new_mat(name, rgba, rough=0.55, metal=0.0, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = rgba
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit and "Emission Color" in b.inputs:
        b.inputs["Emission Color"].default_value = rgba
        b.inputs["Emission Strength"].default_value = emit
    return m


mat_navy = new_mat("Navy", NAVY, rough=0.62)
mat_gold = new_mat("Gold", GOLD, rough=0.42, metal=0.25)
mat_rope = new_mat("Rope", ROPE, rough=0.7)
mat_harn = new_mat("Harness", HARN, rough=0.5, metal=0.3)

SEG = 48          # radial segments
GORES = 12        # number of colored panels
R = 3.0           # canopy radius
H = 1.55          # canopy height (dome)
SKIRT = 0.32      # scallop depth at rim

# ---------- build canopy as a gored dome ----------
mesh = bpy.data.meshes.new("Canopy")
obj = bpy.data.objects.new("Canopy", mesh)
scene.collection.objects.link(obj)
bm = bmesh.new()

rings = 10
verts = {}
apex = bm.verts.new((0, 0, H))
for ri in range(1, rings + 1):
    t = ri / rings
    for si in range(SEG):
        ang = (si / SEG) * math.tau
        # scallop: rim dips between gore seams
        scallop = 0.0
        if ri == rings:
            phase = (ang * GORES) % math.tau
            scallop = -SKIRT * (0.5 - 0.5 * math.cos(phase))
        rad = R * math.sin(t * math.pi * 0.5)
        z = H * math.cos(t * math.pi * 0.5) + scallop
        # slight puff outward near rim
        rad *= 1.0 + 0.06 * math.sin(t * math.pi)
        verts[(ri, si)] = bm.verts.new((rad * math.cos(ang), rad * math.sin(ang), z))

bm.verts.ensure_lookup_table()
faces = []
for si in range(SEG):
    s2 = (si + 1) % SEG
    faces.append(bm.faces.new((apex, verts[(1, si)], verts[(1, s2)])))
for ri in range(1, rings):
    for si in range(SEG):
        s2 = (si + 1) % SEG
        faces.append(bm.faces.new((verts[(ri, si)], verts[(ri + 1, si)],
                                   verts[(ri + 1, s2)], verts[(ri, s2)])))
bm.normal_update()
bm.to_mesh(mesh)
bm.free()

# assign gore panel materials (alternating navy/gold by angular sector)
obj.data.materials.append(mat_navy)
obj.data.materials.append(mat_gold)
for poly in obj.data.polygons:
    c = poly.center
    ang = math.atan2(c.y, c.x) % math.tau
    sector = int((ang / math.tau) * GORES) % 2
    poly.material_index = sector

# solidify + smooth so it reads as fabric
mod = obj.modifiers.new("Solid", 'SOLIDIFY'); mod.thickness = 0.04
sub = obj.modifiers.new("Sub", 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
for p in obj.data.polygons:
    p.use_smooth = True

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

harness_pt = (0, 0, -3.2)
LINES = 12
for i in range(LINES):
    ang = (i / LINES) * math.tau
    rim = (R * 0.96 * math.cos(ang), R * 0.96 * math.sin(ang), H * 0.06)
    cylinder(rim, harness_pt, 0.018, mat_rope, f"Line{i}")

# harness ring
bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.06,
                                 location=harness_pt)
ring = bpy.context.active_object; ring.name = "HarnessRing"
ring.data.materials.append(mat_harn)

# gold apex vent cap
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.35, depth=0.12,
                                    location=(0, 0, H + 0.02))
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
# sky world (soft blue gradient stand-in)
world = bpy.data.worlds.new("W"); scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.32, 0.56, 0.86, 1.0)
bg.inputs[1].default_value = 0.7

# sun
bpy.ops.object.light_add(type='SUN', location=(6, -6, 12))
sun = bpy.context.active_object; sun.data.energy = 4.5
sun.data.color = (1.0, 0.94, 0.82)
sun.rotation_euler = (math.radians(45), 0, math.radians(30))

# camera
bpy.ops.object.camera_add(location=(7.5, -8.5, 2.0))
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
