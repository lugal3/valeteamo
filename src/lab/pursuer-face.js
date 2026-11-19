// The capture uses the same head dimensions and features as the patrol model.
// Split its front shell into fitted pieces so the seams only open under load.
const round={shape:'round',smooth:true,segments:18,rings:12};
const SKIN=5,FLESH=6,IRIS=8,ENAMEL=9;
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

function tube(points,radii,sides=11){
 const rings=points.map((point,i)=>{
  const tangent=unit(difference(points[Math.min(i+1,points.length-1)],points[Math.max(0,i-1)]));
  const axis=unit(cross(Math.abs(tangent[2])>.88?[0,1,0]:[0,0,1],tangent));
  const binormal=cross(tangent,axis);
  return Array.from({length:sides+1},(_,k)=>{
   const theta=k/sides*tau;
   const normal=axis.map((v,j)=>v*Math.cos(theta)+binormal[j]*Math.sin(theta));
   const vertex=point.map((n,j)=>n+radii[i]*normal[j]);
   vertex.normal=normal;
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
  for(let i=0;i<6;i++){
   const t=i/5,x=side*(.073+t*.055);
   const root=[x*.63,1.812-t*.031,.101-t*.021];
   const points=[root,[x*.91,1.786-t*.070,.137-t*.035],
    [x*1.26,1.668+t*.038,.119-t*.031],[x*1.12,1.605+t*.034,.104-t*.007]];
   pieces.push(poly('cranial-muscle'+side+i,'head',tube(points,[.002,.012,.010,.002]),
    [.24+t*.14,.042+t*.03,.052+t*.028],FLESH));
  }
  for(let i=0;i<6;i++){
   const t=i/5;
   const root=[side*(.102+t*.048),1.651+t*.032,.084+t*.018];
   const tip=[side*(.075+t*.038),1.568-t*.012,.151-t*.058];
   const bend=mix(root,tip,.54);bend[0]+=side*.023;bend[2]+=.015;
   pieces.push(poly('jaw-ligament'+side+i,'head',tube([root,bend,tip],[.006,.006+t*.004,.004]),
    [.26+t*.14,.048+t*.043,.060+t*.027],FLESH,{flex:{joint:'face-jaw',anchor:root,axis:difference(tip,root)}}));
  }
  for(let i=0;i<4;i++){
   const root=[side*(.080+i*.016),1.759-i*.033,.101-.010*i];
   const tip=[side*(.038+i*.022),1.790-i*.042,.160-.012*i];
   const bend=mix(root,tip,.55);bend[1]-=.006;
   pieces.push(poly('split-fibre'+side+i,'head',tube([root,bend,tip],[.0018,.0033,.0015],7),
    [.35,.097+i*.018,.092],FLESH,{flex:{joint:side<0?'face-left':'face-right',anchor:root,axis:difference(tip,root)}}));
  }
 }
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
  const lean=.006*Math.sin(i*1.44);
  const points=[[x,y+dir*.001,z],[x+lean*.29,y+dir*length*.30,z+.007],[x+lean*.65,y+dir*length*.68,z+.006],[x+lean,y+dir*length,z-.002]];
  pieces.push(poly('fang'+dir+'-'+i,joint,tube(points,[width,width*.86,width*.46,.0005],8),
   [.64,.60,.49],ENAMEL,{
    facetTint:.11,vertexColor:(p,col)=>{
     const stain=.48+.46*Math.min(1,Math.abs(p[1]-y)/length)+.10*Math.sin(i*2.22);
     return col.map((n,k)=>n*stain+(k===0?.055:0));
    }
   }));
 }
 pieces.push(poly('gumline'+dir,joint,tube(gum,gum.map((_,i)=>.010+.003*Math.sin(i*.54)**2),11),
  upper?[.235,.036,.048]:[.203,.030,.045],FLESH));
}

export function pursuerInterior(){
 const pieces=[
  solid('inner-head','head',0,1.718,.013,.292,.291,.203,[.137,.033,.041],FLESH),
  solid('clivus','head',-.026,1.753,.089,.112,.134,.067,[.203,.049,.049],FLESH,{roll:.14}),
  solid('throat-recess','face-gullet-upper',0,1.563,.105,.246,.199,.119,[.035,.006,.015],11),
  solid('soft-palate','face-gullet-upper',0,1.627,.128,.197,.053,.101,[.104,.021,.034],FLESH),
  solid('underjaw','face-jaw',0,1.564,.086,.224,.067,.173,[.13,.023,.039],FLESH),
  solid('tongue','face-gullet-lower',-.009,1.587,.137,.097,.026,.095,[.277,.050,.072],FLESH,{roll:.095}),
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
 for(const [i,x] of [-.103,-.073,.058,.105].entries()){
  const root=[x,1.636-.021*Math.abs(x)/.105,.148],
   tip=[x*.91,1.577+.013*Math.abs(x)/.105,.147],
   middle=mix(root,tip,.58);
  middle[0]+=.009*Math.sin(i*3.4);middle[2]+=.009;
  pieces.push(poly('saliva'+i,'face-gullet-upper',tube([root,middle,tip],[.0019,.0008,.0015],7),
   [.245,.144,.135],FLESH,{flex:{joint:'face-gullet-lower',anchor:root,axis:difference(tip,root)}}));
 }
 return pieces;
}

export const FACE_PARENTS={
 'face-left':'head','face-right':'head','face-jaw':'head','face-eye':'head',
 'face-skin-eye-1':'face-left','face-skin-eye1':'face-right','face-nose':'face-left',
 'face-receding-skin':'face-left','face-jaw-skin':'face-jaw',
 'face-gullet-upper':'head','face-gullet-lower':'face-jaw'
};

export function pursuerFacePose(joints,face){
 const {left,right,jaw,twitch,glance,bite}=face;
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
 joints['face-eye']={px:-.078,py:1.731,pz:.127,yaw:glance*.28,pitch:twitch*.105,z:.010*left};
 joints['face-skin-eye-1']={px:-.073,py:1.716,pz:.169,scale:Math.max(.003,1-left*3.4),z:-.022*left};
 joints['face-skin-eye1']={px:.073,py:1.716,pz:.169,yaw:-.22*glance,scale:Math.max(.26,1-.27*right-.49*bite),z:-.018*bite};
}
