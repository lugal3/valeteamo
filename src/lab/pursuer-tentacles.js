import {shotEase} from './capture-shot.js';
import {pursuerGraspAnchor} from './pursuer-model.js';

const RINGS=38,SIDES=17,STRIDE=16,TAU=Math.PI*2;
const TENDRILS=[
 {side:-1,y:1.643,x:.107,z:.103,r:.039,begin:1.58,speed:.74,kind:'wrist'},
 {side:1,y:1.575,x:.088,z:.096,r:.034,begin:1.72,speed:.66,kind:'wrist'},
 {side:-1,y:1.749,x:.092,z:.086,r:.029,begin:1.53,speed:.86,kind:'upper'},
 {side:1,y:1.672,x:.112,z:.080,r:.025,begin:1.81,speed:.79,kind:'upper'},
 {side:1,y:1.557,x:.022,z:.125,r:.040,begin:2.55,speed:.47,kind:'throat'}
];
const sub=(a,b)=>a.map((n,k)=>n-b[k]);
const lerp=(a,b,t)=>a.map((n,k)=>n+(b[k]-n)*t);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
function unit(v){const m=Math.hypot(...v)||1;return v.map(n=>n/m);}

function sample(points,t){
 const scaled=t*(points.length-1),i=Math.min(points.length-2,Math.floor(scaled)),s=scaled-i,s2=s*s,s3=s2*s;
 const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
 const span=Math.hypot(...sub(c,b)),before=Math.hypot(...sub(b,a)),after=Math.hypot(...sub(d,c));
 const inScale=span/(before+span||1),outScale=span/(span+after||1);
 return b.map((v,k)=>(2*s3-3*s2+1)*v+(-2*s3+3*s2)*c[k]
  +(s3-2*s2+s)*(c[k]-a[k])*inScale+(s3-s2)*(d[k]-b[k])*outScale);
}

function handPose(side,time,grip,drag,swallow,reduced){
 const raise=shotEase(side<0?1.78:1.92,side<0?2.15:2.31,time);
 const pull=grip*drag,wave=reduced?0:Math.sin(time*16+side*1.5)*raise*(1-grip);
 return {
  x:side*(.209+.055*swallow+.018*grip-.039*pull),
  y:-.253+.065*raise+.045*grip-.026*pull+.031*wave,
  z:.303+.025*raise-.028*grip+.091*pull,
  roll:side*(.27+grip*.58-wave*.10),flex:.43+raise*.16+grip*.38,raise
 };
}

export function createTentacleMesh(){
 const vertices=new Float32Array(TENDRILS.length*(RINGS+1)*(SIDES+1)*STRIDE),indices=[];
 for(let i=0;i<TENDRILS.length;i++)for(let row=0;row<RINGS;row++)for(let side=0;side<SIDES;side++){
  const a=(i*(RINGS+1)+row)*(SIDES+1)+side,b=a+1,c=a+SIDES+1,d=c+1;
  indices.push(a,d,b,a,c,d);
 }
 return {vertices,indices:new Uint16Array(indices)};
}

