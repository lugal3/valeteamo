import {HEIGHT,STAIR} from './house-layout.js';
import {ease} from './animations/pose-tools.js';

const HIP=.88,KNEE=.47,ANKLE=.06,SEGMENT=HIP-KNEE,SHOULDER=1.40,ELBOW=1.10;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TAU=Math.PI*2,STRIDE=1.22,STANCE=.60;
export const BED_EXIT={x:2.69,y:HEIGHT,z:1.72,yaw:Math.PI/2};
export const RISE_SECONDS=2.25;

export function pursuerPieces(){
 const parts=[],add=(id,joint,x,y,z,w,h,d,color,extra={})=>parts.push({id,joint,x,y,z,w,h,d,color,solid:false,chibi:true,...extra});
 const round={shape:'round',smooth:true,segments:12,rings:8};
 const bevel={shape:'rounded-box',roundness:.24,segments:8,rings:5};
 const suit=[.23,.26,.32],lapel=[.31,.35,.42],pants=[.16,.18,.24],shirt=[.89,.88,.82];
 const skin=[.94,.79,.73],shade=[.66,.47,.45],hair=[.94,.94,.91],silver=[.70,.73,.77],tie=[.52,.13,.19];
 add('jacket','chest',0,1.21,0,.625,.62,.36,suit,bevel);
 add('shirt','chest',0,1.34,.168,.225,.28,.036,shirt,bevel);
 for(const side of [-1,1]){
  add('collar'+side,'chest',side*.059,1.44,.202,.081,.12,.028,shirt,{roll:side*.38});
  add('lapel'+side,'chest',side*.105,1.33,.201,.094,.31,.044,lapel,{...bevel,roll:side*.33});
  add('shoulder'+side,'arm'+side,side*.284,1.393,-.005,.182,.181,.245,suit,round);
  add('flap'+side,'chest',side*.17,1.068,.176,.136,.032,.026,lapel,bevel);
 }
 add('tie-knot','chest',0,1.408,.218,.063,.054,.03,tie,bevel);
 add('tie','chest',0,1.28,.213,.054,.216,.026,tie,{roll:.052});
 add('presidential-pin','chest',.148,1.378,.226,.032,.032,.013,[.83,.64,.29],round);
 add('pocket-square','chest',.193,1.276,.171,.084,.039,.052,shirt,{...bevel,roll:.11});
 add('pocket-welt','chest',.193,1.256,.195,.104,.023,.022,lapel,bevel);
 for(const y of [1.16,1.068,.985])add('button'+y,'chest',0,y,.182,.024,.024,.013,[.44,.43,.43],round);
 add('waist','hips',0,.94,0,.48,.21,.31,pants,bevel);
 add('neck','head',0,1.52,.007,.16,.18,.16,skin,round);
 add('face','head',0,1.687,0,.351,.414,.329,skin,round);
 add('jaw','head',0,1.605,.042,.285,.151,.251,skin,bevel);
 add('chin','head',0,1.560,.084,.23,.12,.166,skin,round);
 add('nose-bridge','head',0,1.692,.164,.062,.121,.072,skin,round);
 add('nose-tip','head',0,1.646,.196,.083,.057,.066,skin,round);
 add('mouth','head',0,1.590,.166,.106,.012,.019,[.42,.24,.27],round);
 add('hair-back','head',0,1.75,-.057,.348,.277,.254,silver,round);
 add('hair-top','head',-.009,1.861,-.011,.369,.128,.312,hair,{...round,roll:-.17});
 for(let n=0;n<5;n++)add('hair-part'+n,'head',-.137+n*.061,1.868+n*.006,.053,.094,.072,.231,n%2?hair:silver,{...round,roll:-.20,yaw:-.31});
 for(const side of [-1,1]){
  add('ear'+side,'head',side*.174,1.674,-.009,.073,.096,.067,skin,round);
  add('ear-fold'+side,'head',side*.181,1.672,.022,.030,.047,.012,shade,round);
  add('temple'+side,'head',side*.158,1.771,.022,.061,.151,.141,hair,round);
  add('eye-socket'+side,'head',side*.074,1.716,.151,.080,.040,.032,shade,round);
  add('eye-white'+side,'head',side*.074,1.715,.166,.065,.027,.020,[.93,.93,.90],round);
  add('iris'+side,'head',side*.072,1.715,.174,.029,.027,.013,[.23,.56,.89],round);
  add('pupil'+side,'head',side*.072,1.715,.183,.013,.018,.008,[.08,.14,.23],round);
  add('brow'+side,'head',side*.073,1.744,.162,.087,.024,.030,silver,{...round,roll:side*.22});
  add('eye-crease'+side,'head',side*.084,1.686,.157,.063,.009,.012,shade,{...round,roll:side*.15});
  add('cheek-crease'+side,'head',side*.059,1.611,.171,.010,.057,.014,shade,{...round,roll:side*-.33});
  const x=side*.321,leg=side*.136;
  add('upper-arm'+side,'arm'+side,x,1.26,0,.17,.33,.19,suit,bevel);
  add('sleeve'+side,'forearm'+side,x,.98,0,.154,.29,.165,suit,bevel);
  add('cuff'+side,'forearm'+side,x,.827,.013,.145,.054,.148,shirt,bevel);
  add('hand'+side,'forearm'+side,x,.762,.025,.128,.139,.14,skin,round);
  add('thigh'+side,'thigh'+side,leg,.674,0,.209,.43,.228,pants,bevel);
  add('shin'+side,'shin'+side,leg,.275,0,.172,.424,.179,pants,bevel);
  add('shoe'+side,'foot'+side,leg,.071,.060,.176,.142,.325,[.083,.082,.111],bevel);
  add('sole'+side,'foot'+side,leg,.025,.060,.182,.048,.333,[.06,.06,.08],bevel);
 }
 return parts;
}

