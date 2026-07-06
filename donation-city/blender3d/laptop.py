# Professional laptop for donation-city palace desk (Blender headless)
# Parts named for runtime recolor / SurfaceGui attach: LapBase, LapKeys, LapPad,
# LapLid, LapScreen, LapLogo, LapHinge
import bpy, math, sys

# ---------- clean scene ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.scale_length = 0.01

def mat(name, color, metallic=0.0, rough=0.5, emit=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*color, 1)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = rough
    if emit:
        bsdf.inputs["Emission Color"].default_value = (*color, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    return m

GRAPHITE = mat("Graphite", (0.055, 0.06, 0.075), 0.9, 0.35)
DECK     = mat("Deck",     (0.10, 0.11, 0.13), 0.7, 0.4)
KEY      = mat("Key",      (0.02, 0.02, 0.025), 0.1, 0.6)
PAD      = mat("Pad",      (0.16, 0.17, 0.20), 0.3, 0.3)
SCREEN   = mat("Screen",   (0.10, 0.22, 0.55), 0.0, 0.7, emit=0.25)
BEZEL    = mat("Bezel",    (0.01, 0.01, 0.012), 0.2, 0.3)
GOLD     = mat("Gold",     (0.85, 0.62, 0.18), 1.0, 0.25)

def add_box(name, size, loc, material, bevel=0.06, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    ob = bpy.context.object
    ob.name = name
    ob.scale = (size[0], size[1], size[2])
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        b = ob.modifiers.new("Bevel", 'BEVEL')
        b.width = bevel; b.segments = 4; b.use_clamp_overlap = True
    ob.data.materials.append(material)
    return ob

# dimensions (units ~= studs): base 2.2 deep (X) x 3.0 wide (Y) x 0.14
BW, BD, BH = 3.0, 2.2, 0.14
base = add_box("LapBase", (BD, BW, BH), (0, 0, BH / 2), GRAPHITE, 0.05)
# deck inset
add_box("LapDeck", (BD - 0.16, BW - 0.16, 0.03), (0, 0, BH + 0.005), DECK, 0.02)
# keyboard: 5 rows x 12 keys
kx0 = -BD / 2 + 0.28
rows, cols = 5, 12
kw = (BW - 0.7) / cols
kd = 0.20
for r in range(rows):
    for c in range(cols):
        x = kx0 + r * (kd + 0.05) + kd / 2
        y = -BW / 2 + 0.35 + c * kw + kw * 0.45
        add_box("LapKeys", (kd, kw * 0.82, 0.05), (x, y, BH + 0.035), KEY, 0.015)
# spacebar
add_box("LapKeys", (kd, kw * 5, 0.05), (kx0 + rows * (kd + 0.05) + kd / 2, 0, BH + 0.035), KEY, 0.015)
# trackpad
add_box("LapPad", (0.55, 1.1, 0.02), (BD / 2 - 0.45, 0, BH + 0.02), PAD, 0.01)

# lid: hinged at back (-X edge), tilted open 105 deg
LH, LT = 2.05, 0.08   # lid height, thickness
ang = math.radians(15)  # from vertical
hinge_x = -BD / 2 + 0.06
lid = add_box("LapLid", (LT, BW, LH), (0, 0, 0), GRAPHITE, 0.04)
lid.location = (hinge_x - math.sin(ang) * LH / 2, 0, BH + math.cos(ang) * LH / 2)
lid.rotation_euler = (0, -ang, 0)
# bezel (front face of lid)
bez = add_box("LapBezel", (0.02, BW - 0.12, LH - 0.12), (0, 0, 0), BEZEL, 0.01)
bez.location = (lid.location[0] + math.cos(ang) * LT / 2, 0, lid.location[2] + math.sin(ang) * LT / 2)
bez.rotation_euler = (0, -ang, 0)
# screen
scr = add_box("LapScreen", (0.02, BW - 0.28, LH - 0.28), (0, 0, 0), SCREEN, 0.0)
scr.location = (bez.location[0] + math.cos(ang) * 0.015, 0, bez.location[2] + math.sin(ang) * 0.015)
scr.rotation_euler = (0, -ang, 0)
# gold logo on lid back
logo = add_box("LapLogo", (0.02, 0.42, 0.42), (0, 0, 0), GOLD, 0.01)
logo.location = (lid.location[0] - math.cos(ang) * (LT / 2 + 0.005), 0, lid.location[2] - math.sin(ang) * (LT / 2 + 0.005))
logo.rotation_euler = (math.radians(45), -ang, 0)
# hinge cylinder
bpy.ops.mesh.primitive_cylinder_add(radius=0.05, depth=BW - 0.5, location=(hinge_x, 0, BH + 0.02), rotation=(math.pi / 2, 0, 0))
h = bpy.context.object; h.name = "LapHinge"; h.data.materials.append(GOLD)
# gold accent strip on front edge of base
add_box("LapTrim", (0.03, BW, 0.04), (BD / 2 - 0.01, 0, BH - 0.03), GOLD, 0.01)

# wireless mouse beside the laptop (+Y side)
MX, MY = 0.35, BW / 2 + 0.85
mbody = add_box("MouseBody", (0.85, 0.5, 0.26), (MX, MY, 0.13), GRAPHITE, 0.12)
sub = mbody.modifiers.new("Subd", 'SUBSURF'); sub.levels = 2; sub.render_levels = 2
add_box("MouseWheel", (0.16, 0.05, 0.1), (MX - 0.22, MY, 0.26), GOLD, 0.02)
mline = add_box("MouseLine", (0.4, 0.015, 0.02), (MX - 0.2, MY, 0.255), KEY, 0.005)
add_box("MouseLogo", (0.14, 0.14, 0.02), (MX + 0.15, MY, 0.24), GOLD, 0.01)
# cable from mouse front to laptop side (curved via bezier)
crv = bpy.data.curves.new("MouseCableCurve", 'CURVE')
crv.dimensions = '3D'; crv.bevel_depth = 0.022; crv.bevel_resolution = 4
sp = crv.splines.new('BEZIER'); sp.bezier_points.add(2)
pts = [(MX - 0.42, MY, 0.05), (MX - 0.65, MY - 0.35, 0.04), (0.1, BW / 2 - 0.02, 0.08)]
hnd = [(-0.35, 0, 0), (-0.2, -0.25, 0), (0.15, 0.3, 0)]
for p, (co, h2) in zip(sp.bezier_points, zip(pts, hnd)):
    p.co = co
    p.handle_left = (co[0] - h2[0], co[1] - h2[1], co[2] - h2[2])
    p.handle_right = (co[0] + h2[0], co[1] + h2[1], co[2] + h2[2])
cab = bpy.data.objects.new("MouseCable", crv)
bpy.context.collection.objects.link(cab)
cab.data.materials.append(KEY)

if "--export" in sys.argv:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.fbx(
        filepath=r"C:\Users\Administrator\tools\blender3d\laptop.fbx",
        use_selection=True, apply_scale_options='FBX_SCALE_UNITS',
        axis_forward='-Z', axis_up='Y', bake_space_transform=True,
        path_mode='COPY', embed_textures=True)

if "--render" in sys.argv:
    # wallpaper image on screen (mockup only)
    img = bpy.data.images.load(r"C:\Users\Administrator\tools\blender3d\wallpaper.png")
    wm = bpy.data.materials.new("Wallpaper")
    wm.use_nodes = True
    nt = wm.node_tree
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, 0, math.radians(-90))
    mp.inputs["Location"].default_value = (0, 1, 0)
    nt.links.new(tc.outputs["UV"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], tex.inputs["Vector"])
    bsdf = nt.nodes["Principled BSDF"]
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Emission Color"])
    bsdf.inputs["Emission Strength"].default_value = 0.6
    bsdf.inputs["Roughness"].default_value = 0.8
    nrm = (math.cos(ang), 0.0, math.sin(ang))
    bpy.ops.mesh.primitive_plane_add(size=1, location=(
        scr.location[0] + nrm[0] * 0.02, 0, scr.location[2] + nrm[2] * 0.02))
    wp = bpy.context.object
    wp.rotation_euler = (0, math.radians(90) - ang, 0)
    wp.scale = (LH - 0.28, BW - 0.28, 1)
    wp.data.materials.append(wm)
    # desk-like ground
    bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
    ground = bpy.context.object
    ground.data.materials.append(mat("Wood", (0.16, 0.09, 0.05), 0.0, 0.45))
    # lights: big soft area + fill + warm world
    bpy.ops.object.light_add(type='AREA', location=(4, -3, 6))
    al = bpy.context.object; al.data.energy = 1600; al.data.size = 8
    al.rotation_euler = (math.radians(35), math.radians(20), 0)
    bpy.ops.object.light_add(type='AREA', location=(-4, 4, 5))
    fl = bpy.context.object; fl.data.energy = 700; fl.data.size = 6
    fl.rotation_euler = (math.radians(-30), math.radians(-25), 0)
    world = bpy.data.worlds.new("W"); scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (0.25, 0.2, 0.15, 1)
    bg.inputs[1].default_value = 0.5
    # camera 3/4 front view aimed at laptop
    bpy.ops.object.camera_add(location=(4.6, -3.6, 3.0))
    cam = bpy.context.object
    import mathutils
    direction = mathutils.Vector((-0.6, 0, 1.0)) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 64
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 800
    scene.render.filepath = r"C:\Users\Administrator\tools\blender3d\laptop_ref.png"
    bpy.ops.render.render(write_still=True)
