// The close-up keeps the patrol silhouette, with sculpted facial planes
// that split along the same surface during the reveal.
const round={shape:'round',smooth:true,segments:18,rings:12};
const SKIN=5,FLESH=6,TOOTH=13,TENDON=14,SALIVA=15,EYE=16,BLOOD=17;
const HAIR=10;
export const CAPTURE_FABRIC=19;
const tau=Math.PI*2;
const difference=(a,b)=>a.map((n,i)=>n-b[i]);
const magnitude=v=>Math.hypot(...v)||1;
const unit=v=>{const length=magnitude(v);return v.map(n=>n/length);};
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const mix=(a,b,t)=>a.map((n,i)=>n+(b[i]-n)*t);
const poly=(id,joint,triangles,color,faceMaterial,extra)=>({id,joint,triangles,color,faceMaterial,...extra});
const solid=(id,joint,x,y,z,w,h,d,color,faceMaterial,extra)=>({id,joint,x,y,z,w,h,d,color,faceMaterial,...round,...extra});
const bell=n=>Math.exp(-n*n);
const zone=(x,y,x0,y0,sx,sy)=>bell((x-x0)/sx)*bell((y-y0)/sy);
const headWidth=y=>.1755*(1-.19*bell((y-1.566)/.071)+.018*bell((y-1.705)/.044));

function faceRelief(x,y){
 const a=Math.abs(x);
 const cheek=.022*zone(a,y,.111,1.674,.046,.038)-.017*zone(a,y,.111,1.618,.041,.041);
 const brow=.019*zone(a,y,.065,1.744,.051,.026);
 const socket=.030*zone(a,y,.074,1.717,.036,.019);
 const bridge=.054*zone(x,y,.001,1.685,.019,.058),tip=.030*zone(x,y,.002,1.654,.024,.017);
 const ala=.021*zone(a,y,.025,1.648,.015,.013);
 const jaw=.018*zone(a,y,.074,1.571,.044,.032)+.009*zone(x,y,0,1.545,.054,.024);
 const folds=.005*zone(a,y,.053+(1.622-y)*.40,1.619,.006,.030);
 return cheek+brow-socket+bridge+tip+ala+jaw-folds;
}

function skinDepth(x,y){
 const front=Math.sqrt(Math.max(0,1-(x/headWidth(y))**2-((y-1.687)/.207)**2));
 return .1645*front+faceRelief(x,y)*Math.min(1,front*3);
}
const skinPoint=(x,y,offset=0)=>[x,y,skinDepth(x,y)+offset];
function eyeUV([x,y,z],{w,h}){
 const rear=z<0?1.4:1;
 return [.5+x/w*rear,.5+y/h*rear];
}

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
const split=([x,y])=>x-(-.026+.26*(y-1.72)+.010*Math.sin((y-1.6)*71)+.004*Math.sin((y-1.6)*167));
const orbitSplit=([x,y])=>y-(1.750+.15*(x+.065)+.009*Math.sin(x*85)+.004*Math.sin(x*179));
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