export function captureGrasp(camera,basis,actor,grasp,mesh){
 const {time,snare,drag,swallow,reduced,gripLeft=snare,gripRight=snare}=grasp;
 const origin=[camera.x,camera.y,camera.z];
 const point=(x,y,z)=>origin.map((n,i)=>n+basis.right[i]*x+basis.up[i]*y+basis.forward[i]*z);
 const anchor=pursuerGraspAnchor(actor,reduced);
 const wristPose=[handPose(-1,time,gripLeft,drag,swallow,reduced),handPose(1,time,gripRight,drag,swallow,reduced)];
 const hands=time>1.78&&swallow<.92?wristPose.map(hand=>{
  if(!hand.raise)return null;
  const [x,y,z]=point(hand.x,hand.y,hand.z);
  return {x,y,z,roll:hand.roll,flex:hand.flex};
 }):null;
 const vertices=mesh.vertices;
 for(const [id,{side,x,y,z,r,begin,speed,kind}] of TENDRILS.entries()){
  const amount=shotEase(begin,begin+speed,time);
  const screenSide=-side;
  const grip=screenSide<0?gripLeft:gripRight;
  const grab=grip*(1-.23*swallow);
  const flick=reduced?0:.017*Math.sin(time*15+id*2)*(1-grab);
  const lower=id===1||kind==='throat';
  const root=anchor(side*x,y,z,lower);
  const shoulder=anchor(side*(x+.078*amount),y+(lower?-.021:.043)*amount,z+.068*amount,lower);
  let waypoints;
  if(kind==='wrist'){
   const hand=wristPose[screenSide<0?0:1];
   // The curl follows the same posed wrist that the renderer draws.
   const cx=hand.x+screenSide*.022,cy=hand.y-.043,cz=hand.z-.031;
   const radius=.076-.025*grip;
   const coil=Array.from({length:5},(_,i)=>{
    const t=i/4,angle=-.58+(3.35+grab*1.97)*t;
    return point(cx+screenSide*Math.cos(angle)*radius,cy+Math.sin(angle)*radius*.79,
     cz-.033*t+.025*(1-grab));
   });
   waypoints=[
    root,shoulder,point(cx+screenSide*.106,cy+.052+flick,cz+.128),...coil
   ];
  }else if(kind==='upper'){
   waypoints=[root,shoulder,point(screenSide*(.277-.053*snare),.139+flick,.336),
    point(screenSide*(.241-.043*snare),.153+.037*drag,.246),
    point(screenSide*(.184-.126*swallow),.103-.031*swallow,.195),
    point(screenSide*(.117-.085*swallow),.044-.015*drag,.111+.055*swallow)];
  }else{
   waypoints=[root,anchor(-.059,1.575,.164,true),point(-.122,-.070,.284),
    point(-.089,-.118,.215),point(.061,-.092,.131),point(.102,-.014,.097)];
  }
  const frames=waypoints.map((p,i)=>lerp(root,p,i<2?Math.max(.002,amount):Math.max(.002,amount**(.84+i*.22))));
  let lastNormal=null;
  for(let row=0;row<=RINGS;row++){
   const u=row/RINGS;
   const center=sample(frames,u);
   const tangent=unit(sub(sample(frames,Math.min(1,u+.015)),sample(frames,Math.max(0,u-.015))));
   // Transport the frame down the curve so the tube cannot flip at a bend.
   const along=lastNormal?dot(lastNormal,tangent):0;
   const plane=lastNormal?.map((v,i)=>v-along*tangent[i]);
   const normal=unit(plane&&dot(plane,plane)>.01?plane:cross(Math.abs(tangent[1])>.91?basis.right:basis.up,tangent));
   lastNormal=normal;
   const binormal=cross(tangent,normal);
   const taper=(1-u)**.63;
   const tension=grip*Math.sin(Math.PI*u)**2;
   const contraction=Math.sin(u*17-grip*4.0-id*.7)*.057*grip;
   const thickness=(r*taper+.0006)*amount*(1+.14*Math.sin(u*15+id)+.065*Math.sin(u*51-id)+contraction+.11*tension);
   for(let sideIndex=0;sideIndex<=SIDES;sideIndex++){
    const v=sideIndex/SIDES,theta=v*TAU+u*1.26;
    const c=Math.cos(theta),s=Math.sin(theta),rib=.95+.05*Math.cos(theta*3+u*29);
    const ventral=Math.max(0,Math.sin(theta-.9))**3;
    const shade=.90+.10*Math.sin(u*173+id)+.04*Math.sin(u*373+theta*6);
    const index=((id*(RINGS+1)+row)*(SIDES+1)+sideIndex)*STRIDE;
    for(let j=0;j<3;j++){
     const direction=normal[j]*c+binormal[j]*s;
     vertices[index+j]=center[j]+direction*thickness*rib;
     vertices[index+6+j]=direction;
     vertices[index+13+j]=tangent[j];
    }
    vertices[index+3]=(.155+.115*ventral)*shade;
    vertices[index+4]=(.031+.043*ventral)*shade;
    vertices[index+5]=(.048+.034*ventral)*shade;
    vertices[index+9]=u;vertices[index+10]=v;vertices[index+11]=12;
   }
  }
 }
 return hands;
}
