// The front shell, the lining behind it and the jaw are separate solid meshes.
// Coordinates share the original pursuer rig. +Z is the front of the head.
const ROUND = {shape:'round', smooth:true, segments:10, rings:7};
const SKIN = 5, TISSUE = 6, STEEL = 7, GLOW = 8, BONE = 9;
const SKULL = [.23,.076,.075], SKIN_COLOR = [.70,.55,.46], LINING = [.32,.101,.097];
const STEEL_COLOR = [.28,.35,.37], TOOTH = [.76,.66,.46];
const subtract = (a,b) => a.map((n,i) => n-b[i]);
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit = v => {const length=Math.hypot(...v)||1;return v.map(n=>n/length);};

function quad(out,a,b,c,d,reverse=false){
 if(reverse)out.push([a,c,b],[a,d,c]);
 else out.push([a,b,c],[a,c,d]);
}

function ribbon(rows, reverse=false) {
 const triangles=[];
 for(let row=1;row<rows.length;row++){
  const top=rows[row-1],bottom=rows[row];
  for(let col=1;col<top.length;col++){
   quad(triangles,top[col-1],bottom[col-1],bottom[col],top[col],reverse);
  }
 }
 return triangles;
}

// Swept tubes taper into teeth, trace wiring around the socket and give the
// torn seams real thickness. The cross-sections remain in the posed mesh.
function tube(points,radii,segments=5){
 const rings=points.map((p,index)=>{
  const axis=unit(subtract(points[Math.min(index+1,points.length-1)],points[Math.max(0,index-1)]));
  const side=unit(cross(Math.abs(axis[2])>.87?[0,1,0]:[0,0,1],axis));
  const other=cross(axis,side);
  return Array.from({length:segments+1},(_,n)=>{
   const angle=n/segments*Math.PI*2;
   return p.map((v,i)=>v+radii[index]*(side[i]*Math.cos(angle)+other[i]*Math.sin(angle)));
  });
 });
 return ribbon(rings,true);
}

function surface(id,joint,triangles,color,faceMaterial,facetTint=.15){
 return {id,joint,triangles,color,faceMaterial,facetTint};
}

function solid(id,joint,x,y,z,w,h,d,color,faceMaterial,detail={}){
 return {id,joint,x,y,z,w,h,d,color,faceMaterial,...ROUND,...detail};
}

// Height, outer radius, jagged center seam, seam depth, cheek depth.
const MASK_ROWS=[
 [1.874,.096,-.006,.089,.075],
 [1.847,.142,.016,.130,.118],
 [1.807,.166,-.009,.154,.133],
 [1.763,.176,.019,.159,.137],
 [1.724,.168,.005,.158,.117],
 [1.686,.174,.022,.158,.137],
 [1.650,.163,-.015,.160,.152],
 [1.615,.143,.014,.174,.141]
];

function maskPanel(side,joint){
 const rows=MASK_ROWS.map(([y,w,seam,z,cheek],i)=>[
  [side*w,y-(i===7?.012:0),.002],
  [side*w*.80,y-(i===7?.009:0),cheek*.64],
  [side*w*.46,y+(i===6?.012:0),cheek],
  [seam,y,z]
 ]);
 // Close the back and the sides of each plate with darker material.
 const back=rows.map(row=>row.map(([x,y,z])=>[x,y,z-.016]));
 const seam=rows.map((row,i)=>[row[3],back[i][3]]);
 const edge=rows.map((row,i)=>[back[i][0],row[0]]);
 const thickness=[
  ...ribbon(back,side<0), ...ribbon(seam,side>0), ...ribbon(edge,side>0),
  ...ribbon([back[0],rows[0]],side>0), ...ribbon([rows.at(-1),back.at(-1)],side>0)
 ];
 return [
  surface('mask-face'+side,joint,ribbon(rows,side>0),side<0?SKIN_COLOR:[.68,.47,.37],SKIN,.13),
  surface('mask-thickness'+side,joint,thickness,LINING,TISSUE,.22)
 ];
}

function nose(){
 const a=[-.026,1.76,.157],b=[.026,1.76,.155],c=[0,1.656,.231];
 const d=[-.043,1.645,.173],e=[.045,1.645,.173],f=[0,1.632,.201];
 return surface('mask-nose','face-right',[[a,d,c],[a,c,b],[b,c,e],[d,f,c],[c,f,e]],SKIN_COLOR,SKIN);
}