function sculptHead(face,fractured){
 const {x,y,z,w,h,d,color}=face;
 const bands=fractured?56:28,sectors=fractured?96:48;
 const shell=Array.from({length:bands+1},(_,row)=>{
  const lat=Math.PI*(.5-row/bands),py=y+h*.5*Math.sin(lat),cl=Math.cos(lat);
  return Array.from({length:sectors+1},(_,col)=>{
   const az=tau*col/sectors,depth=cl*Math.cos(az),px=x+headWidth(py)*cl*Math.sin(az);
   return [px,py,z+d*.5*depth+(depth>0?faceRelief(px,py)*Math.min(1,depth*3):0)];
  });
 });
 const triangles=ribbon(shell);
 const inset=p=>mix(p,[x,y,z],.072);
 const normalAt=([px,py,pz])=>{
  if(pz>.052){
   const step=.0009;
   return unit([skinDepth(px-step,py)-skinDepth(px+step,py),skinDepth(px,py-step)-skinDepth(px,py+step),2*step]);
  }
  return unit([(px-x)/(w*w),(py-y)/(h*h),(pz-z)/(d*d)]);
 };
 const skinTint=([px,py,pz],rgb)=>{
  if(pz<.052)return rgb.map((n,k)=>n*[.85,.80,.79][k]);
  const a=Math.abs(px),eye=zone(a,py,.075,1.716,.042,.026);
  const beard=zone(a,py,.069,1.572,.072,.040),blush=zone(a,py,.105,1.671,.042,.035);
  return rgb.map((n,k)=>n*(1-eye*[.32,.36,.36][k]-beard*[.22,.20,.153][k]+blush*[.029,-.087,-.10][k]));
 };
 const sections=fractured?[
  ['head',[inverse(front)]],
  ['face-left',[front,lip,inverse(split),inverse(orbitSplit)]],
  ['face-brow-flap',[front,lip,inverse(split),orbitSplit]],
  ['face-right',[front,lip,split]],
  ['face-jaw-skin',[front,inverse(lip)]]
 ]:[['head',[]]];
 return sections.flatMap(([joint,cuts])=>{
  const outside=[],rim=[];
  for(const triangle of triangles){
   const section=cuts.reduce(clip,triangle);
   for(const p of section){
    p.uv=[.5+p[0]*2.64,(p[1]-1.481)*2.45];
    p.normal=normalAt(p);
    p.tangent=unit(cross([0,1,0],p.normal));
   }
   for(let n=1;n<section.length-1;n++)outside.push([section[0],section[n],section[n+1]]);
   if(joint==='head')continue;
   for(let n=0;n<section.length;n++){
    const a=section[n],b=section[(n+1)%section.length];
    // Cut vertices lie on the linear interpolant through each source triangle.
    if(cuts.slice(1).some(cut=>Math.abs(cut(a))<.0012&&Math.abs(cut(b))<.0012)){
     rim.push([a,inset(b),b],[a,inset(a),inset(b)]);
    }
   }
  }
  const lining=new Map(),inside=p=>{
   if(!lining.has(p)){
    const inner=inset(p);
    inner.uv=p.uv;inner.tangent=p.tangent;
    inner.normal=p.normal.map(n=>-n);
    lining.set(p,inner);
   }
   return lining.get(p);
  };
  const underside=joint==='head'?[]:outside.map(([a,b,c])=>[inside(a),inside(c),inside(b)]);
  return [
   poly('shell-skin-'+joint,joint,outside,color,SKIN,{vertexColor:skinTint,strain:joint!=='head'}),
   poly('shell-rim-'+joint,joint,rim,[.24,.048,.048],FLESH,{facetTint:.23}),
   poly('shell-lining-'+joint,joint,underside,[.240,.065,.066],FLESH)
  ].filter(part=>part.triangles.length);
 });
}

function captureHair(){
 const profile=[[1.924,.019,.023],[1.916,.087,.085],[1.895,.135,.126],
  [1.868,.165,.151],[1.832,.178,.163],[1.791,.177,.153],[1.756,.163,.144]];
 const rows=profile.map(([height,width,depth],row)=>Array.from({length:49},(_,i)=>{
  const u=i/48,a=u*tau,side=Math.sin(a),front=Math.cos(a),v=row/(profile.length-1);
  const hairline=Math.max(0,front)*(.074+.014*Math.sin(a*3-.48));
  const sweep=.005*Math.sin(a*6+v*2.8)+.004*Math.sin(a*13+v*4.1);
  const p=[width*side-.011*(1-v),height+v**3*hairline+sweep,-.030+depth*front];
  p.uv=[u+.115*v,v];
  p.normal=unit([side,1-v*1.28,front]);
  p.tangent=[Math.cos(a),0,-Math.sin(a)];
  return p;
 }));
 return poly('capture-swept-hair','head',ribbon(rows),[.61,.62,.605],HAIR,{
  vertexColor:(point,color)=>color.map(n=>n*(.65+.35*(1-point.uv[1]**2)))
 });
}

function captureNostrils(){
 return [-1,1].map(side=>{
  const line=[[side*.012,1.642],[side*.019,1.640],[side*.027,1.644]];
  return poly('nose-shadow'+side,'face-right',tube(line.map(([x,y])=>skinPoint(x,y,.0012)),[.001,.003,.0014],9,
   {aspect:.56}),[.28,.13,.107],SKIN);
 });
}

function captureLips(){
 const line=[[-.052,1.598],[-.035,1.600],[-.012,1.603],[.004,1.602],[.021,1.602],[.039,1.598],[.054,1.595]];
 return [
  poly('lip-edge','face-jaw-skin',tube(line.map(([x,y])=>skinPoint(x,y,.002)),
   [.0008,.0020,.0026,.0024,.0022,.0020,.0007],10,{aspect:.57}),[.31,.151,.134],SKIN),
  poly('lower-lip','face-jaw-skin',tube(line.map(([x,y])=>skinPoint(x,y-.005,.0014)),
   [.0006,.0017,.0035,.0040,.0035,.0022,.0006],10,{aspect:.58}),[.66,.390,.333],SKIN)
 ];
}

