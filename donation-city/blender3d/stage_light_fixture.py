import bpy, math, os
from mathutils import Vector

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 0.01

def mat(name, rgb, rough=0.45, metal=0.0, emit=None, estr=2.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        input_name = "Emission Color" if "Emission Color" in b.inputs else "Emission"
        b.inputs[input_name].default_value = (*emit, 1)
        if "Emission Strength" in b.inputs:
            b.inputs["Emission Strength"].default_value = estr
    if alpha < 1.0:
        b.inputs["Alpha"].default_value = alpha
        try:
            m.blend_method = "BLEND"
        except Exception:
            pass
    m.diffuse_color = (*rgb, 1)
    return m

NAVY = mat("navy", (0.08, 0.11, 0.23), 0.42, 0.08)
NAVY_DARK = mat("navy_dark", (0.05, 0.07, 0.15), 0.45, 0.06)
GOLD = mat("gold", (0.84, 0.67, 0.26), 0.22, 0.72)
GOLD_HI = mat("gold_hi", (0.97, 0.83, 0.43), 0.18, 0.30, emit=(0.98, 0.84, 0.48), estr=1.8)
LENS = mat("lens", (0.98, 0.98, 1.0), 0.08, 0.0, emit=(0.98, 0.99, 1.0), estr=8.0)
BEAM_MAGENTA = mat("beam_magenta", (1.0, 0.34, 0.78), 0.25, 0.0, emit=(1.0, 0.34, 0.78), estr=6.0, alpha=0.20)
BEAM_GOLD = mat("beam_gold", (1.0, 0.79, 0.30), 0.25, 0.0, emit=(1.0, 0.79, 0.30), estr=6.0, alpha=0.16)
BEAM_CYAN = mat("beam_cyan", (0.26, 0.94, 1.0), 0.25, 0.0, emit=(0.26, 0.94, 1.0), estr=6.0, alpha=0.18)
FLOOR = mat("floor", (0.14, 0.16, 0.20), 0.95, 0.02)
RIM = mat("rim", (0.92, 0.77, 0.33), 0.20, 0.58)

FIXTURE = []
PREVIEW = []

def box(name, loc, size, m, rot=(0, 0, 0), export=True):
    bpy.ops.mesh.primitive_cube_add(size=2, location=loc)
    o = bpy.context.object
    o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(m)
    (FIXTURE if export else PREVIEW).append(o)
    return o

def cyl(name, loc, r, h, m, rot=(0, 0, 0), verts=32, export=True):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, vertices=verts)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(m)
    (FIXTURE if export else PREVIEW).append(o)
    return o

def sph(name, loc, r, m, seg=24, ring=12, export=True):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=ring)
    o = bpy.context.object
    o.name = name
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(m)
    (FIXTURE if export else PREVIEW).append(o)
    return o

def torus(name, loc, major, minor, m, rot=(0, 0, 0), export=True):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, location=loc, major_segments=36, minor_segments=16)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(m)
    (FIXTURE if export else PREVIEW).append(o)
    return o

def beam_cone(name, loc, scale, m, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=1.0, radius2=0.05, depth=2.0, location=loc)
    o = bpy.context.object
    o.name = name
    o.rotation_euler = rot
    o.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    o.data.materials.append(m)
    PREVIEW.append(o)
    return o

# Ground for preview only, not exported.
box("PreviewFloor", (0, 0, -0.35), (20, 20, 0.7), FLOOR, export=False)

# Base and post.
box("Base", (0, 0, 0.28), (1.25, 1.25, 0.28), NAVY_DARK)
cyl("BaseRing", (0, 0, 0.50), 0.82, 0.12, GOLD)
cyl("Post", (0, 0, 3.15), 0.42, 6.20, NAVY)
cyl("PostBandLow", (0, 0, 1.25), 0.50, 0.10, GOLD_HI)
cyl("PostBandHigh", (0, 0, 5.35), 0.52, 0.10, GOLD)

# Head yoke and body.
box("YokeBlock", (0, 0, 6.92), (0.92, 0.82, 0.68), NAVY_DARK)
box("YokeArmL", (-0.86, 0, 6.92), (1.02, 0.22, 0.22), NAVY)
box("YokeArmR", (0.86, 0, 6.92), (1.02, 0.22, 0.22), NAVY)
box("YokeJointL", (-1.20, 0, 6.82), (0.18, 0.44, 0.44), GOLD)
box("YokeJointR", (1.20, 0, 6.82), (0.18, 0.44, 0.44), GOLD)