function chin(){
 const rows=[
  [[-.143,1.603,.002],[-.114,1.606,.092],[-.058,1.615,.146],[.014,1.615,.174],[.066,1.615,.141],[.114,1.606,.093],[.143,1.603,.002]],
  [[-.128,1.563,.019],[-.102,1.563,.100],[-.054,1.567,.150],[-.006,1.565,.164],[.060,1.568,.148],[.106,1.565,.100],[.129,1.561,.017]],
  [[-.091,1.531,.029],[-.074,1.525,.076],[-.044,1.518,.116],[0,1.517,.132],[.047,1.519,.118],[.073,1.526,.072],[.090,1.530,.026]]
 ];
 const underside=[[-.075,1.533,.0],[-.055,1.521,.030],[-.033,1.51,.058],[0,1.508,.069],[.038,1.511,.057],[.061,1.521,.030],[.075,1.533,.0]];
 return surface('mask-chin','face-chin',ribbon([...rows,underside]),SKIN_COLOR,SKIN);
}

export function pursuerMask(){
 const pieces=[...maskPanel(-1,'face-left'),...maskPanel(1,'face-right'),nose(),chin(),hair()];
 for(const side of [-1,1]){
  const joint=side<0?'face-left':'face-right',x=side*.073;
  const parts=[
   ['socket',1.716,.133,.087,.044,.037,[.22,.128,.114],SKIN],
   ['white',1.717,.150,.062,.021,.026,[.58,.56,.49],BONE],
   ['iris',1.716,.163,.022,.019,.012,side>0?[.43,.44,.39]:[.23,.40,.41],STEEL],
   ['pupil',1.716,.168,.010,.014,.010,side>0?[.26,.266,.238]:[.055,.073,.075],TISSUE],
   ['brow',1.747,.152,.091,.019,.029,[.26,.227,.21],SKIN],
  ];
  for(const [name,y,z,w,h,d,color,material] of parts){
   const eye=['white','iris','pupil'].includes(name)?'face-mask-eye'+side:joint;
   pieces.push(solid('mask-'+name+side,eye,x,y,z,w,h,d,color,material,{roll:name==='brow'?side*.23:side*.06}));
  }
 }
 pieces.push(solid('mask-lip','face-chin',0,1.606,.173,.088,.011,.013,[.29,.115,.12],TISSUE));
 const fractures=[
  ['face-right',[[.017,1.764,.158],[.047,1.788,.155],[.088,1.796,.149],[.114,1.826,.113]]],
  ['face-right',[[.059,1.698,.151],[.061,1.685,.151],[.049,1.654,.157],[.055,1.631,.163]]],
  ['face-right',[[.091,1.699,.136],[.093,1.676,.140],[.085,1.670,.151]]],
  ['face-left',[[-.102,1.692,.129],[-.110,1.662,.142],[-.094,1.647,.151],[-.113,1.618,.118]]],
  ['face-chin',[[.031,1.607,.174],[.039,1.587,.164],[.067,1.579,.148]]]
 ];
 for(const [joint,path] of fractures){
  pieces.push(surface(joint+'-fracture',joint,tube(path,path.map((_,i)=>i===0?.001:.0018),4),[.22,.09,.082],TISSUE));
 }
 return pieces;
}

function hair(){
 const profile=[[1.931,.009,.019],[1.914,.105,.100],[1.876,.170,.146],[1.830,.185,.157],[1.797,.175,.151]];
 const rows=profile.map(([y,w,d],row)=>Array.from({length:17},(_,i)=>{
  const a=i*Math.PI/8,front=Math.max(0,Math.cos(a));
  const lift=(row===4?.048:.009)*front+.008*Math.sin(a*5+row*.34)+.010*Math.sin(a*3);
  return [w*Math.sin(a)-.009,y+lift,-.027+d*Math.cos(a)];
 }));
 return surface('hair-cap','head',ribbon(rows),[.20,.17,.16],10,.42);
}