function captureLids(side){
 const joint=side<0?'face-receding-skin':'face-right',x=side*.074;
 const lid=(name,heights,width,color,parent=joint)=>poly(name+side,parent,tube(
  heights.map(([dx,y,z])=>skinPoint(x+dx,y,z)),width,9,{aspect:.72,roughness:.071}),color,SKIN);
 return [
  lid('human-upper-lid',[[-.033,1.713,.002],[-.017,1.722,.004],[.002,1.724,.006],[.022,1.722,.004],[.034,1.715,.002]],
   [.0011,.0038,.0046,.0036,.0013],[.60,.404,.349],'face-blink'+side),
  lid('human-lower-lid',[[-.034,1.712,.002],[-.017,1.705,.005],[.006,1.704,.004],[.023,1.708,.004],[.034,1.714,.001]],
   [.001,.0026,.0030,.0023,.001],[.71,.499,.433])
 ];
}

function captureBrow(side){
 const joint=side<0?'face-brow-flap':'face-right';
 const trace=[[-.039,1.750,.004],[-.020,1.755,.007],[.001,1.754,.010],[.026,1.750,.009],[.043,1.743,.005]];
 return poly('capture-brow'+side,joint,tube(trace.map(([x,y,z])=>skinPoint(side*(.071+x),y,z)),
  [.0012,.0052,.0062,.0043,.0013],9,{aspect:.69,roughness:.10}),[.48,.46,.43],HAIR);
}

export function pursuerShell(parts,capture){
 const pieces=parts.flatMap(part=>{
  if(part.id==='face')return sculptHead(part,capture);
  if(part.id==='shirt'||part.id.startsWith('collar'))return {...part,joint:capture?'face-collar':'chest',faceMaterial:CAPTURE_FABRIC};
  if(part.joint!=='head')return {...part,faceMaterial:CAPTURE_FABRIC,color:part.color.map(n=>n*.69)};
  const {id}=part;
  if(id==='hair-top')return captureHair();
  if(id.startsWith('hair-part')||id.startsWith('temple'))return [];
  if(id==='nose-bridge')return captureNostrils();
  if(id==='nose-tip')return [];
  if(id==='jaw'||id==='chin'||id.startsWith('cheek-crease')||id.startsWith('eye-crease'))return [];
  if(id==='mouth')return captureLips();
  if(id==='neck')return {...part,y:1.486,z:-.011,h:.145,faceMaterial:SKIN,joint:'face-neck'};
  if(id.startsWith('brow'))return captureBrow(id.endsWith('-1')?-1:1);
  if(/^(iris|pupil)/.test(id))return [];
  if(id.startsWith('eye-')){
   const side=id.endsWith('-1')?-1:1;
   if(id.startsWith('eye-socket'))return captureLids(side);
   if(id.startsWith('eye-white'))return {...part,joint:'face-skin-eye'+side,faceMaterial:EYE,
    w:.062,h:.029,d:.039,y:1.714,z:.123,segments:28,rings:18,color:[.139,.213,.244],surfaceUV:eyeUV};
  }
  return {...part,faceMaterial:id.startsWith('hair')?HAIR:SKIN};
 });
 if(capture)return pieces;
 return pieces.map(piece=>piece.joint.startsWith('face-')?{...piece,joint:'head'}:piece);
}

