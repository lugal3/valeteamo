// Exact runtime geometry exports for review; static snapshots, NOT replacement rigs.
import fs from 'node:fs';
import path from 'node:path';
import {installUpstairsEmy,poseEmy} from '../../src/lab/emy-cat.js';
import {emySurface,writeEmySurface} from '../../src/lab/emy-surface.js';
import {EMY_SCULPT} from '../../src/lab/assets/emy/sculpt.js';
import {EMY_FACE_CANDIDATE} from '../../src/lab/assets/emy/face-candidate.js';
const out=path.resolve(process.argv[2]||'output/emy-face-baseline');fs.mkdirSync(out,{recursive:true});
function obj(name,m){
 let lines=['# Y up; +Z muzzle; metres; local head coordinates'];
 for(let i=0;i<m.vertices.length;i+=6)lines.push('v '+m.vertices.slice(i,i+3).join(' '));
 for(let i=0;i<m.vertices.length;i+=6)lines.push('vn '+m.vertices.slice(i+3,i+6).join(' '));
 for(let i=0;i<m.indices.length;i+=3)lines.push('f '+m.indices.slice(i,i+3).reverse().map(v=>(v+1)+'//'+(v+1)).join(' '));
 fs.writeFileSync(path.join(out,name+'.obj'),lines.join('\n')+'\n');
}
for(const id of ['head','headLow']){obj('original-'+id,EMY_SCULPT[id]);obj('candidate-'+id,EMY_FACE_CANDIDATE[id]);}
const cat=installUpstairsEmy((id,x,y,z,w,h,d,material,solid,extra)=>({id,x,y,z,w,h,d,material,solid,...extra}),0);
Object.assign(cat,{x:0,y:0,z:0,yaw:0,age:.7});
function glb(mode){
 poseEmy(cat,{mode,phase:.7,reduced:true});
 const json={asset:{version:'2.0',generator:'ValeTeAmo runtime review exporter'},scene:0,scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[{name:'Vertex colour preview',pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:.85},doubleSided:true},{name:'Coat atlas',pbrMetallicRoughness:{baseColorTexture:{index:0},metallicFactor:0,roughnessFactor:.85},doubleSided:true},{name:'Iris preview',pbrMetallicRoughness:{metallicFactor:0,roughnessFactor:.35},doubleSided:true}],textures:[{source:0}],images:[],buffers:[],bufferViews:[],accessors:[]};
 const chunks=[];let offset=0;
 function view(buf,target){const pad=(4-buf.length%4)%4,idx=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:offset,byteLength:buf.length,...(target?{target}:{})});chunks.push(buf,Buffer.alloc(pad));offset+=buf.length+pad;return idx;}
 function accessor(array,type,componentType,target,bounds=false){const width={SCALAR:1,VEC2:2,VEC3:3}[type],acc={bufferView:view(Buffer.from(array.buffer,array.byteOffset,array.byteLength),target),componentType,count:array.length/width,type};if(bounds){acc.min=Array(width).fill(Infinity);acc.max=Array(width).fill(-Infinity);for(let i=0;i<array.length;i++){const k=i%width;acc.min[k]=Math.min(acc.min[k],array[i]);acc.max[k]=Math.max(acc.max[k],array[i]);}}json.accessors.push(acc);return json.accessors.length-1;}
 let count=0,tris=0;
 for(const {id,box} of cat.parts){
  const m=box.emyTailMesh||emySurface(box),v=new Float32Array(m.vertices.length);writeEmySurface(v,0,box);
  const n=v.length/16,positions=new Float32Array(n*3),normals=new Float32Array(n*3),colors=new Float32Array(n*3),uv=new Float32Array(n*2);
  for(let j=0;j<n;j++){const i=j*16;positions.set(v.subarray(i,i+3),j*3);normals.set(v.subarray(i+6,i+9),j*3);let c=Array.from(v.subarray(i+3,i+6));if(v[i+11]===21){const X=(v[i+9]-.5)*2,Y=(v[i+10]-.5)*2;if(Math.hypot(X*6.8,Y)<.64)c=[.018,.026,.021];}colors.set(c.map(x=>Math.min(1,Math.max(0,x))**2.2),j*3);uv.set([v[i+9],1-v[i+10]],j*2);}
  const idx=Uint32Array.from(m.indices);for(let i=0;i<idx.length;i+=3){const t=idx[i];idx[i]=idx[i+2];idx[i+2]=t;}
  const attrs={POSITION:accessor(positions,'VEC3',5126,34962,true),NORMAL:accessor(normals,'VEC3',5126,34962),COLOR_0:accessor(colors,'VEC3',5126,34962),TEXCOORD_0:accessor(uv,'VEC2',5126,34962)};
  const mesh={name:id,primitives:[{attributes:attrs,indices:accessor(idx,'SCALAR',5125,34963),material:v[11]===20?1:v[11]===21?2:0}]};json.meshes.push(mesh);json.nodes.push({name:id,mesh:json.meshes.length-1});json.scenes[0].nodes.push(json.nodes.length-1);count+=n;tris+=idx.length/3;
 }
 const atlas=fs.readFileSync(new URL('../../src/lab/assets/emy/coat-v2.jpg',import.meta.url));json.images.push({bufferView:view(atlas),mimeType:'image/jpeg'});json.buffers.push({byteLength:offset});
 const j=Buffer.from(JSON.stringify(json)),jpad=Buffer.alloc((4-j.length%4)%4,32),bin=Buffer.concat(chunks),header=Buffer.alloc(12),jh=Buffer.alloc(8),bh=Buffer.alloc(8);header.write('glTF');header.writeUInt32LE(2,4);header.writeUInt32LE(12+8+j.length+jpad.length+8+bin.length,8);jh.writeUInt32LE(j.length+jpad.length);jh.write('JSON',4);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
 fs.writeFileSync(path.join(out,'emy-original-'+mode+'.glb'),Buffer.concat([header,jh,j,jpad,bh,bin]));return {mode,vertices:count,triangles:tris};
}
const report=['idle','sit','alert'].map(glb);fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({note:'Static runtime snapshots with original vertex positions, normals and atlas; iris/material lighting approximate; no glTF skin or animation tracks. Edit local head OBJ, not this posed snapshot.',report},null,2));console.log(JSON.stringify(report));