function noseMechanism(){
 const apex=[.005,1.779,.137],left=[-.032,1.704,.143],right=[.025,1.713,.147],tip=[-.003,1.678,.161];
 const slot=[.013,1.681,.170],baseLeft=[-.035,1.665,.142],baseRight=[.035,1.669,.148];
 return [
  surface('nasal-bone','head',[[apex,left,tip],[apex,tip,right],[left,baseLeft,tip],[right,tip,baseRight]],[.24,.16,.14],STEEL),
  surface('nasal-hollow','head',[[tip,baseLeft,slot],[slot,baseLeft,baseRight]],[.055,.014,.015],TISSUE)
 ];
}

export function pursuerInterior(){
 const pieces=[
  solid('endoskeleton','head',0,1.712,.028,.308,.314,.224,SKULL,TISSUE,{segments:10,rings:6}),
  solid('forehead-ridge','head',-.012,1.811,.071,.245,.127,.121,[.28,.101,.085],TISSUE,{segments:9,rings:5}),
  ...noseMechanism(),
  solid('throat-recess','head',0,1.571,.120,.234,.218,.067,[.023,.006,.010],TISSUE),
  solid('upper-gum','head',0,1.625,.124,.249,.041,.105,[.24,.039,.048],TISSUE),
  solid('lower-gum','face-jaw',0,1.584,.127,.240,.043,.116,[.24,.034,.048],TISSUE),
  solid('tongue','face-jaw',0,1.591,.134,.096,.026,.108,[.40,.069,.085],TISSUE),
  solid('jaw-spine','face-jaw',0,1.554,.06,.245,.053,.155,STEEL_COLOR,STEEL),
 ];
 const socketShape = {shape:'torus',smooth:false,segments:12,tubeSegments:5};
 for(const side of [-1,1]){
  const x=side*.081,y=1.718+side*.007,lit=side<0;
  pieces.push(
   solid('exposed-orbit'+side,'head',x,y,.109,.115,.093,.063,[.29,.061,.078],TISSUE),
   solid('eye-casing'+side,'head',x,y,.123,.100,.084,.021,[.19,.09,.085],STEEL,{...socketShape,majorRadius:.043,tubeRadius:.005,pitch:Math.PI/2}),
   solid('inner-globe'+side,'face-eye'+side,x,y,.128,.074,.063,.067,lit?[.51,.42,.38]:[.63,.60,.52],BONE),
   solid('inner-iris'+side,'face-eye'+side,x,y,.160,lit?.036:.020,lit?.037:.025,.013,lit?[.17,.58,.52]:[.48,.48,.41],lit?GLOW:STEEL),
   solid('inner-pupil'+side,'face-eye'+side,x,y,.167,lit?.016:.008,lit?.021:.012,.007,lit?[.028,.040,.046]:[.26,.26,.22],TISSUE),
   solid('inner-glint'+side,'face-eye'+side,x-.008,y+.010,.170,.007,.007,.004,[.82,.98,.90],GLOW),
   solid('mandible-hinge'+side,'head',side*.141,1.633,.069,.045,.055,.043,STEEL_COLOR,STEEL,{...socketShape,majorRadius:.019,tubeRadius:.005,pitch:Math.PI/2,yaw:side*.6}),
   solid('jaw-rail'+side,'face-jaw',side*.110,1.572,.119,.032,.065,.036,STEEL_COLOR,STEEL,{roll:side*.35})
  );
  const upperLid=[[x-.044,y+.003,.139],[x-.033,y+.029,.150],[x-.010,y+.034,.157],[x+.019,y+.031,.153],[x+.041,y+.012,.140]];
  const lowerLid=[[x-.044,y+.003,.139],[x-.031,y-.026,.149],[x-.011,y-.035,.153],[x+.027,y-.028,.154],[x+.044,y-.005,.137]];
  pieces.push(
   surface('upper-orbit-lining'+side,'head',tube(upperLid,[.004,.007,.009,.006,.003]),[.38,.076,.097],TISSUE,.22),
   surface('lower-orbit-lining'+side,'head',tube(lowerLid,[.003,.005,.009,.006,.003]),[.36,.060,.071],TISSUE,.18)
  );
  for(let i=0;i<5;i++){
   const k=i/4;
   const vessel=[
    [side*(.033+k*.056),1.775+k*.044,.138-k*.022],
    [side*(.112+k*.032),1.764+k*.022+.008*Math.cos(i),.138-k*.025],
    [side*(.118+k*.036),1.676+k*.022+.007*Math.sin(i),.143-k*.048],
    [side*(.095+k*.042),1.622+k*.038,.161-k*.057]
   ];
   pieces.push(surface('socket-cable'+side+i,'head',tube(vessel,[.001,.0035,.0028,.001]),i%2?STEEL_COLOR:[.43,.096,.082],i%2?STEEL:TISSUE));
   const yRivet=1.66+i*.019;
   pieces.push(solid('cheek-rivet'+side+i,'head',side*(.121+Math.sin(i)*.013),yRivet,.141,.013,.014,.011,[.54,.40,.22],STEEL,{segments:6,rings:4}));
  }
  for(let i=0;i<4;i++){
   const x0=side*(.112+i*.009);
   const flapPath=[[x0,1.671,.113],[x0*1.13,1.646,.140-i*.006],[x0*1.05,1.612,.125],[x0*.79,1.576,.092]];
   pieces.push(surface('inner-cheek'+side+i,'face-jaw',tube(flapPath,[.004,.008,.006,.002]),i%2?[.27,.045,.048]:[.44,.087,.088],TISSUE));
  }
  for(let i=0;i<5;i++){
   const anchor=[side*(.109+i*.006),1.656+i*.027,.111+.008*Math.cos(i)];
   const end=[side*(.127-i*.012),1.626+i*.043,.137+.012*Math.sin(i)];
   const mid=anchor.map((v,k)=>(v+end[k])*.5);
   mid[2]+=.011*(i%2?1:-1);
   const cable=surface('stretch-tendon'+side+i,'head',tube([anchor,mid,end],[.0018,.0023,.0013]),i%2?STEEL_COLOR:[.43,.095,.092],i%2?STEEL:TISSUE);
   cable.flex={joint:side<0?'face-left':'face-right',anchor,axis:subtract(end,anchor)};
   pieces.push(cable);
  }
 }
 for(const upper of [true,false]){
  const joint=upper?'head':'face-jaw';
  for(let i=0;i<15;i++){
   const x=(i-7)*.0164,arch=(x/.118)**2;
   const z=(upper?.190:.194)-.070*arch,y=upper?1.626-.018*arch:1.592+.012*arch;
   const width=.0065+(i%3)*.0011,height=(upper?.054:.049)+Math.sin(i*2.74)*.016-.013*arch;
   const dir=upper?-1:1;
   const points=[[x,y,z],[x+.0013,y+dir*height*.58,z+.009],[x+.004*Math.sin(i*1.44),y+dir*height,z-.002]];
   const fang=surface(`fang-${upper?0:1}-${i}`,joint,tube(points,[width,width*.51,.0006]),TOOTH,BONE,.18);
   fang.vertexColor=(p,color)=>{
    const worn=.58+.39*Math.min(1,Math.abs(p[1]-y)/height)+.09*Math.sin(i*2.09);
    return color.map((channel,k)=>channel*worn+(k===0?.045:0));
   };
   pieces.push(fang);
  }
 }
 return pieces;
}

