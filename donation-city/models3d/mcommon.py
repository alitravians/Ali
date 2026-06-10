import bpy, math, mathutils

def clear():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.lights, bpy.data.cameras):
        for b in list(block):
            if b.users == 0:
                block.remove(b)

def mat(name, color, metallic=0.0, rough=0.5, emit=0.0, alpha=1.0):
    if name in bpy.data.materials:
        return bpy.data.materials[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = rough
    if emit > 0:
        bsdf.inputs['Emission Color'].default_value = (*color, 1)
        bsdf.inputs['Emission Strength'].default_value = emit
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND'
    m.diffuse_color = (*color, alpha)
    return m

def _fin(o, name, material):
    o.name = name
    if material:
        o.data.materials.append(material)
    return o

def box(name, loc, size, material, rot=(0,0,0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _fin(o, name, material)

def cyl(name, loc, r, depth, material, rot=(0,0,0), verts=24):
    bpy.ops.mesh.primitive_cylinder_add(location=loc, radius=r, depth=depth, rotation=rot, vertices=verts)
    return _fin(bpy.context.object, name, material)

def sphere(name, loc, r, material, scale=(1,1,1), subdiv=2):
    bpy.ops.mesh.primitive_ico_sphere_add(location=loc, radius=r, subdivisions=subdiv)
    o = bpy.context.object
    o.scale = scale
    bpy.ops.object.transform_apply(scale=True)
    return _fin(o, name, material)

def cone(name, loc, r1, r2, depth, material, rot=(0,0,0), verts=24):
    bpy.ops.mesh.primitive_cone_add(location=loc, radius1=r1, radius2=r2, depth=depth, rotation=rot, vertices=verts)
    return _fin(bpy.context.object, name, material)

def export_fbx(path):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.fbx(
        filepath=path,
        use_selection=True,
        global_scale=0.01,
        apply_unit_scale=True,
        object_types={'MESH'},
        add_leaf_bones=False,
        path_mode='COPY',
        embed_textures=True,
        mesh_smooth_type='FACE',
    )
    print('EXPORTED', path)
