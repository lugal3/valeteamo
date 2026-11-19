import {shotEase} from './capture-shot.js';

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
function unit(v){const m=Math.hypot(...v)||1;return v.map(n=>n/m);}

function sample(points,t){
 const scaled=t*(points.length-1),i=Math.min(points.length-2,Math.floor(scaled)),s=scaled-i,s2=s*s,s3=s2*s;
 const a=points[Math.max(0,i-1)],b=points[i],c=points[i+1],d=points[Math.min(points.length-1,i+2)];
 return b.map((v,k)=>.5*((2*v)+(c[k]-a[k])*s+(2*a[k]-5*v+4*c[k]-d[k])*s2+(3*v-a[k]-3*c[k]+d[k])*s3));
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
 const {time,snare,drag,swallow,reduced}=grasp;
 const origin=[camera.x,camera.y,camera.z];
 const point=(x,y,z)=>origin.map((n,i)=>n+basis.right[i]*x+basis.up[i]*y+basis.forward[i]*z);
 const sin=Math.sin(actor.facing),cos=Math.cos(actor.facing);
 const body=(x,y,z)=>[actor.x+x*cos+z*sin,actor.y+y,actor.z-x*sin+z*cos];
 const lift=shotEase(1.83,2.29,time),flail=reduced?0:Math.sin(time*22)*lift*(1-snare)*.035;
 const handX=.204+swallow*.074, handY=-.228+lift*.058+snare*.030-drag*.026, handZ=.320-drag*.057+swallow*.04;
 const hands=lift>0&&swallow<.85?[-1,1].map(side=>{
  const [x,y,z]=point(side*handX,handY+side*flail,handZ);
  return {x,y,z,roll:side*(.33+snare*.37),flex:.74+snare*.29};
 }):null;
 const vertices=mesh.vertices;
 for(const [id,{side,x,y,z,r,begin,speed,kind}] of TENDRILS.entries()){
  const amount=shotEase(begin,begin+speed,time);
  const screenSide=-side;
  const grab=snare*(1-.23*swallow);
  const flick=reduced?0:.017*Math.sin(time*15+id*2)*(1-grab);
  const root=body(side*x,y-.031*swallow,z+.030*swallow);
  const shoulder=body(side*(x+.093*amount),y+(id===1?-.032:.059)*amount,z+.071*amount);
  let waypoints;
  if(kind==='wrist'){
   waypoints=[
    root,shoulder,point(screenSide*(handX+.113),handY+.053+flick,handZ+.109),
    point(screenSide*(handX+.047),handY+.016,handZ+.052),point(screenSide*(handX-.036),handY-.034,handZ),
    point(screenSide*(handX-.010),handY-.073,handZ-.019),point(screenSide*(handX+.059),handY-.043,handZ-.042)
   ];
  }else if(kind==='upper'){
   waypoints=[root,shoulder,point(screenSide*(.277-.053*snare),.139+flick,.336),
    point(screenSide*(.241-.043*snare),.153+.037*drag,.246),
    point(screenSide*(.184-.126*swallow),.103-.031*swallow,.195),
    point(screenSide*(.117-.085*swallow),.044-.015*drag,.111+.055*swallow)];
  }else{
   waypoints=[root,body(-.069,1.512,.188),point(-.122,-.070,.284),
    point(-.089,-.118,.215),point(.061,-.092,.131),point(.102,-.014,.097)];
  }
  const frames=waypoints.map((p,i)=>lerp(root,p,i<2?Math.max(.002,amount):Math.max(.002,amount**(.84+i*.22))));
  for(let row=0;row<=RINGS;row++){
   const u=row/RINGS;
   const center=sample(frames,u);
   const tangent=unit(sub(sample(frames,Math.min(1,u+.015)),sample(frames,Math.max(0,u-.015))));
   const normal=unit(cross(Math.abs(tangent[1])>.91?basis.right:basis.up,tangent)),binormal=cross(tangent,normal);
   const taper=(1-u)**.63;
   const tension=snare*Math.sin(Math.PI*u)**2;
   const thickness=(r*taper+.0006)*amount*(1+.14*Math.sin(u*15+id)+.065*Math.sin(u*51-id)+.11*tension);
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