function woundDetails(pieces){
 for(const side of [-1,1]){
  for(let i=0;i<15;i++){
   const t=i/14,phase=i*2.399+side;
   const root=[side*(.098+.056*t),1.634+.081*t,.104+.013*Math.sin(phase)];
   const tip=[side*(.091+.057*t),1.560+.078*t,.127-.041*t];
   const knot=mix(root,tip,.24),bow=mix(root,tip,.66);
   knot[0]+=side*(.017+.010*Math.sin(phase));knot[2]+=.018+.012*Math.cos(phase);
   bow[0]+=side*(.010+.016*Math.cos(phase));bow[2]+=.008+.017*Math.sin(phase);
   const width=.00065+.0008*Math.cos(phase)**2;
   const skinSide=side<0?(i>8?'face-brow-flap':'face-left'):'face-right';
   const target=i%4===0?skinSide:'face-jaw';
   pieces.push(poly('tissue-thread'+side+'-'+i,'head',
    tube([root,knot,bow,tip],[width*.83,width,width*.76,width*.48],6,{aspect:.75,roughness:.13,phase}),
    i%3===0?[.34,.103,.109]:[.185,.036,.046],i%3===0?TENDON:BLOOD,
    {flex:{joint:target,anchor:root,axis:difference(tip,root),bow:side*(.006+.007*Math.sin(phase)),
     release:i%4===1?.21+.56*t:undefined}}));
  }
  for(let i=0;i<6;i++){
   const t=i/5;
   const origin=[side*(.089+.036*t),1.636+.030*t,.130-.042*t];
   const midpoint=[side*(.112+.038*t),1.610+.010*t,.128-.031*t];
   const tip=[side*(.101+.031*t),1.584+.032*t,.130-.042*t];
   pieces.push(poly('clotted-gum'+side+i,'face-jaw',
    tube([origin,midpoint,tip],[.002,.0047,.0022],8,{aspect:.59,phase:i*1.7}),
    [.23,.025,.042],BLOOD));
  }
 }
 // Follow the old ellipsoid so the torn edge stays stained as the plate moves.
 for(const [i,[x,y,end]] of [[.005,1.679,1.642],[.020,1.655,1.621],[.088,1.665,1.642]].entries()){
  const points=[skinPoint(x,y,.0011),skinPoint(x+.003,y+(end-y)*.32,.0011),
   skinPoint(x-.005,y+(end-y)*.73,.0011),skinPoint(x-.007,end,.0011)];
  pieces.push(poly('blood-runnel'+i,'face-blood',tube(points,[.0016,.0023,.0013,.00034],8,{aspect:.47,phase:i}),
   [.18,.030,.038],BLOOD));
 }
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

function fang(pieces,{joint,dir,i,root,length,width,row}){
 const phase=(i+dir*.27+row*.58)*2.28,lean=.011*Math.sin(phase)*length/.048;
 const taper=[1.03,1,.87,.72,.52,.29,.045];
 const points=taper.map((_,n)=>{
  const t=n/(taper.length-1),bow=4*t*(1-t);
  return [root[0]+lean*(t*t+.17*bow),root[1]+dir*length*t,root[2]+length*(.17*bow-.32*t*t)];
 });
 // Some crowns have a blunt, oblique chip instead of an intact point.
 if(i%5===2){
  taper[taper.length-1]=.15;
  points.at(-1)[1]-=dir*length*.083;
  points.at(-1)[0]+=.0018;
 }
 const tints=[[.76,.67,.50],[.62,.53,.41],[.46,.38,.31]];
 pieces.push(poly('fang'+dir+'-'+row+'-'+i,joint,
  tube(points,taper.map(n=>n*width),row===0?14:9,{aspect:.72,roughness:.10,phase}),
  tints[row],TOOTH,{
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
 // Each row follows the inside of the cavity. A shift in the angular
 // spacing keeps the back teeth from falling directly behind the front.
 const rows=[[16,.139,.186,1],[13,.116,.132,.79],[11,.084,.085,.57]];
 for(const [row,[count,spread,depth,size]] of rows.entries()){
  const gum=[];
  for(let i=0;i<count;i++){
   const phase=i*2.739+row*1.8+(upper?0:.91);
   const t=i/(count-1)*2-1,arc=t*t;
   const x=spread*t+.004*Math.sin(phase);
   const y=(upper?1.652-.048*arc:1.574+.025*arc)-dir*row*.008;
   const z=depth-(.078-row*.016)*arc+.0035*Math.sin(i*1.27);
   gum.push([x,y,z-.010]);
   const length=((upper?.035:.027)+.020*Math.abs(Math.sin(phase))+.013*Math.pow(Math.sin(phase*.47),4)-.012*arc)*size;
   const width=(.0047+.0030*Math.abs(Math.cos(phase)))*size;
   fang(pieces,{joint,dir,i,root:[x,y,z],length,width,row});
   if(row===0)pieces.push(solid('tooth-root'+dir+'-'+i,joint,x,y-dir*.003,z-.006,width*2.45,.017,.021,
    [.19+.055*Math.sin(i*2.03)**2,.041,.051],FLESH,{segments:8,rings:5}));
  }
  pieces.push(poly('gumline'+dir+'-'+row,joint,tube(gum,gum.map((_,i)=>(.012+.002*Math.sin(i*.87)**2)*size),12),
   upper?[.224,.051,.060]:[.202,.038,.049],FLESH));
 }
}

function mouthCavity(){
 const rings=[
  [.155,1.601,.147,.075],[.132,1.598,.143,.071],[.109,1.593,.127,.072],
  [.087,1.590,.111,.072],[.062,1.583,.101,.065],[.033,1.574,.082,.062],
  [.005,1.560,.059,.049],[-.022,1.545,.033,.025],[-.049,1.527,.003,.004]
 ];
 const rows=rings.map(([z,y,w,h],row)=>Array.from({length:57},(_,i)=>{
  const u=i/56,v=row/(rings.length-1),angle=u*tau;
  const folds=1+.039*Math.sin(angle*7+row*2)+.025*Math.cos(angle*11+row);
  const vertex=[w*Math.cos(angle)*folds,y+h*Math.sin(angle)*folds,z+.004*Math.sin(angle*6+row*.87)];
  vertex.uv=[u,v];
  vertex.normal=unit([-Math.cos(angle),-Math.sin(angle),-.31]);
  vertex.tangent=[-Math.sin(angle),Math.cos(angle),0];
  return vertex;
 }));
 return poly('continuous-mouth-lining','face-gullet-upper',ribbon(rows,true),[.23,.053,.058],FLESH,{
  flex:{joint:'face-gullet-lower',anchor:[0,1.652,0],axis:[0,-.13,0]},
  vertexColor:(p,color)=>color.map(n=>n*(.08+.92*(1-p.uv[1])**2))
 });
}

function throatWall(){
 const rows=Array.from({length:13},(_,j)=>{
  const v=j/12;
  return Array.from({length:29},(_,i)=>{
   const u=i/28,tip=Math.max(0,(v-.70)/.30);
   const x=(u*2-1)*(.123+.024*Math.sin(v*Math.PI))*(1-.83*tip*tip);
   const depth=.097+.020*(u*2-1)**2+.074*v**3;
   const p=[x,1.654-.121*v,depth+.006*Math.cos(v*43+u*7)];
   p.uv=[u,v];p.normal=[0,0,1];p.tangent=[1,0,0];
   return p;
  });
 });
 return poly('back-of-throat','face-gullet-upper',ribbon(rows),[.062,.014,.027],11,{
  flex:{joint:'face-gullet-lower',anchor:[0,1.652,0],axis:[0,-.131,0]},
  vertexColor:(p,color)=>color.map(n=>n*(.44+.56*Math.abs(p.uv[0]*2-1)**2))
 });
}

export function pursuerInterior(){
 const pieces=[
  solid('inner-head','head',0,1.718,.013,.292,.291,.203,[.137,.033,.041],FLESH),
  solid('clivus','head',-.026,1.753,.089,.112,.134,.067,[.203,.049,.049],FLESH,{roll:.14}),
  mouthCavity(),
  throatWall(),
  solid('throat-depth','head',0,1.538,-.027,.142,.144,.041,[.027,.009,.012],11),
  solid('soft-palate','face-palate',0,1.627,.125,.197,.053,.100,[.125,.034,.050],FLESH),
  solid('underjaw','face-jaw',0,1.564,.086,.224,.067,.173,[.13,.023,.039],FLESH),
  solid('tongue','face-tongue',-.009,1.550,.112,.091,.027,.097,[.233,.058,.071],FLESH,{roll:.095}),
  solid('orbit-tissue','head',-.078,1.723,.103,.105,.092,.061,[.23,.039,.054],FLESH),
  solid('orbital-shadow','head',-.078,1.731,.104,.077,.059,.045,[.083,.013,.029],11),
  solid('exposed-eye','face-eye',-.078,1.730,.118,.063,.051,.053,[.19,.238,.171],EYE,
   {surfaceUV:eyeUV,segments:28,rings:20})
 ];
 const lids=[
  [[-.126,1.725,.118],[-.109,1.746,.132],[-.085,1.752,.147],[-.066,1.749,.146],[-.044,1.729,.131]],
  [[-.127,1.721,.122],[-.112,1.702,.131],[-.091,1.687,.144],[-.058,1.700,.139],[-.047,1.724,.125]]
 ];
 for(const [i,points] of lids.entries()){
  pieces.push(poly('torn-eyelid'+i,i===0?'face-orbit-lid':'head',tube(points,[.003,.011,.010,.012,.003],12,{aspect:.74,roughness:.19,phase:i*3.9}),
   [.28,.047,.061],BLOOD));
 }
 muscles(pieces);
 woundDetails(pieces);
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
 'face-left':'head','face-brow-flap':'head','face-right':'head','face-jaw':'head','face-eye':'head','face-orbit-lid':'head',
 'face-skin-eye-1':'face-left','face-skin-eye1':'face-right',
 'face-blink-1':'face-receding-skin','face-blink1':'face-right',
 'face-receding-skin':'face-left','face-jaw-skin':'face-jaw','face-blood':'face-right',
 'face-gullet-upper':'head','face-gullet-lower':'face-jaw',
 'face-palate':'face-gullet-upper','face-tongue':'face-gullet-lower','face-collar':'chest','face-neck':'head'
};

export function pursuerFacePose(joints,face){
 const {left,right,upper=left,jaw,twitch,glance,bite,clamp=0,pressure=0,blink=0,gaze={x:0,y:1.73,z:.50}}=face;
 const clampLook=n=>Math.max(-.39,Math.min(.39,n));
 function eyeAim(x,y,z){
  const depth=Math.max(.15,gaze.z-z);
  return {yaw:clampLook(Math.atan2(gaze.x-x,depth)-joints.head.yaw),
   pitch:clampLook(-Math.atan2(gaze.y-y,depth)-joints.head.pitch)};
 }
 joints['face-left']={px:-.153,py:1.735,pz:.025,x:-.043*left,y:.026*left,z:-.011*left,
  yaw:-1.29*left,pitch:-.19*left,roll:.41*left};
 joints['face-brow-flap']={px:-.148,py:1.790,pz:.031,x:-.028*upper,y:.042*upper,z:-.022*upper,
  yaw:-.98*upper,pitch:-.22*upper,roll:.28*upper};
 joints['face-right']={px:.141,py:1.778,pz:.04,x:.010*right,y:.014*right,z:-.017*right,
  yaw:.34*right,pitch:-.10*right,roll:-.13*right};
 joints['face-jaw']={py:1.638,pz:.041,y:-.060*jaw,z:.018*jaw,pitch:(.79+twitch*.047)*jaw,
  roll:(.052+twitch*.021)*jaw};
 const shed=1-(1-jaw)**4;
 joints['face-jaw-skin']={py:1.521,pz:.079,y:-.036*shed,z:-.080*shed,pitch:.53*shed,scale:1-.94*shed};
 joints['face-blood']={z:-.013*Math.max(0,1-left*2.7)};
 joints['face-receding-skin']={px:-.080,py:1.717,pz:.137,scale:Math.max(.12,1-left*1.25),z:-.033*left};
 const throat=Math.min(1,Math.max(0,(jaw-.14)/.62));
 joints['face-gullet-upper']={z:-.077*(1-throat),y:.014*(1-throat)};
 joints['face-gullet-lower']={z:-.077*(1-throat),y:-.022*(1-throat)};
 joints['face-neck']={y:-.067*throat,z:-.056*throat};
 joints['face-collar']={py:1.43,y:-.115*jaw-.059*bite,z:-.043*jaw,pitch:.20*jaw};
 joints['face-palate']={py:1.627,pz:.125,scale:1+pressure*.11+jaw*.043,y:-.008*pressure};
 joints['face-tongue']={py:1.588,pz:.135,y:jaw*.012-.022*clamp,z:(pressure-.4*bite)*.021-.059*clamp,
  scale:1-.23*clamp,roll:twitch*.14,pitch:jaw*.16+.15*clamp};
 joints['face-orbit-lid']={py:1.753,pz:.139,y:-.006*(1-glance)-.003*pressure,z:.003*left};
 joints['face-eye']={px:-.078,py:1.730,pz:.118,...eyeAim(-.078,1.730,.118),z:.004*left};
 for(const side of [-1,1]){
  const x=side*.074,fold=side<0?Math.max(.003,1-left*3.4):Math.max(.26,1-.27*right-.49*bite-.08*glance);
  joints['face-blink'+side]={y:-.013*blink};
  joints['face-skin-eye'+side]={px:x,py:1.714,pz:.123,...eyeAim(x,1.714,.123),
   y:-.002*pressure,z:-(side<0?.022*left:.018*bite)-.014*blink,scale:fold};
 }
}