function footfall(phase,amount){
 const reach=STRIDE*STANCE*.5*amount;
 if(phase<STANCE)return {z:reach*(1-2*phase/STANCE),lift:0,pitch:0};
 const t=(phase-STANCE)/(1-STANCE),curve=t*t*(3-2*t);
 return {z:reach*(2*curve-1),lift:Math.sin(Math.PI*t)*.16*amount,pitch:Math.sin(TAU*t)*.23*amount};
}

function stepOffset(actor,z){
 if(actor.x<STAIR.xMin||actor.x>STAIR.xMax||actor.z<STAIR.zTop||actor.z>STAIR.zBottom)return 0;
 const footZ=actor.z+z*Math.cos(actor.facing??actor.yaw);
 const along=clamp((STAIR.zBottom-footZ)/(STAIR.zBottom-STAIR.zTop),0,1)*16;
 const tread=Math.floor(along),edge=clamp((along-tread)/.19,0,1);
 return (tread+edge*edge*(3-2*edge))*HEIGHT/16-actor.y;
}

export function pursuerPose(actor,reduced=false){
 const amount=clamp((actor.speed??0)/1.42,0,1)*(reduced?.68:1);
 const phase=(actor.walk/STRIDE)%1,step=phase*TAU;
 const sway=Math.sin(step)*.037*amount;
 let hips=-.104*amount+Math.cos(2*step)*.022*amount;
 const feet=[-1,1].map(side=>{
  const cycle=(phase+(side===1?.5:0))%1,foot=footfall(cycle,amount);
  foot.lift+=stepOffset(actor,foot.z);
  const reach=Math.sqrt((2*SEGMENT)**2-foot.z**2);
  hips=Math.min(hips,ANKLE+foot.lift+reach-HIP);
  return {side,cycle,foot};
 });
 const hurry=actor.mode==='chase'?amount:0;
 const joints={hips:{y:hips},chest:{py:1.07,x:sway,y:hips,pitch:.06+hurry*.15,yaw:-Math.sin(step)*.11*amount,roll:sway*.8},
  head:{py:1.52,x:sway,y:hips-.005,z:.033+hurry*.065,yaw:reduced?0:Math.sin((actor.age??0)*2.1)*.17*(1-hurry),pitch:-.02-hurry*.04}};
 for(const {side,cycle,foot} of feet){
  const dy=HIP+hips-ANKLE-foot.lift;
  const thigh=Math.atan2(foot.z,dy)+Math.acos(clamp(Math.hypot(foot.z,dy)/(2*SEGMENT),0,1));
  const kneeZ=Math.sin(thigh)*SEGMENT,kneeY=HIP+hips-Math.cos(thigh)*SEGMENT;
  const shin=Math.atan2(foot.z-kneeZ,kneeY-ANKLE-foot.lift);
  joints['thigh'+side]={py:HIP,x:sway,y:hips,pitch:-thigh};
  joints['shin'+side]={py:KNEE,x:sway,y:kneeY-KNEE,z:kneeZ,pitch:-shin};
  joints['foot'+side]={py:ANKLE,x:sway,y:foot.lift,z:foot.z,pitch:foot.pitch};
  const swing=Math.cos(TAU*cycle)*(.37+hurry*.18)*amount-.11*hurry;
  const shoulderZ=(side*-.037*Math.sin(step)+.033)*amount;
  joints['arm'+side]={py:SHOULDER,x:sway,y:hips,z:shoulderZ,pitch:swing};
  joints['forearm'+side]={py:ELBOW,x:sway,y:hips+(SHOULDER-ELBOW)*(1-Math.cos(swing)),z:shoulderZ-(SHOULDER-ELBOW)*Math.sin(swing),pitch:swing-.13-amount*.20-hurry*.35};
 }
 return joints;
}

