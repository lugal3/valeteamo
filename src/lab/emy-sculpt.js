import {EMY_SCULPT} from './assets/emy/sculpt.js';

const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const unit=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
const restCenters=[[0,.31,-.12],[0,.29,-.31],[0,.35,.09],[0,.43,.15],[0,.35,.22]];
export const EMY_SKIN_BONES=['body','pelvis','shoulders','neck','chest'];
const legRest=[];
for(const front of [true,false])for(const side of [-1,1]){
 const key=(front?'front':'hind')+side,hip=[side*.10,front?.36:.31,front?.11:-.30],paw=[side*.105,.030,front?.20:-.34];
 const knee=hip.map((v,k)=>(v+paw[k])*.5);knee[2]+=front?-.035:.07;
 for(const [suffix,a,b] of [['upper',hip,knee],['lower',knee,paw],['paw',paw,paw]]){
  EMY_SKIN_BONES.push(key+'-'+suffix);legRest.push({a,b,key,suffix});
 }
}
function weights(p){
 const [x,y,z]=p;
 const broad=restCenters.map((c,i)=>[i,Math.exp(-(((x-c[0])/.20)**2+((y-c[1])/.16)**2+((z-c[2])/.17)**2))]);
 const sum=broad.reduce((a,b)=>a+b[1],0)||1;
 for(const b of broad)b[1]/=sum;
 let best=0,distance=Infinity;
 const segmentDistance=(a,b)=>{
  const d=b.map((v,k)=>v-a[k]),length=d.reduce((s,v)=>s+v*v,0)||1;
  const t=clamp(p.reduce((s,v,k)=>s+(v-a[k])*d[k],0)/length);
  return p.reduce((s,v,k)=>s+(v-a[k]-d[k]*t)**2,0);
 };
 for(let i=0;i<4;i++){
  const upper=legRest[i*3],lower=legRest[i*3+1];
  const d=Math.min(segmentDistance(upper.a,upper.b),segmentDistance(lower.a,lower.b));
  if(d<distance){distance=d;best=i;}
 }
 const knee=legRest[best*3].b;
 const near=clamp((.11-Math.sqrt(distance))/.07),influence=y<.10?1:clamp((.35-y)/.14)*near*near*(3-2*near);
 for(const b of broad)b[1]*=1-influence;
 const upper=clamp((y-knee[1]+.050)/.10),foot=clamp((.080-y)/.055);
 broad.push([5+best*3,influence*upper*(1-foot)],[6+best*3,influence*(1-upper)*(1-foot)],[7+best*3,influence*foot]);
 broad.sort((a,b)=>b[1]-a[1]);const chosen=broad.slice(0,4),total=chosen.reduce((a,b)=>a+b[1],0)||1;
 return chosen.flatMap(([id,w])=>[id,w/total]);
}
function uvFor(p,head){
 if(head)return [clamp((p[0]/.36+.5)*.5,.006,.494),clamp(.5+(p[1]/.36+.5)*.5,.506,.994)];
 // Use the same long silky mane tile over the torso, without dark rib-like bands.
 // Chest colour blends through vertex tint,
 // so triangles never cross unrelated atlas quadrants.
 return [.012+(Math.atan2(p[0]/.18,(p[2]+.14)/.30)/(Math.PI*2)+.5)*.476,.012+clamp(p[1]/.62)*.476];
}
function coatTint(p,head){
 if(head){const pale=clamp((-p[1]-.035)/.09)*clamp((p[2]+.01)/.12);return [.94+pale*.14,.98+pale*.12,1.01+pale*.10];}
 const pale=clamp((p[2]-.07)/.18)*clamp((.47-p[1])/.13);
 return [.66+pale*.39,.69+pale*.38,.72+pale*.36];
}
export function sculptSurface(spec){
 const head=spec.asset.startsWith('head'),source=EMY_SCULPT[spec.asset],vertices=[],indices=[...source.indices],skin=[];
 for(let i=0;i<source.vertices.length;i+=6){
  const p=source.vertices.slice(i,i+3),n=source.vertices.slice(i+3,i+6),uv=uvFor(p,head),color=coatTint(p,head);
  vertices.push(...p,...color,...n,...uv,20,64,1,0,0);
  if(!head)skin.push(...weights(p));
 }
 if(spec.fibres){
  let seed=941;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const areas=[],src=source.vertices;let area=0;
  for(let i=0;i<source.indices.length;i+=3){
   const [a,b,c]=source.indices.slice(i,i+3).map(n=>n*6),ab=[src[b]-src[a],src[b+1]-src[a+1],src[b+2]-src[a+2]],ac=[src[c]-src[a],src[c+1]-src[a+1],src[c+2]-src[a+2]];
   const flank=!head&&Math.abs((src[a+3]+src[b+3]+src[c+3])/3)>.45&&(src[a+1]+src[b+1]+src[c+1])/3>.18&&(src[a+2]+src[b+2]+src[c+2])/3<.12;
   area+=Math.hypot(ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])*(flank?3.2:1);areas.push(area);
  }
  for(let strand=0;strand<spec.fibres;strand++){
   const pick=rand()*area;let low=0,high=areas.length-1;
   while(low<high){const m=(low+high)>>1;if(areas[m]<pick)low=m+1;else high=m;}
   const ids=source.indices.slice(low*3,low*3+3).map(i=>i*6),a=Math.sqrt(rand()),b=rand(),w=[1-a,a*(1-b),a*b];
   const p=[0,1,2].map(k=>ids.reduce((s,id,i)=>s+src[id+k]*w[i],0)),n=unit([3,4,5].map(k=>ids.reduce((s,id,i)=>s+src[id+k]*w[i],0)));
   const eye=head&&p[2]>.065&&[-1,1].some(side=>((p[0]-side*.065)/.047)**2+((p[1]-.018)/.034)**2<1.32);
   const muzzle=head&&p[2]>.115&&Math.abs(p[0])<.058&&p[1]<-.030;
   if(eye||muzzle)continue; // Clear only the actual eye/mouth apertures.
   const ear=head&&p[1]>.11,cheek=head&&Math.abs(p[0])>.090&&p[1]<.08;
   const forehead=head&&!ear&&!cheek&&p[1]>.030;
   const mane=!head&&p[2]>.09&&p[1]>.23,flank=!head&&Math.abs(n[0])>.4&&p[1]>.18&&p[2]<.12;
   const length=head?(ear?.018:cheek?.030+rand()*.027:forehead?.008+rand()*.012:.014+rand()*.022):
    (flank?.065+rand()*.040:mane?.045+rand()*.040:.030+rand()*.048)*clamp((p[1]-.018)/.10);
   if(length<.003)continue;
   const down=head?[n[0]*(cheek?1.2:.45),cheek?-.55:-1,n[2]*.10]:[n[0]*(flank?.45:.30),-1,flank?-.35:n[2]*.12],dot=down.reduce((a,v,k)=>a+v*n[k],0);
   const flow=unit(down.map((v,k)=>v-n[k]*dot));
   const side=unit([n[1]*flow[2]-n[2]*flow[1],n[2]*flow[0]-n[0]*flow[2],n[0]*flow[1]-n[1]*flow[0]]),width=(flank?.0011:head&&forehead?.00020:.00035)+rand()*(flank?.0007:.00050),uv=uvFor(p,head),tint=coatTint(p,head),shade=1.18+rand()*.26,offset=vertices.length/16;
   const bind=head?null:weights(p);
   for(let row=0;row<4;row++){
    const t=row/3,half=width*(1-t),bend=Math.sin(t*Math.PI)*.003;
    const center=p.map((v,k)=>v+n[k]*(.0008+length*.25*Math.sin(t*Math.PI*.8)+bend)+flow[k]*length*t);
    for(const s of row===3?[0]:[-1,1]){
     const pt=center.map((v,k)=>v+side[k]*half*s);
     vertices.push(...pt,...tint.map(c=>c*shade),...n,uv[0],uv[1]-length*t*.5,20,65,...side);
     if(bind)skin.push(...bind);
    }
   }
   const triangles=[0,1,3,0,3,2,2,3,5,2,5,4,4,5,6];
   for(let j=0;j<triangles.length;j+=3){const tri=triangles.slice(j,j+3).map(i=>i+offset);indices.push(...tri,tri[2],tri[1],tri[0]);}
  }
 }
 return {vertices:new Float32Array(vertices),indices,skin:head?null:new Float32Array(skin),baseCount:source.vertices.length/6,baseIndexCount:source.indices.length};
}
const matrix=(p,rotation,scale,origin,rotate)=>{
 const a=rotate([scale[0],0,0],...rotation),b=rotate([0,scale[1],0],...rotation),c=rotate([0,0,scale[2]],...rotation);
 return [...a,...b,...c,...p.map((v,k)=>v-a[k]*origin[0]-b[k]*origin[1]-c[k]*origin[2])];
};
export function emySkinFrames(l,rotate){
 const centers=[l.body,l.sleep?[-.055,.16,-.27]:l.stretch?[0,.34,-.33]:l.sit?[0,.16,-.26]:restCenters[1],
  l.sleep?[.04,.17,.04]:l.stretch?[0,.20,.19]:l.sit?[0,.40,.06]:restCenters[2],
  l.sleep?[.09,.17,.12]:l.stretch?[0,.22,.26]:l.sit?[0,.49,.12]:restCenters[3],
  l.sleep?[.09,.17,.12]:l.stretch?[0,.18,.26]:l.sit?[0,.40,.12]:restCenters[4]];
 const frames=centers.map((p,i)=>matrix(p,i===0?[l.sleep?.12:l.stretch?.25:l.sit?-.65:0,0,0]:[0,0,0],
  i===0?(l.sleep?[1.1,.78,1.03]:l.stretch?[1,.88,1.22]:[1,1,1]):(l.sleep&&i>2?[.9,.65,.9]:[1,1,1]),restCenters[i],rotate));
 for(const bone of legRest){
  const leg=l.legs[bone.key];
  if(bone.suffix==='paw'){frames.push(matrix(leg.paw,[0,0,0],[1,1,1],bone.a,rotate));continue;}
  const a=bone.suffix==='upper'?leg.hip:leg.knee,b=bone.suffix==='upper'?leg.knee:leg.paw;
  const restDir=bone.b.map((v,k)=>v-bone.a[k]),d=b.map((v,k)=>v-a[k]);
  // B * inverse(A), where each frame aligns its local Y with its segment.
  const frame=dir=>[Math.atan2(dir[2],dir[1]),0,-Math.atan2(dir[0],Math.hypot(dir[1],dir[2]))];
  const rr=frame(restDir),nr=frame(d),R=[rotate([1,0,0],...rr),rotate([0,1,0],...rr),rotate([0,0,1],...rr)],N=[rotate([1,0,0],...nr),rotate([0,Math.hypot(...d)/Math.hypot(...restDir),0],...nr),rotate([0,0,1],...nr)];
  const columns=[0,1,2].map(k=>[0,1,2].map(j=>N.reduce((s,v,i)=>s+v[j]*R[i][k],0)));
  const origin=bone.a.map((v,k)=>(v+bone.b[k])*.5),p=a.map((v,k)=>(v+b[k])*.5);
  frames.push([...columns.flat(),...p.map((v,k)=>v-columns[0][k]*origin[0]-columns[1][k]*origin[1]-columns[2][k]*origin[2])]);
 }
 return frames;
}