export const FACE_PARENTS = {
 'face-left':'head','face-right':'head','face-jaw':'head','face-chin':'face-jaw',
 'face-eye-1':'head','face-eye1':'head','face-mask-eye-1':'face-left','face-mask-eye1':'face-right'
};

export function pursuerFacePose(joints,face){
 const {left,right,jaw,twitch,glance}=face;
 joints['face-left']={px:-.160,py:1.745,pz:.066,x:-.059*left,y:.031*left,z:.006*left,
  pitch:-.21*left,yaw:-.98*left,roll:.25*left};
 joints['face-right']={px:.159,py:1.731,pz:.066,x:.029*right,y:.024*right,z:-.018*right,
  pitch:-.12*right,yaw:.43*right,roll:-.40*right};
 joints['face-jaw']={py:1.638,pz:.038,y:-.063*jaw,z:.025*jaw,pitch:jaw*(.45+twitch*.053),roll:twitch*.039*jaw};
 joints['face-chin']={py:1.562,pz:.127,y:-.021*jaw,z:-.029*jaw,pitch:.30*jaw};
 for(const side of [-1,1]){
  joints['face-eye'+side]={px:side*.081,py:1.718+side*.007,pz:.129,yaw:glance*side*.19,pitch:twitch*.10};
  const opening=side<0?left:right;
  joints['face-mask-eye'+side]={px:side*.073,py:1.716,pz:.151,scale:Math.max(.001,1-opening*3.7),z:-.012*opening};
 }
}
