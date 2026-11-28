// Phase 4: localized facial refinement, not a global scale.
// Mouth, nose and whisker attachment points are deliberately preserved.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const norm=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function muzzlePoint(p){
 const [x,y,z]=p,ax=Math.abs(x);
 // Taper lateral muzzle pads, soften lower jaw. Do not retreat the
 // central mouth plane or the upper nasal bridge. Preserve ear/neck.
 const side=smooth(.025,.052,ax)*(1-smooth(.073,.098,ax));
 const region=smooth(-.123,-.087,y)*(1-smooth(-.045,-.018,y))*smooth(.058,.102,z);
 const rootGuard=1-.90*Math.exp(-(((ax-.055)/.014)**2+((z-.154)/.019)**2+((y+.066)/.028)**2));
 const pad=side*region*rootGuard;
 const chin=(1-smooth(.027,.064,ax))*smooth(-.133,-.113,y)*(1-smooth(-.105,-.083,y))*smooth(.072,.115,z);
 return [x-Math.sign(x)*.005*pad,y+.004*chin,z-.010*pad-.003*chin];
}
export function refineMuzzle(source){
 const vertices=source.vertices.slice(),step=.00001;
 for(let i=0;i<vertices.length;i+=6){
  const p=source.vertices.slice(i,i+3),n=source.vertices.slice(i+3,i+6),q=muzzlePoint(p);
  if(q.every((v,k)=>v===p[k]))continue;
  const J=[0,1,2].map(k=>{const a=p.slice(),b=p.slice();a[k]+=step;b[k]-=step;const A=muzzlePoint(a),B=muzzlePoint(b);return A.map((v,j)=>(v-B[j])/(2*step));});
  const cof=[cross(J[1],J[2]),cross(J[2],J[0]),cross(J[0],J[1])],det=J[0].reduce((a,v,k)=>a+v*cof[0][k],0);
  if(det<.35)throw Error('Muzzle mapping folded');
  const normal=norm([0,1,2].map(k=>cof.reduce((a,c,j)=>a+c[k]*n[j]/det,0)));
  for(let k=0;k<3;k++){vertices[i+k]=q[k];vertices[i+3+k]=normal[k];}
 }
 return {vertices,indices:source.indices};
}
export function refineNose(part,mesh){
 if(part.id!=='nose'&&!part.id.startsWith('nostril'))return mesh;
 const vertices=new Float32Array(mesh.vertices),nose=part.id==='nose';
 // Preserve nose footprint at nostril attachments; soften tip only.
 for(let i=0;i<vertices.length;i+=16){
  if(nose){
   const y=vertices[i+1],t=smooth(-.011,.012,y),scale=1-.08*t;
   vertices[i]*=scale;
   // Exact inverse transpose for this x-only deformation.
   const d=(y>-.011&&y<.012)?-.08*6*((y+.011)/.023)*(1-(y+.011)/.023)/.023:0;
   const n=norm([vertices[i+6]/scale,vertices[i+7]-d*vertices[i]/scale*vertices[i+6]/scale,vertices[i+8]]);
   vertices.set(n,i+6);
   const shade=Math.max(.78,vertices[i+3]/.68);
   vertices.set([.74*shade,.46*shade,.40*shade],i+3);
  }else vertices.set([.29,.19,.18],i+3);
 }
 return {...mesh,vertices};
}
// Subtle silver muzzle tint, sampled from existing atlas; not a white bib.
export function tintMuzzle(mesh){
 const v=new Float32Array(mesh.vertices);
 for(let i=0;i<v.length;i+=16){
  const ax=Math.abs(v[i]),y=v[i+1],z=v[i+2];
  const pale=(1-smooth(.045,.087,ax))*smooth(-.13,-.09,y)*(1-smooth(-.062,-.032,y))*smooth(.063,.12,z);
  for(let k=0;k<3;k++)v[i+3+k]*=1+pale*[.10,.095,.085][k];
 }
 return {...mesh,vertices:v};
}
