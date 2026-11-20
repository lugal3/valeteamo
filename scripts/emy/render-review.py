"""Render exported runtime vertices (not an imagined replacement model)."""
import bpy,json,math,sys,os
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUTPUT=Path(os.environ.get('EMY_REVIEW_OUTPUT',ROOT/'output/emy-review'))
OUTPUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=48;scene.cycles.use_denoising=False
scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.27,.27,.27);scene.view_settings.view_transform='Standard';scene.view_settings.exposure=-.50
def mat(name,roughness):
 m=bpy.data.materials.new(name);m.use_nodes=True;n=m.node_tree.nodes;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=roughness
 attr=n.new('ShaderNodeAttribute');attr.attribute_name='Coat';m.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
 return m,bs,attr
plain,_,_=mat('Feline features',.67)
coat,bs,attr=mat('Silver tabby fur',.84)
nodes=coat.node_tree.nodes;links=coat.node_tree.links
tex=nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(ROOT/'src/lab/assets/emy/coat-v2.jpg'))
hue=nodes.new('ShaderNodeHueSaturation');hue.inputs['Saturation'].default_value=.18;links.new(tex.outputs['Color'],hue.inputs['Color'])
mix=nodes.new('ShaderNodeMixRGB');mix.name='Coat albedo';mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;links.new(hue.outputs['Color'],mix.inputs[1]);links.new(attr.outputs['Color'],mix.inputs[2]);links.new(mix.outputs[0],bs.inputs['Base Color'])
bump=nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.16;bump.inputs['Distance'].default_value=.0012;links.new(tex.outputs['Color'],bump.inputs['Height']);links.new(bump.outputs[0],bs.inputs['Normal'])
# Approximate the game's wrapped fibre lighting: thin hairs transmit light and
# should not cast the opaque black self-shadow of a solid metal ribbon.
hair=coat.copy();hair.name='Fine transmissive fibres';hn=hair.node_tree.nodes;hl=hair.node_tree.links
hb=hn.get('Principled BSDF');hb.inputs['Roughness'].default_value=.96
translucent=hn.new('ShaderNodeBsdfTranslucent');hl.new(hn.get('Coat albedo').outputs[0],translucent.inputs[0])
blend=hn.new('ShaderNodeMixShader');blend.inputs[0].default_value=.35;hl.new(hb.outputs[0],blend.inputs[1]);hl.new(translucent.outputs[0],blend.inputs[2])
lightpath=hn.new('ShaderNodeLightPath');transparent=hn.new('ShaderNodeBsdfTransparent');shadow=hn.new('ShaderNodeMixShader');hl.new(lightpath.outputs['Is Shadow Ray'],shadow.inputs[0]);hl.new(blend.outputs[0],shadow.inputs[1]);hl.new(transparent.outputs[0],shadow.inputs[2]);hl.new(shadow.outputs[0],hn.get('Material Output').inputs['Surface'])
eye,eb,ea=mat('Green cornea',.19)
image=bpy.data.images.new('Iris from runtime formula',256,256);pixels=[]
def smooth(a,b,x):
 t=max(0,min(1,(x-a)/(b-a)));return t*t*(3-2*t)
for j in range(256):
 for i in range(256):
  x,y=(i/255-.5)*2,(j/255-.5)*2;r=math.hypot(x,y);a=math.atan2(y,x)
  iris=.75+.14*math.sin(a*61+r*14)+.08*math.sin(a*113-r*21)
  pupil=1-smooth(.61,.69,math.hypot(x*6.8,y));outer=smooth(.64,1.02,r)*.67
  c=[(.61,.68,.35)[k]*iris*(1-outer)+(.15,.21,.12)[k]*outer for k in range(3)]
  c=[c[k]*(1-pupil)+(.018,.026,.021)[k]*pupil for k in range(3)]
  glint=(1-smooth(.025,.10,math.hypot(x+.27,(y-.34)*1.35)))*.48
  pixels.extend([min(1,v+glint) for v in c]+[1])
image.pixels=pixels;et=eye.node_tree.nodes.new('ShaderNodeTexImage');et.image=image;eye.node_tree.links.new(et.outputs['Color'],eb.inputs['Base Color'])
def aim(ob,at):ob.rotation_euler=(Vector(at)-ob.location).to_track_quat('-Z','Y').to_euler()
for p,power,size in [((-.7,1.5,1.8),110,2.2),((1.3,.0,1.2),75,1.8),((-.4,-1.4,1.1),95,1.4)]:
 bpy.ops.object.light_add(type='AREA',location=p);light=bpy.context.object;light.data.energy=power;light.data.shape='DISK';light.data.size=size;aim(light,(0,0,.35))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.009));floor=bpy.context.object
fm=bpy.data.materials.new('Studio charcoal');fm.diffuse_color=(.115,.135,.155,1);floor.data.materials.append(fm)
bpy.ops.object.camera_add(location=(1.05,1.7,.92));camera=bpy.context.object;scene.camera=camera;camera.data.type='ORTHO';camera.data.ortho_scale=1.15;aim(camera,(0,-.05,.39))
meshes=json.loads(Path('/tmp/emy-review.json').read_text())
only='--first' in sys.argv
for pose in meshes[:1] if only else meshes:
 v=pose['vertices'];ids=pose['indices'];points=[(v[i],v[i+2],v[i+1]) for i in range(0,len(v),16)];tris=[ids[i:i+3] for i in range(0,len(ids),3)]
 mesh=bpy.data.meshes.new('Actual Emy '+pose['mode']);mesh.from_pydata(points,[],tris);mesh.update()
 ob=bpy.data.objects.new('Actual Emy '+pose['mode'],mesh);bpy.context.collection.objects.link(ob)
 for m in [plain,coat,eye,hair]:mesh.materials.append(m)
 colors=mesh.color_attributes.new(name='Coat',type='FLOAT_COLOR',domain='POINT')
 for j in range(len(points)):colors.data[j].color=tuple(max(0,min(1,v[j*16+k]))**2.2 for k in [3,4,5])+(1,)
 uv=mesh.uv_layers.new(name='UVMap')
 for p in mesh.polygons:
  flag=v[p.vertices[0]*16+11];p.material_index=(3 if v[p.vertices[0]*16+12]==65 else 1) if flag==20 else 2 if flag==21 else 0;p.use_smooth=True
  for li in p.loop_indices:
   j=mesh.loops[li].vertex_index;uv.data[li].uv=(v[j*16+9],v[j*16+10])
 mesh.normals_split_custom_set_from_vertices([(v[i+6],v[i+8],v[i+7]) for i in range(0,len(v),16)])
 scene.render.filepath=str(OUTPUT/(pose['mode']+'.png'));bpy.ops.render.render(write_still=True)
 if pose['mode']=='sit':
  camera.location=(0,1.8,.77);camera.data.ortho_scale=.69;aim(camera,(0,.10,.61));scene.render.filepath=str(OUTPUT/'face.png');bpy.ops.render.render(write_still=True)
  camera.location=(1.05,1.7,.92);camera.data.ortho_scale=1.15;aim(camera,(0,-.05,.39))
 bpy.data.objects.remove(ob,do_unlink=True);bpy.data.meshes.remove(mesh)
