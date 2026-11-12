import {HEIGHT,STAIR} from './house-layout.js';

const HIP=.88,KNEE=.47,ANKLE=.06,SEGMENT=HIP-KNEE,SHOULDER=1.40,ELBOW=1.10;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const TAU=Math.PI*2,STRIDE=1.22,STANCE=.60;

export function pursuerPieces(){
 const parts=[],add=(id,joint,x,y,z,w,h,d,color,extra={})=>parts.push({id,joint,x,y,z,w,h,d,color,solid:false,chibi:true,...extra});
 const round={shape:'round',smooth:true,segments:12,rings:8};
 const bevel={shape:'rounded-box',roundness:.24,segments:8,rings:5};
 const suit=[.18,.20,.27],lapel=[.24,.26,.34],pants=[.14,.15,.22],shirt=[.89,.88,.82];
 const skin=[.93,.75,.68],shade=[.76,.56,.53],hair=[.91,.91,.89],silver=[.71,.73,.75],tie=[.39,.11,.16];
 add('jacket','chest',0,1.21,0,.59,.62,.34,suit,bevel);
 add('shirt','chest',0,1.34,.168,.225,.28,.036,shirt,bevel);
 for(const side of [-1,1]){
  add('collar'+side,'chest',side*.059,1.44,.202,.081,.12,.028,shirt,{roll:side*.38});
  add('lapel'+side,'chest',side*.105,1.33,.193,.079,.29,.034,lapel,{roll:side*.33});
  add('flap'+side,'chest',side*.17,1.068,.176,.136,.032,.026,lapel,bevel);
 }
 add('tie-knot','chest',0,1.408,.218,.063,.054,.03,tie,bevel);
 add('tie','chest',0,1.28,.213,.054,.216,.026,tie,{roll:.052});
 add('presidential-pin','chest',.148,1.378,.226,.032,.032,.013,[.83,.64,.29],round);
 for(const y of [1.16,1.068,.985])add('button'+y,'chest',0,y,.182,.024,.024,.013,[.44,.43,.43],round);
 add('waist','hips',0,.94,0,.48,.21,.31,pants,bevel);
 add('neck','head',0,1.52,.007,.16,.18,.16,skin,round);
 add('face','head',0,1.687,0,.327,.393,.319,skin,round);
 add('chin','head',0,1.566,.078,.23,.135,.16,skin,round);
 add('nose','head',0,1.665,.156,.082,.108,.088,skin,round);
 add('mouth','head',0,1.591,.153,.097,.014,.015,[.44,.26,.28],round);
 add('hair-back','head',0,1.75,-.057,.348,.277,.254,silver,round);
 add('hair-top','head',-.009,1.85,-.005,.363,.13,.307,hair,{...round,roll:-.17});
 for(let n=0;n<4;n++)add('hair-part'+n,'head',-.11+n*.05,1.859+n*.004,.077,.10,.063,.19,n%2?hair:silver,{...round,roll:-.20,yaw:.26});
 for(const side of [-1,1]){
  add('ear'+side,'head',side*.166,1.678,-.009,.068,.093,.063,skin,round);
  add('temple'+side,'head',side*.153,1.760,.027,.060,.14,.130,hair,round);
  add('eye-white'+side,'head',side*.072,1.713,.150,.065,.031,.024,[.92,.92,.89],round);
  add('iris'+side,'head',side*.070,1.712,.162,.031,.029,.016,[.24,.55,.82],round);
  add('pupil'+side,'head',side*.069,1.712,.172,.013,.019,.008,[.08,.14,.23],round);
  add('brow'+side,'head',side*.072,1.742,.145,.082,.017,.029,silver,{...round,roll:side*.10});
  add('crease'+side,'head',side*.084,1.685,.150,.063,.012,.012,shade,{...round,roll:side*.12});
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
 const hurry=['chase','rc-chase'].includes(actor.mode)?amount:0;
 const joints={hips:{y:hips},chest:{py:1.07,x:sway,y:hips,pitch:.06+hurry*.15,yaw:-Math.sin(step)*.11*amount,roll:sway*.8},
  head:{py:1.52,x:sway,y:hips-.005,z:.033+hurry*.065,yaw:reduced?0:Math.sin((actor.age??0)*(hurry?3.7:2.1))*(hurry?.065:.17),pitch:-.02-hurry*.07}};
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
 if(actor.mode==='sleeping'){
  const breath=reduced?0:Math.sin(actor.age*2)*.009;
  for(let i=0;i<out.length;i+=16){
   out[i]=base[i]+1.76;out[i+1]=HEIGHT+1.03+base[i+2]+breath;out[i+2]=2.15-base[i+1];
   for(const k of [6,13]){out[i+k+1]=base[i+k+2];out[i+k+2]=-base[i+k+1];}
  }
  return;
 }
 const facing=actor.facing??actor.yaw,c=Math.cos(facing),s=Math.sin(facing),pose=pursuerPose(actor,reduced);
 for(const {joint,start,end} of groups){
  const {py=0,x=0,y=0,z=0,pitch=0,yaw=0,roll=0}=pose[joint]||{};
  const cp=Math.cos(pitch),sp=Math.sin(pitch),cy=Math.cos(yaw),sy=Math.sin(yaw),cr=Math.cos(roll),sr=Math.sin(roll);
  for(let i=start*16;i<end*16;i+=16){
   for(const offset of [0,6,13]){
    const at=i+offset,position=offset===0;
    const a=base[at],b=base[at+1]-(position?py:0),d=base[at+2];
    const u=a*cr-b*sr,v=a*sr+b*cr,n=v*sp+d*cp;
    const lx=u*cy+n*sy+(position?x:0),lz=-u*sy+n*cy+(position?z:0);
    out[at]=lx*c+lz*s+(position?actor.x:0);
    out[at+1]=v*cp-d*sp+(position?py+y+actor.y:0);
    out[at+2]=-lx*s+lz*c+(position?actor.z:0);
   }
  }
 }
}