export function posePursuer(base,out,groups,actor,reduced=false){
 out.set(base);
 const inBed=['sleeping','lying-down','rising'].includes(actor.mode);
 const bedTime=actor.mode==='rising'?actor.bedTime:actor.mode==='lying-down'?RISE_SECONDS-actor.bedTime:0;
 const t=inBed?bedTime/RISE_SECONDS:1,sit=ease(t/.46),turn=ease((t-.32)/.36),stand=ease((t-.62)/.38);
 const facing=inBed?turn*BED_EXIT.yaw:actor.facing??actor.yaw,c=Math.cos(facing),s=Math.sin(facing);
 const pitchRoot=inBed?-(1-sit)*Math.PI/2:0,cpRoot=Math.cos(pitchRoot),spRoot=Math.sin(pitchRoot);
 const breath=actor.mode==='sleeping'&&!reduced?Math.sin(actor.age*2)*.009:0;
 const originX=inBed?1.76+.53*turn+.40*stand:actor.x;
 const originY=inBed?HEIGHT+.98-.10*stand+breath:actor.y;
 const originZ=inBed?1.27+.45*turn:actor.z;
 const pose=pursuerPose(inBed?{...actor,walk:0,speed:0}:actor,reduced);
 if(inBed){
  const thigh=-1.32*sit*(1-stand),lift=Math.sin(stand*Math.PI)*.10;
  const kneeY=HIP-Math.cos(thigh)*SEGMENT,kneeZ=-Math.sin(thigh)*SEGMENT;
  for(const side of [-1,1]){
   pose['thigh'+side]={py:HIP,pitch:thigh};
   pose['shin'+side]={py:KNEE,y:kneeY-KNEE,z:kneeZ,pitch:lift};
   pose['foot'+side]={py:ANKLE,y:kneeY-KNEE,z:kneeZ};
   pose['arm'+side]={py:SHOULDER,pitch:.22*sit*(1-stand),roll:side*.12*sit*(1-stand)};
   pose['forearm'+side]={py:ELBOW,pitch:-.13*stand-.45*sit*(1-stand)};
  }
  pose.head={py:1.52,pitch:-.02*stand+.16*sit*(1-stand),y:-.005*stand,z:.033*stand,yaw:pose.head.yaw*stand};
  pose.chest={py:1.07,pitch:.06*stand+.25*Math.sin(sit*Math.PI)*(1-stand)};
 }
 for(const {joint,start,end} of groups){
  const {py=0,x=0,y=0,z=0,pitch=0,yaw=0,roll=0}=pose[joint]||{};
  const cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(roll),sr=Math.sin(roll);
  for(let i=start*16;i<end*16;i+=16){
   for(const offset of [0,6,13]){
    const at=i+offset,position=offset===0;
    const a=base[at],b=base[at+1]-(position?py:0),d=base[at+2];
    const u=a*cr-b*sr,v=a*sr+b*cr,n=v*sp+d*cp;
    const lx=u*cy+n*sy+(position?x:0),lz=-u*sy+n*cy+(position?z:0);
    const ly=v*cp-d*sp+(position?py+y-(inBed?HIP:0):0),zRot=ly*spRoot+lz*cpRoot;
    out[at]=lx*c+zRot*s+(position?originX:0);
    out[at+1]=ly*cpRoot-lz*spRoot+(position?originY:0);
    out[at+2]=-lx*s+zRot*c+(position?originZ:0);
   }
  }
 }
}
