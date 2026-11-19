import {shotEase} from './capture-shot.js';
import {pursuerGraspAnchor} from './pursuer-model.js';

const STRIDE=16,RINGS=42,SIDES=22,WEB_ROWS=22,WEB_COLS=12,TAU=Math.PI*2;
const TUBE=(RINGS+1)*(SIDES+1),WEB=(WEB_ROWS+1)*(WEB_COLS+1);
const SIDES_OF_FACE=[-1,1];
const mix=(a,b,t)=>a+(b-a)*t;
const sub=(a,b)=>a.map((n,k)=>n-b[k]);
const lerp=(a,b,t)=>a.map((n,k)=>mix(n,b[k],t));
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const unit=v=>{const d=Math.hypot(...v)||1;return v.map(n=>n/d);};
const ringAngles=Array.from({length:SIDES+1},(_,i)=>{
 const turn=i/SIDES,angle=turn*TAU;
 return {turn,angle,c:Math.cos(angle),s:Math.sin(angle)};
});

// Round only the small region around a joint. The lengths on either side
// retain a clear change of direction as the appendage flexes under load.
function path(points,u){
 const scaled=u*(points.length-1),joint=Math.round(scaled),distance=scaled-joint;
 const bend=.22;
 if(joint>0&&joint<points.length-1&&Math.abs(distance)<bend){
  const hinge=points[joint],t=(distance+bend)/(2*bend);
  const start=lerp(hinge,points[joint-1],bend),end=lerp(hinge,points[joint+1],bend);
  return lerp(lerp(start,hinge,t),lerp(hinge,end,t),t);
 }
 const i=Math.min(points.length-2,Math.floor(scaled));
 return lerp(points[i],points[i+1],scaled-i);
}

function panelIndices(indices,offset,rows,cols,back=false){
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  const a=offset+row*(cols+1)+col,b=a+1,c=a+cols+1,d=c+1;
  indices.push(a,d,b,a,c,d);
  if(back)indices.push(a,b,d,a,d,c);
 }
}

export function createTentacleMesh(){
 const vertices=new Float32Array((6*TUBE+4*WEB)*STRIDE),indices=[];
 for(let i=0;i<6;i++)panelIndices(indices,i*TUBE,RINGS,SIDES);
 for(let i=0;i<4;i++)panelIndices(indices,6*TUBE+i*WEB,WEB_ROWS,WEB_COLS,true);
 return {vertices,indices:new Uint16Array(indices)};
}

function write(vertices,index,position,normal,tangent,u,v,rgb,material,stress=0){
 const at=index*STRIDE;
 for(let j=0;j<3;j++){
  vertices[at+j]=position[j];vertices[at+3+j]=rgb[j];
  vertices[at+6+j]=normal[j];vertices[at+13+j]=tangent[j];
 }
 vertices[at+9]=u;vertices[at+10]=v;vertices[at+11]=material;vertices[at+12]=stress;
}

