// The capture uses the same head dimensions and features as the patrol model.
// Split its front shell into fitted pieces so the seams only open under load.
const round={shape:'round',smooth:true,segments:18,rings:12};
const SKIN=5,FLESH=6,IRIS=8,ENAMEL=9;
const TOOTH=13,TENDON=14,SALIVA=15;
const tau=Math.PI*2;
const difference=(a,b)=>a.map((n,i)=>n-b[i]);
const magnitude=v=>Math.hypot(...v)||1;
const unit=v=>{const length=magnitude(v);return v.map(n=>n/length);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
const poly=(id,joint,triangles,color,faceMaterial,extra)=>({id,joint,triangles,color,faceMaterial,...extra});
const solid=(id,joint,x,y,z,w,h,d,color,faceMaterial,extra)=>({id,joint,x,y,z,w,h,d,color,faceMaterial,...round,...extra});

function ribbon(rows,reverse=false){
 const triangles=[];
 for(let r=1;r<rows.length;r++)for(let i=1;i<rows[r].length;i++){
  const a=rows[r-1][i-1],b=rows[r][i-1],c=rows[r][i],d=rows[r-1][i];
  if(reverse)triangles.push([a,c,b],[a,d,c]);
  else triangles.push([a,b,c],[a,c,d]);
 }
 return triangles;
}

function tube(points,radii,sides=11,{aspect=1,roughness=0,phase=0}={}){
 const rings=points.map((point,i)=>{
  const first=Math.max(0,i-1),last=Math.min(i+1,points.length-1),span=difference(points[last],points[first]);
  const tangent=unit(span),slope=(radii[last]-radii[first])/magnitude(span);
  const axis=unit(cross(Math.abs(tangent[2])>.88?[0,1,0]:[0,0,1],tangent));
  const binormal=cross(tangent,axis);
  const t=i/(points.length-1);
  return Array.from({length:sides+1},(_,k)=>{
   const theta=k/sides*tau,c=Math.cos(theta),s=Math.sin(theta);
   const relief=1+roughness*(Math.sin(theta*3+phase+t*4.2)+.42*Math.sin(theta*5-phase+t*9.1));
   const vertex=point.map((n,j)=>n+radii[i]*relief*(axis[j]*c+binormal[j]*s*aspect));
   vertex.normal=unit(axis.map((n,j)=>n*c+binormal[j]*s/aspect-tangent[j]*slope));
   vertex.tangent=axis.map((n,j)=>-n*s+binormal[j]*c);
   vertex.uv=[k/sides,t];
   return vertex;
  });
 });
 return ribbon(rings,true);
}

// The seams are defined on the face itself and shared by adjacent plates.
const front=([,,z])=>z-.012;
const lip=([x,y])=>y-(1.618+.070*Math.abs(x)+.009*Math.sin(x*84)+.003*Math.sin(x*193));
const split=([x,y])=>x-(.018+.22*(y-1.72)+.014*Math.sin((y-1.6)*71)+.006*Math.sin((y-1.6)*167));
const inverse=fn=>point=>-fn(point);

function clip(polygon,seam){
 const result=[];
 for(let i=0;i<polygon.length;i++){
  const a=polygon[i],b=polygon[(i+1)%polygon.length],d=seam(a),e=seam(b);
  if(d>=0)result.push(a);
  if((d<0)!==(e<0))result.push(mix(a,b,d/(d-e)));
 }
 return result;
}

function fractureShell(face){
 const {x,y,z,w,h,d,color}=face;
 const shell=Array.from({length:25},(_,row)=>{
  const lat=Math.PI*(.5-row/24);
  return Array.from({length:49},(_,col)=>{
   const az=tau*col/48,cl=Math.cos(lat);
   return [x+w*.5*cl*Math.sin(az),y+h*.5*Math.sin(lat),z+d*.5*cl*Math.cos(az)];
  });
 });
 const triangles=ribbon(shell);
 const inset=p=>mix(p,[x,y,z],.072);
 const normalAt=p=>unit([(p[0]-x)/(w*w),(p[1]-y)/(h*h),(p[2]-z)/(d*d)]);
 return [
  ['head',[inverse(front)]],
  ['face-left',[front,lip,inverse(split)]],
  ['face-right',[front,lip,split]],
  ['face-jaw-skin',[front,inverse(lip)]]
 ].flatMap(([joint,cuts])=>{
  const outside=[],rim=[];
  for(const triangle of triangles){
   const section=cuts.reduce(clip,triangle);
   for(let n=1;n<section.length-1;n++)outside.push([section[0],section[n],section[n+1]]);
   if(joint==='head')continue;
   for(let n=0;n<section.length;n++){
    const a=section[n],b=section[(n+1)%section.length];
    // Cut vertices lie on the linear interpolant through each source triangle.
    if(cuts.some(cut=>Math.abs(cut(a))<.0022&&Math.abs(cut(b))<.0022)){
     rim.push([a,inset(b),b],[a,inset(a),inset(b)]);
    }
   }
  }
  return [
   poly('shell-skin-'+joint,joint,outside,color,SKIN,{normalAt,facetTint:.035}),
   poly('shell-rim-'+joint,joint,rim,[.24,.048,.048],FLESH,{facetTint:.23})
  ].filter(part=>part.triangles.length);
 });
}

export function captureShell(parts){
 return parts.flatMap(part=>{
  if(part.id==='face')return fractureShell(part);
  if(part.joint!=='head')return part;
  const {id}=part;
  let joint='head',faceMaterial=SKIN;
  if(id==='jaw'||id==='chin'||id==='mouth')joint='face-jaw-skin';
  if(id.startsWith('nose'))joint='face-nose';
  if(/^(eye|iris|pupil|brow|cheek)/.test(id)){
   const side=id.endsWith('-1')?-1:1;
   joint=side<0?'face-left':'face-right';
   if(/^(eye-white|iris|pupil)/.test(id))joint='face-skin-eye'+side;
   else if(side<0)joint='face-receding-skin';
   if(id.startsWith('eye-white'))faceMaterial=ENAMEL;
  }
  if(id.startsWith('hair')||id.startsWith('temple')||id.startsWith('brow'))faceMaterial=10;
  return {...part,joint,faceMaterial};
 });
}

function muscles(pieces){
 for(const side of [-1,1]){
  for(let i=0;i<7;i++){
   const t=i/6,x=side*(.059+t*.065),phase=i*2.39+side;
   const root=[x*.57,1.814-t*.025,.104-t*.027];
   const points=[root,[x*.86,1.794-t*.046,.126+.006*Math.sin(phase)-t*.021],
    [x*1.19,1.748-t*.039,.136-t*.046],
    [x*1.29,1.690+t*.007,.108+t*.019],[x*1.13,1.610+t*.027,.100-t*.007]];
   const width=.008+.007*Math.cos(phase)**2;
   pieces.push(poly('cranial-muscle'+side+i,'head',
    tube(points,[.002,width*.76,width,width*.67,.0016],12,{aspect:.71,roughness:.14,phase}),
    [.21+t*.12,.053+t*.041,.070+t*.029],TENDON));
  }
  for(let i=0;i<8;i++){
   const t=i/7,phase=i*2.41+side;
   const root=[side*(.100+t*.044),1.650+t*.047,.082+t*.020];
   const tip=[side*(.068+t*.054),1.568-t*.017,.153-t*.061];
   const outer=mix(root,tip,.37),inner=mix(root,tip,.67);
   outer[0]+=side*(.025+.009*Math.sin(phase));outer[2]+=.010+.012*Math.cos(phase);
   inner[0]+=side*(.015+.011*Math.cos(phase));inner[2]+=.027-.020*t;
   const width=.004+.005*Math.cos(phase)**2;
   pieces.push(poly('jaw-ligament'+side+i,'head',
    tube([root,outer,inner,tip],[width*.63,width,width*.81,width*.64],11,{aspect:.63,roughness:.17,phase}),
    [.22+t*.13,.063+t*.055,.079+t*.049],TENDON,{flex:{joint:'face-jaw',anchor:root,axis:difference(tip,root)}}));
  }
  for(let i=0;i<7;i++){
   const t=i/6,phase=i*2.25+side;
   const root=[side*(.058+t*.062),1.767-t*.105,.107-.020*t];
   const tip=[side*(.027+t*.086),1.795-t*.138,.161-.037*t];
   const outer=mix(root,tip,.36),inner=mix(root,tip,.73);
   outer[1]-=.006+.008*Math.cos(phase);inner[2]+=.012*Math.sin(phase);
   pieces.push(poly('split-fibre'+side+i,'head',
    tube([root,outer,inner,tip],[.0017,.0028+.0012*Math.cos(phase)**2,.0018,.0011],7,{roughness:.17,phase}),
    [.30+t*.09,.093+t*.051,.101+t*.035],TENDON,
    {flex:{joint:side<0?'face-left':'face-right',anchor:root,axis:difference(tip,root)}}));
  }
 }
}

function fang(pieces,{joint,dir,i,root,length,width,buried=false}){
 const phase=(i+dir*.27)*2.28,lean=.009*Math.sin(phase);
 const taper=[1.03,1,.87,.72,.52,.29,.045];
 const points=taper.map((_,n)=>{
  const t=n/(taper.length-1),bow=4*t*(1-t);
  return [root[0]+lean*(t*t+.17*bow),root[1]+dir*length*t,root[2]+.009*bow-.008*t*t];
 });
 // Some crowns have a blunt, oblique chip instead of an intact point.
 if(i%5===2){
  taper[taper.length-1]=.15;
  points.at(-1)[1]-=dir*length*.083;
  points.at(-1)[0]+=.0018;
 }
 pieces.push(poly('fang'+dir+'-'+i+(buried?'-inner':''),joint,
  tube(points,taper.map(n=>n*width),12,{aspect:.72,roughness:.10,phase}),
  buried?[.39,.32,.26]:[.69,.62,.48],TOOTH,{
   facetTint:.035,vertexColor:(p,col)=>{
    const tip=Math.min(1,Math.abs(p[1]-root[1])/length);
    const stain=.64+.24*tip+.17*Math.sin(tip*Math.PI)+.13*Math.sin(phase);
    const rootTint=(1-tip)**4;
    return col.map((n,k)=>n*stain+rootTint*(k===0?.069:k===2?-.021:0));
   }
  }));
}

function dentition(pieces,upper){
 const joint=upper?'face-gullet-upper':'face-gullet-lower',dir=upper?-1:1;
 const gum=[];
 for(let i=0;i<17;i++){
  const x=(i-8)*.0154,arc=(x/.132)**2;
  const y=upper?1.645-.043*arc:1.582+.018*arc;
  const z=(upper?.171:.179)-.079*arc;
  gum.push([x,y,z-.011]);
  const length=(upper?.036:.030)+.020*Math.abs(Math.sin(i*1.83+(upper?0:.9)))-.015*arc;
  const width=.0049+.0025*Math.abs(Math.cos(i*1.67));
  fang(pieces,{joint,dir,i,root:[x,y,z],length,width});
  pieces.push(solid('receding-gum'+dir+'-'+i,joint,x,y-dir*.004,z-.005,width*2.18,.016,.018,
   [.20+.07*Math.sin(i*2.03)**2,.037,.052],FLESH,{segments:8,rings:5}));
  if(i%2===0&&i>1&&i<15)fang(pieces,{joint,dir,i,root:[x+.006,y-dir*.006,z-.036],
   length:length*.69,width:width*.64,buried:true});
 }
 pieces.push(poly('gumline'+dir,joint,tube(gum,gum.map((_,i)=>.010+.003*Math.sin(i*.54)**2),11),
  upper?[.235,.036,.048]:[.203,.030,.045],FLESH));
}

export function pursuerInterior(){
 const pieces=[
  solid('inner-head','head',0,1.718,.013,.292,.291,.203,[.137,.033,.041],FLESH),
  solid('clivus','head',-.026,1.753,.089,.112,.134,.067,[.203,.049,.049],FLESH,{roll:.14}),
  solid('throat-recess','face-gullet-upper',0,1.563,.083,.246,.199,.109,[.072,.014,.023],11),
  solid('soft-palate','face-palate',0,1.627,.125,.197,.053,.100,[.125,.034,.050],FLESH),
  solid('underjaw','face-jaw',0,1.564,.086,.224,.067,.173,[.13,.023,.039],FLESH),
  solid('tongue','face-tongue',-.009,1.587,.135,.097,.026,.095,[.255,.050,.078],FLESH,{roll:.095}),
  solid('orbit-tissue','head',-.078,1.723,.103,.105,.092,.061,[.23,.039,.054],FLESH),
  solid('exposed-eye','face-eye',-.078,1.731,.127,.059,.050,.063,[.45,.39,.30],ENAMEL),
  solid('exposed-iris','face-eye',-.081,1.730,.155,.031,.030,.014,[.148,.40,.323],IRIS),
  solid('exposed-pupil','face-eye',-.081,1.730,.163,.014,.017,.005,[.026,.018,.020],11),
  solid('exposed-catchlight','face-eye',-.086,1.738,.164,.005,.005,.003,[.78,.86,.76],IRIS)
 ];
 const lids=[
  [[-.127,1.725,.122],[-.111,1.752,.130],[-.080,1.767,.142],[-.054,1.753,.142],[-.045,1.733,.127]],
  [[-.127,1.721,.122],[-.112,1.702,.131],[-.091,1.687,.144],[-.058,1.700,.139],[-.047,1.724,.125]]
 ];
 for(const [i,points] of lids.entries()){
  pieces.push(poly('torn-eyelid'+i,'head',tube(points,[.004,.009,.010,.008,.003],11),[.31,.058,.079],FLESH));
 }
 muscles(pieces);
 dentition(pieces,true);
 dentition(pieces,false);
 for(const [i,x] of [-.108,-.092,-.073,.062,.085,.105].entries()){
  const root=[x,1.636-.021*Math.abs(x)/.105,.148],
   tip=[x*.91,1.577+.013*Math.abs(x)/.105,.147],
   middle=mix(root,tip,.58);
  middle[0]+=.009*Math.sin(i*3.4);middle[2]+=.009;
  pieces.push(poly('saliva'+i,'face-gullet-upper',tube([root,middle,tip],[.0016,.0006,.0013],7),
   [.22,.112,.108],SALIVA,{flex:{joint:'face-gullet-lower',anchor:root,axis:difference(tip,root)}}));
 }
 return pieces;
}

export const FACE_PARENTS={
 'face-left':'head','face-right':'head','face-jaw':'head','face-eye':'head',
 'face-skin-eye-1':'face-left','face-skin-eye1':'face-right','face-nose':'face-left',
 'face-receding-skin':'face-left','face-jaw-skin':'face-jaw',
 'face-gullet-upper':'head','face-gullet-lower':'face-jaw',
 'face-palate':'face-gullet-upper','face-tongue':'face-gullet-lower'
};

export function pursuerFacePose(joints,face){
 const {left,right,jaw,twitch,glance,bite,pressure=0}=face;
 joints['face-left']={px:-.153,py:1.735,pz:.025,x:-.044*left,y:.039*left,z:-.020*left,
  yaw:-1.02*left,pitch:-.25*left,roll:.30*left};
 joints['face-right']={px:.141,py:1.778,pz:.04,x:.019*right,y:.024*right,z:-.047*right,
  yaw:.63*right,pitch:-.20*right,roll:-.20*right};
 joints['face-jaw']={py:1.638,pz:.041,y:-.043*jaw,z:.034*jaw,pitch:(.70+twitch*.047)*jaw,
  roll:(.052+twitch*.021)*jaw};
 const shed=1-(1-jaw)**3;
 joints['face-jaw-skin']={py:1.521,pz:.079,y:-.037*shed,z:-.055*shed,pitch:.30*shed,scale:1-.72*shed};
 joints['face-nose']={py:1.675,pz:.180,z:-.072*left,scale:Math.max(.016,1-left*1.55)};
 joints['face-receding-skin']={px:-.080,py:1.717,pz:.137,scale:Math.max(.12,1-left*1.25),z:-.033*left};
 const throat=Math.min(1,Math.max(0,(jaw-.14)/.62));
 joints['face-gullet-upper']={z:-.077*(1-throat),y:.014*(1-throat)};
 joints['face-gullet-lower']={z:-.077*(1-throat),y:-.022*(1-throat)};
 joints['face-palate']={py:1.627,pz:.125,scale:1+pressure*.11+jaw*.043,y:-.008*pressure};
 joints['face-tongue']={py:1.588,pz:.135,y:jaw*.009,z:(pressure-.4*bite)*.021,
  roll:twitch*.14,pitch:jaw*.16};
 joints['face-eye']={px:-.078,py:1.731,pz:.127,yaw:glance*.28,pitch:twitch*.105,z:.010*left};
 joints['face-skin-eye-1']={px:-.073,py:1.716,pz:.169,scale:Math.max(.003,1-left*3.4),z:-.022*left};
 joints['face-skin-eye1']={px:.073,py:1.716,pz:.169,yaw:-.22*glance,scale:Math.max(.26,1-.27*right-.49*bite),z:-.018*bite};
}
