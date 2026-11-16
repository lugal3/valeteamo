// Phase C: preserve the approved photo on the front; smoothly sample only
// feature-free cheek pixels on profile/rear and blend the lower jaw to skin.
const assert=require('node:assert/strict');
(async()=>{
 const {loisPhotoFaceUV}=await import('../src/lab/lois-ps2-face.js');
 const {buildLoisPs2Model}=await import('../src/lab/lois-ps2-model.js');
 const {geometry}=await import('../src/lab/renderer.js');
 const make=(id,x,y,z,w,h,d,mat,p={})=>({id,x,y,z,w,h,d,mat,...p,dynamic:true,solid:false});
 const face=buildLoisPs2Model(make).find(p=>p.shape==='lois-face');
 const src=(u,v)=>[110+650*u,850*(1-v)];
 const front=src(...loisPhotoFaceUV(0,1.656,1));
 assert(Math.abs(front[0]-450)<1e-6&&Math.abs(front[1]-470)<1e-6,
  'frontal photograph stays at exactly the approved source pixels');
 const side=src(...loisPhotoFaceUV(.15,1.656,0));
 assert(side[0]>=580&&side[0]<=600&&side[1]>=535&&side[1]<=585,
  'right profile uses clean cheek skin, never an eye or nostril');
 const left=src(...loisPhotoFaceUV(-.15,1.656,0));
 assert(left[0]>=300&&left[0]<=320&&left[1]>=535&&left[1]<=585,
  'left profile samples its own real cheek, rather than the opposite cheek');
 const back=src(...loisPhotoFaceUV(0,1.656,-1));
 assert(Math.abs(back[0]-590)<1e-6&&Math.abs(back[1]-555)<1e-6,
  'rear skull remains feature-free and seamless at x=0');
 const chin=src(...loisPhotoFaceUV(0,1.44,0));
 assert(Math.abs(chin[0]-590)<18&&chin[1]>=525&&chin[1]<=585,
  'underside-facing chin samples cheek skin, not a stretched beard');
 const frontChin=src(...loisPhotoFaceUV(0,1.44,1));
 assert(Math.abs(frontChin[0]-450)<1e-6&&
  Math.abs(frontChin[1]-(470-(1.44-1.656)*1327))<1e-5,
  'frontal chin must preserve its photo; no artificial extra mouth line');
 const mouth=src(...loisPhotoFaceUV(0,1.520,1));
 assert(Math.abs(mouth[0]-450)<1e-6&&Math.abs(mouth[1]-(470-(1.520-1.656)*1327))<1e-5,
  'mouth remains sharp and matches original photographic expression');
 for(const y of [1.44,1.5,1.55,1.62,1.7,1.82]){
  for(const x of [-.19,-.11,0,.11,.19]){
   let last=null;
   for(let i=0;i<=100;i++){
    const z=-1+i*.02,uv=loisPhotoFaceUV(x,y,z);
    assert(uv.every(v=>Number.isFinite(v)&&v>=0&&v<=1),
     'valid atlas UV for all profile angles');
    if(last)assert(Math.max(...uv.map((v,k)=>Math.abs(v-last[k])))<.015,
     'UV transition must have no sudden color seams as face turns');
    last=uv;
   }
  }
 }
 const full=geometry(buildLoisPs2Model(make));
 assert(full.indices.length/3<=3500,'Phase C does not raise mobile triangle count');
 const range=full.ranges[buildLoisPs2Model(make).findIndex(x=>x.shape==='lois-face')];
 assert(range.end>range.start);
 console.log('PASS FACE UV PHASE C',JSON.stringify({
  front:front.map(v=>Number(v.toFixed(1))),
  side:side.map(v=>Number(v.toFixed(1))),
  left:left.map(v=>Number(v.toFixed(1))),
  rear:back.map(v=>Number(v.toFixed(1))),
  chin:chin.map(v=>Number(v.toFixed(1))),
  tris:full.indices.length/3
 }));
})().catch(e=>{console.error(e);process.exitCode=1;});