function poseLimb(vertices,id,points,amount,radius,load,basis,oral=false){
 const count=points.length-1;
 let transported=null;
 for(let row=0;row<=RINGS;row++){
  const u=row/RINGS,center=path(points,u);
  const tangent=unit(sub(path(points,Math.min(1,u+.009)),path(points,Math.max(0,u-.009))));
  const drift=transported?dot(transported,tangent):0;
  const across=transported?.map((n,k)=>n-drift*tangent[k]);
  const normal=unit(across&&dot(across,across)>.03?across:
   cross(Math.abs(dot(tangent,basis.up))>.88?basis.right:basis.up,tangent));
  transported=normal;
  const binormal=cross(tangent,normal);
  const hinge=Math.max(0,1-Math.abs(u*count-Math.round(u*count))*4)*Math.min(1,u*9);
  const profile=(1-u)**.64*(.77+.21*Math.sin(u*count*Math.PI)**2+.23*hinge)+.013;
  const width=radius*profile*amount*(1+.12*load*hinge);
  for(let k=0;k<=SIDES;k++){
   const {turn,angle,c,s}=ringAngles[k];
   const grain=Math.sin(angle*7-u*12);
   const lines=1+.12*Math.cos(angle*3+u*3)+.052*grain+.024*Math.sin(angle*11-u*19);
   const ridge=.92+(.046*Math.cos(u*85+grain*.7)+.059*Math.cos(u*139+angle*3))*hinge;
   const radius=width*lines*ridge,ellipse=.74;
   const length=Math.hypot(c,s/ellipse);
   const at=(id*TUBE+row*(SIDES+1)+k)*STRIDE;
   for(let j=0;j<3;j++){
    vertices[at+j]=center[j]+radius*(normal[j]*c+binormal[j]*s*ellipse);
    vertices[at+6+j]=(normal[j]*c+binormal[j]*s/ellipse)/length;
    vertices[at+13+j]=tangent[j];
   }
   const flesh=.45+.55*Math.max(0,s)**2;
   vertices[at+3]=.21+.10*flesh;vertices[at+4]=.050+.048*flesh;vertices[at+5]=.053+.026*flesh;
   vertices[at+9]=u;vertices[at+10]=turn;vertices[at+11]=12;vertices[at+12]=oral?0:hinge*(.61+.39*load);
  }
 }
}

function poseMembrane(vertices,id,[base,elbow,tip],amount,load,basis){
 const start=lerp(base,elbow,.29),end=lerp(elbow,tip,.66);
 const a=sub(start,elbow),b=sub(end,elbow);
 const normal=unit(cross(a,b)),tangent=unit(sub(end,start));
 const openness=Math.hypot(...sub(start,end))/Math.max(.001,Math.hypot(...a)+Math.hypot(...b));
 const reach=.54+.22*openness+.14*load;
 for(let row=0;row<=WEB_ROWS;row++){
  const u=row/WEB_ROWS;
  const edge=u<.5?lerp(start,elbow,u*2):lerp(elbow,end,(u-.5)*2);
  const sag=Math.sin(Math.PI*u)**.83;
  const rim=lerp(edge,lerp(start,end,u),reach*sag);
  const span=sub(rim,edge),spanLength=Math.hypot(...span);
  for(let col=0;col<=WEB_COLS;col++){
   const v=col/WEB_COLS;
   const phase=u*32+v*2,depth=(.015-.010*openness)*sag;
   const fold=Math.sin(phase)*depth*Math.sin(v*Math.PI);
   const slope=depth*(2*Math.cos(phase)*Math.sin(v*Math.PI)+Math.PI*Math.sin(phase)*Math.cos(v*Math.PI));
   const foldNormal=unit(normal.map((n,k)=>n-span[k]*slope/Math.max(.00045,spanLength**2)));
   const p=lerp(edge,rim,v).map((n,k)=>n+amount*(basis.forward[k]*.008+normal[k]*fold));
   const shade=.84+.16*openness;
   write(vertices,6*TUBE+id*WEB+row*(WEB_COLS+1)+col,p,foldNormal,tangent,u,v,
    [.19*shade,.071*shade,.066*shade],18,load);
  }
 }
}

function handPose(side,{time,timing,drag,swallow,reduced},grip,other){
 const contact=side===timing.firstSide?timing.grab:timing.lock;
 const raise=shotEase(timing.reveal-.14,contact-.03,time);
 const delay=side===timing.firstSide?.038:.083;
 const guard=shotEase(delay,delay+.27,time)*(1-.66*shotEase(.37,.79,time))*(1-raise);
 const brace=shotEase(delay+.19,delay+.34,time)*(1-shotEase(.35,.60,time));
 const recoil=grip*(1-other),pull=grip*drag;
 const shake=reduced?0:Math.sin(time*17+side*1.5)*(guard+raise)*(1-grip);
 return {
  x:side*(.182-.044*guard+.054*recoil-.023*pull-.050*swallow),
  y:-.277+.109*raise+.155*guard-.020*recoil+.025*pull+.012*shake+.026*swallow,
  z:.296+.043*guard-.028*recoil+.077*pull-.164*swallow,
  roll:side*(.23-.30*guard+.70*grip+.22*recoil),flex:.32+.42*guard+.27*raise+.26*grip+.26*swallow,
  curl:.33*brace+grip*(.59+.41*other),visible:time>delay
 };
}