box("HeadPivot", (0, 0, 6.72), (0.72, 0.72, 0.72), NAVY_DARK)
box("HeadShell", (0, 0, 7.24), (1.64, 1.40, 1.04), NAVY)
cyl("HeadShellBand", (0, 0, 7.26), 0.86, 0.14, GOLD_HI, rot=(math.radians(90), 0, 0), verts=40)
torus("Ring", (0, 0, 7.74), 0.52, 0.12, GOLD, rot=(math.radians(90), 0, 0))
sph("Lens", (0, 0, 8.06), 0.34, LENS, seg=28, ring=16)
box("Bezel", (0, 0, 7.98), (0.62, 0.62, 0.18), GOLD_HI)
box("BeamTip", (0, 0, 8.58), (0.22, 0.22, 0.22), NAVY_DARK)

# Small back cap and cable details for polish.
box("RearCap", (0, -0.18, 7.00), (0.64, 0.52, 0.48), NAVY_DARK)
cyl("RearCable", (0, -0.34, 6.38), 0.08, 0.74, GOLD, rot=(math.radians(90), 0, 0), verts=20)

# Preview-only beam stack: three layers to suggest the color-cycling look.
beam_cone("BeamMagenta", (0, 0.95, 8.95), (0.28, 4.25, 0.34), BEAM_MAGENTA, rot=(math.radians(90), 0, 0))
beam_cone("BeamGold", (0.12, 1.05, 8.95), (0.18, 4.10, 0.22), BEAM_GOLD, rot=(math.radians(88), 0, math.radians(1.5)))
beam_cone("BeamCyan", (-0.10, 1.10, 8.95), (0.22, 4.30, 0.30), BEAM_CYAN, rot=(math.radians(92), 0, math.radians(-1.8)))

# Apply transforms for export cleanliness.
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

OUT_FBX = "/home/ubuntu/tools/blender3d/stage_light_fixture.fbx"
for o in FIXTURE:
    o.select_set(True)
for o in PREVIEW:
    o.select_set(False)
bpy.context.view_layer.objects.active = FIXTURE[0]
bpy.ops.export_scene.fbx(
    filepath=OUT_FBX,
    use_selection=True,
    apply_unit_scale=True,
    global_scale=1.0,
    apply_scale_options="FBX_SCALE_UNITS",
    object_types={"MESH"},
    use_mesh_modifiers=True,
    mesh_smooth_type="FACE",
    path_mode="COPY",
    embed_textures=True,
    axis_forward="-Z",
    axis_up="Y",
    bake_space_transform=True,
    add_leaf_bones=False,
    bake_anim=False,
)
print("FBX EXPORTED", OUT_FBX, os.path.getsize(OUT_FBX))

# Scene / lighting / camera preview.
w = bpy.data.worlds.new("World")
scene.world = w
w.use_nodes = True
w.node_tree.nodes["Background"].inputs[0].default_value = (0.84, 0.84, 0.84, 1)
w.node_tree.nodes["Background"].inputs[1].default_value = 0.28

bpy.ops.object.light_add(type="SUN", location=(5, -7, 18))
sun = bpy.context.object
sun.data.energy = 2.8
sun.rotation_euler = (math.radians(48), math.radians(8), math.radians(28))

bpy.ops.object.light_add(type="AREA", location=(2.5, -5.5, 10.5))
area = bpy.context.object
area.data.energy = 3200
area.data.size = 14
area.rotation_euler = (math.radians(62), 0, math.radians(20))

bpy.ops.object.light_add(type="POINT", location=(0, 0, 8.4))
pl = bpy.context.object
pl.data.energy = 2600
pl.data.color = (1.0, 0.94, 0.82)

scene.render.engine = "CYCLES"
scene.cycles.samples = 96
scene.cycles.use_denoising = True
scene.render.resolution_x = 1280
scene.render.resolution_y = 900
scene.view_settings.view_transform = "Standard"
scene.view_settings.exposure = -0.1
scene.render.image_settings.file_format = "PNG"

def cam(loc, look, lens=42):
    bpy.ops.object.camera_add(location=loc)
    c = bpy.context.object
    d = (Vector(look) - Vector(loc))
    c.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    c.data.lens = lens
    scene.camera = c
    return c

OUT = "/home/ubuntu/tools/blender3d/renders"
os.makedirs(OUT, exist_ok=True)
cam((7.6, -11.2, 6.8), (0.0, 0.0, 5.8), 36)
scene.render.filepath = OUT + "/stage_light_fixture.png"
bpy.ops.render.render(write_still=True)
print("RENDERED stage_light_fixture")
