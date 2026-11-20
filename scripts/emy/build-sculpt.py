"""Author Emy's connected coat/head meshes; run with Blender --background --python.

The generated asset is engine-neutral local-space positions, normals and triangles.
No source photographs are embedded. Dimensions are metres (Y up, +Z muzzle).
"""
import bpy, math, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'src/lab/assets/emy/sculpt.js'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def ellipsoid(name, p, size, ends=None):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=28, location=p)
    ob = bpy.context.object
    ob.name = name
    ob.scale = size
    if ends:
        a, b = map(Vector, ends)
        ob.location = (a+b)/2
        ob.rotation_mode = 'QUATERNION'
        ob.rotation_quaternion = (b-a).to_track_quat('Y', 'Z')
        ob.scale.y = (b-a).length*.61
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return ob

def ear(side):
    # Closed curved triangular shell: broad base, concave concha, pointed tip.
    pts = [(side*.045,.065,-.005),(side*.158,.055,-.022),(side*.140,.213,-.035)]
    verts, faces = [], []
    for depth in [-.018,.018]:
        for x,y,z in pts: verts.append((x,y,z+depth))
    faces = [(0,2,1),(3,4,5),(0,1,4,3),(1,2,5,4),(2,0,3,5)]
    mesh=bpy.data.meshes.new('ear-shell');mesh.from_pydata(verts,[],faces);mesh.update()
    ob=bpy.data.objects.new('ear-shell',mesh);bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active=ob;ob.select_set(True)
    bevel=ob.modifiers.new('Soft cartilage rim','BEVEL');bevel.width=.011;bevel.segments=4
    bpy.ops.object.modifier_apply(modifier=bevel.name)
    return ob

def fuse(name, objects, voxel, target):
    bpy.ops.object.select_all(action='DESELECT')
    for ob in objects: ob.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]
    bpy.ops.object.join();ob=bpy.context.object;ob.name=name
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    # Union before smoothing: no intersecting cheek balls or bead-like joints.
    ob.data.remesh_voxel_size=voxel
    bpy.ops.object.voxel_remesh()
    smooth=ob.modifiers.new('Sculpt transition','SMOOTH');smooth.factor=1.2;smooth.iterations=7
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    dec=ob.modifiers.new('Even silhouette budget','DECIMATE');dec.ratio=min(1,target/len(ob.data.vertices))
    bpy.ops.object.modifier_apply(modifier=dec.name)
    tri=ob.modifiers.new('Export triangles','TRIANGULATE');bpy.ops.object.modifier_apply(modifier=tri.name)
    for p in ob.data.polygons:p.use_smooth=True
    ob.data.update()
    return ob

body = [
 ellipsoid('ribcage',(0,.315,-.115),(.143,.154,.278)),
 ellipsoid('haunches',(0,.285,-.305),(.151,.153,.143)),
 ellipsoid('shoulder mantle',(0,.350,.075),(.139,.160,.151)),
 ellipsoid('neck',(0,.423,.155),(.111,.141,.118)),
 ellipsoid('mane',(0,.350,.215),(.140,.176,.110)),
 ellipsoid('belly',(0,.235,-.130),(.117,.093,.212)),
]
for front in [True,False]:
 for side in [-1,1]:
    hip=(side*.10,.36 if front else .31,.11 if front else -.30)
    knee=(side*.102,.195 if front else .17,.12 if front else -.25)
    paw=(side*.105,.030,.20 if front else -.34)
    body += [ellipsoid('limb muscle',(0,0,0),(.041 if front else .065,1,.050 if front else .070),(hip,knee)),
             ellipsoid('carpal coat',(0,0,0),(.034,1,.038),(knee,paw)),
             ellipsoid('foot',paw,(.045,.031,.065))]
body=fuse('Emy connected coat',body,.004,4400)
for v in body.data.vertices:
 x,y,z=v.co
 if z>.15 and y<.35:
    taper=max(.50,min(1,(y-.15)/.20))
    v.co.x*=1-(1-taper)*min(1,(z-.15)/.08)
body.data.update()

head=[ellipsoid('cranial wedge',(0,.005,-.015),(.127,.120,.107)),
      ellipsoid('lower jaw',(0,-.085,.052),(.093,.052,.073)),
      ellipsoid('nasal bridge',(0,-.020,.075),(.045,.074,.065)),
      ellipsoid('muzzle',(0,-.068,.112),(.078,.041,.048)),
      ellipsoid('chin',(0,-.095,.115),(.059,.022,.036))]
for side in [-1,1]:
 head += [ellipsoid('zygomatic cheek',(side*.085,-.033,.012),(.068,.076,.081)),
          ellipsoid('brow',(side*.060,.047,.067),(.055,.018,.028)),ear(side)]
head=fuse('Emy sculpted face and ears',head,.0018,3300)
# Shallow orbital depressions shape the eyelid-to-cheek transition.
for v in head.data.vertices:
 x,y,z=v.co
 if z>.048:
    for side in [-1,1]:
        r=((x-side*.065)/.047)**2+((y-.018-side*(x-side*.065)*.13)/.030)**2
        if r<1.8:v.co.z-=.018*math.exp(-r*2.0)*min(1,(z-.048)/.035)
head.data.update()

def export(ob):
    mesh=ob.data;mesh.calc_loop_triangles()
    data=[]
    for v in mesh.vertices:data.extend(round(c,6) for c in [*v.co,*v.normal])
    # WebGL renderer uses clockwise front faces (authoring normals point outward).
    indices=[i for tri in mesh.loop_triangles for i in reversed(tri.vertices)]
    print(ob.name,len(mesh.vertices),len(indices)//3,flush=True)
    return {'vertices':data,'indices':indices}

def lod(ob,target):
    copy=ob.copy();copy.data=ob.data.copy();bpy.context.collection.objects.link(copy)
    bpy.context.view_layer.objects.active=copy
    dec=copy.modifiers.new('Distant finale actor','DECIMATE');dec.ratio=target/len(copy.data.vertices)
    bpy.ops.object.modifier_apply(modifier=dec.name)
    copy.data.update()
    return copy

OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text('// Generated by scripts/emy/build-sculpt.py; metres, Y up.\nexport const EMY_SCULPT='+json.dumps({'head':export(head),'coat':export(body),'headLow':export(lod(head,1000)),'coatLow':export(lod(body,1900))},separators=(',',':'))+';\n')
print(OUT,flush=True)