function wristPosition(hand,point){
 // The cuff in climbingHandPieces is centered at (0, -.07, .15).
 // Apply the same flex, roll and scale as drawClimbingHands.
 const y=-.07*Math.cos(hand.flex)-.15*Math.sin(hand.flex);
 const z=-.07*Math.sin(hand.flex)+.15*Math.cos(hand.flex);
 return point(hand.x+y*Math.sin(hand.roll)*.67,hand.y+y*Math.cos(hand.roll)*.67,hand.z-z*.67);
}

export function captureGrasp(camera,basis,actor,grasp,mesh){
 const {time,timing,snare,drag,swallow,reduced,gripLeft,gripRight}=grasp;
 const origin=[camera.x,camera.y,camera.z];
 const point=(x,y,z)=>origin.map((n,k)=>n+basis.right[k]*x+basis.up[k]*y+basis.forward[k]*z);
 const wrists=[handPose(-1,grasp,gripLeft,gripRight),handPose(1,grasp,gripRight,gripLeft)];
 const hands=swallow<.94?wrists.map(hand=>{
  if(!hand.visible)return null;
  const [x,y,z]=point(hand.x,hand.y,hand.z);
  return {x,y,z,roll:hand.roll,flex:hand.flex,curl:hand.curl,shade:.88-.37*swallow};
 }):null;
 if(!mesh)return hands;
 const anchor=pursuerGraspAnchor(actor,reduced);
 for(const [i,screenSide] of SIDES_OF_FACE.entries()){
  const side=-screenSide,lead=screenSide===timing.firstSide;
  const grip=i===0?gripLeft:gripRight,contact=lead?timing.grab:timing.lock;
  const tremor=reduced?0:.013*Math.sin(time*18+i*5)*(1-grip);
  const upper=shotEase(timing.tear+.18+(side<0?0:.12),timing.reveal+.15,time);
  const lower=shotEase(contact-.65,contact-.012,time);
  const guides=shotEase(timing.lock+.16,timing.bite-.22,time);
  const topRoot=anchor(side*.102,1.731,.080);
  const topFold=anchor(side*.273,1.905+.019*snare,.098+tremor);
  const topClaw=anchor(side*(.350-.034*drag),1.874-.030*drag,.209);
  const topTip=anchor(side*(.304-.037*drag),1.782-.046*drag,.265);
  const root=anchor(side*.103,1.579,.080,true);
  const shoulder=anchor(side*.257,1.514-.021*drag,.096,true);
  const wrist=wristPosition(wrists[i],point);
  const near=wrist.map((n,k)=>n+basis.right[k]*screenSide*(.094-.029*grip)+basis.up[k]*(.068+tremor));
  const hinge=wrist.map((n,k)=>n+basis.right[k]*screenSide*(.042-.010*grip)-basis.up[k]*.005);
  const hook=wrist.map((n,k)=>n-basis.right[k]*screenSide*(.013+.025*grip)-basis.up[k]*(.038+.010*grip)-basis.forward[k]*.018);
  const mouth=anchor(side*.070,1.596,.147,true);
  const curl=anchor(side*.028,1.590,.219,true);
  const guideTip=lerp(wrist,curl,.23+.77*swallow);
  const sets=[
   [i,[topRoot,topFold,topClaw,topTip],upper,.051,snare],
   [2+i,[root,shoulder,near,hinge,hook],lower,.061,grip],
   [4+i,[mouth,curl,guideTip],guides,.022,grip]
  ];
  for(const [id,targets,unfold,width,load] of sets){
   const amount=Math.max(.00001,unfold);
   const points=targets.map((p,k)=>lerp(targets[0],p,amount**(.64+k*.26)));
   poseLimb(mesh.vertices,id,points,amount,width,load,basis,id>3);
   if(id<4)poseMembrane(mesh.vertices,id,points.slice(0,3),amount,load,basis);
  }
 }
 return hands;
}
