// Localized collar of silver guard hairs. No new polygons, no new weights.
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
export const neckMask=([x,y,z])=>smooth(.255,.365,y)*(1-smooth(.50,.59,y))*smooth(.064,.145,z)*(1-smooth(.155,.205,Math.abs(x)));
export const cheekMask=([x,y,z])=>smooth(.060,.115,Math.abs(x))*(1-smooth(.005,.065,y))*smooth(-.139,-.100,y)*smooth(-.030,.055,z);
export const faceSilver=([x,y,z])=>{
 const ax=Math.abs(x);
 const chin=(1-smooth(.038,.095,ax))*smooth(-.139,-.102,y)*(1-smooth(-.047,-.026,y))*smooth(.075,.13,z);
 const brows=smooth(.025,.05,y)*(1-smooth(.072,.095,y))*smooth(.026,.046,ax)*(1-smooth(.073,.103,ax))*smooth(.065,.11,z);
 return Math.max(chin*.20,brows*.065,cheekMask([x,y,z])*.10);
};
export function refineRuff(part,mesh){
 const head=part.id==='head',coat=part.id==='coat';if(!head&&!coat)return mesh;
 const v=new Float32Array(mesh.vertices),base=mesh.baseCount,mask=head?cheekMask:neckMask;
 // Keep every base position, normal and UV unchanged. The soft silver
 // transitions are vertex tint on top of the original texture atlas.
 for(let i=0;i<base*16;i+=16){
  const p=Array.from(v.subarray(i,i+3)),w=head?faceSilver(p):neckMask(p)*.17;
  if(w>0)for(let k=0;k<3;k++)v[i+3+k]*=1+w*[1,.99,.96][k];
 }
 // Each seven-vertex fibre has two roots, two pairs of mid vertices and tip.
 // Extend only the fibres rooted in the neck / lower side of the face.
 // A low strength and curved profile avoid stiff spikes and preserve skin.
 for(let n=base;n<v.length/16;n+=7){
  const i=n*16,root=[0,1,2].map(k=>(v[i+k]+v[i+16+k])*.5),w=mask(root);
  if(w<=0)continue;
  const tip=(n+6)*16,delta=[0,1,2].map(k=>v[tip+k]-root[k]),length=Math.hypot(...delta);
  for(let j=0;j<7;j++){
   const at=(n+j)*16,t=Math.floor(j/2)/3;
   if(t>0){
    const f=(head?.16:.32)*w*t;
    // Keep row width and roots; move each row together.
    for(let k=0;k<3;k++)v[at+k]+=delta[k]*f;
    v[at+1]-=length*(head?.045:.085)*w*t*t;
   }
   const tint=(head?.12:.20)*w*(.65+.35*t);
   for(let k=0;k<3;k++)v[at+3+k]*=1+tint*[1,.99,.96][k];
  }
 }
 return {...mesh,vertices:v};
}
