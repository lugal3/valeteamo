import {poseEmy} from './emy-cat.js';
import {animateFurniture} from './furniture-motion.js';
import {Pursuer} from './pursuer.js';
import {blocked,groundHeight} from './world.js';

export const EMY_ENTRANCE_SECONDS=3.5;
const WINDOW_START={x:2.2,y:1.17,z:12.48};
const WINDOW_END={x:2.65,y:0,z:10.75};
const TRUNK_APPROACH={x:2.08,y:0,z:2.25};
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const deltaAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

export function createEmyCompanion(cat,{waiting=true}={}){
 const companion={cat,stage:waiting?'waiting':'following',age:0,entranceAge:0,trail:[],route:[],stuck:0,planner:null,hiddenAt:null};
 companion.lidAmount=0;
 if(!waiting){Object.assign(cat,{x:5.1,y:0,z:10.65,yaw:Math.PI});poseEmy(cat,{mode:'sit'});}
 setVisibility(companion,waiting);
 return companion;
}
function setVisibility(companion,hidden){
 companion.cat.hidden=hidden;
 for(const {box} of companion.cat.parts)box.hiddenGeometry=hidden;
}
export function beginEmyEntrance(companion){
 if(companion.stage!=='waiting')return false;
 Object.assign(companion,{stage:'entrance',entranceAge:0,trail:[],route:[]});
 Object.assign(companion.cat,WINDOW_START,{yaw:Math.PI});
 setVisibility(companion,false);
 poseEmy(companion.cat,{mode:'sit'});
 return true;
}
export function emyEntranceCamera(camera,progress,reduced=false){
 // Kitty looks over her shoulder toward the living-room window, then back to the door.
 const look=smooth(progress/.27)*(1-smooth((progress-.78)/.22));
 const peek=camera.x<4.4?{x:camera.x,z:camera.z}:{x:4.85,z:6.2};
 const windowYaw=Math.atan2(2.2-peek.x,12.2-peek.z);
 if(reduced)return {...camera,...peek,yaw:windowYaw,pitch:-.08};
 return {...camera,x:camera.x+(peek.x-camera.x)*look,z:camera.z+(peek.z-camera.z)*look,
  yaw:camera.yaw+deltaAngle(camera.yaw,windowYaw)*look,
  pitch:camera.pitch+(-.08-camera.pitch)*look};
}
export function sendEmyToTrunk(companion){
 if(['waiting','trunk','trunk-enter'].includes(companion.stage))return false;
 companion.stage='trunk-run';companion.trail=[];companion.route=[];companion.stuck=0;
 companion.cat.reaction=0;
 setVisibility(companion,false);
 return true;
}
export function snapshotEmyCompanion(companion){
 const {cat,stage}=companion;
 return {stage:stage==='entrance'?'following':stage==='trunk-enter'?'trunk':stage,
  x:cat.x,y:cat.y,z:cat.z,yaw:cat.yaw};
}
export function restoreEmyCompanion(companion,saved,storyPhase='explore'){
 const valid=['waiting','following','hiding','trunk-run','trunk'];
 const stage=valid.includes(saved?.stage)?saved.stage:storyPhase==='explore'?'waiting':['sleep','patrol','hide','resting','arrival'].includes(storyPhase)?'following':'trunk';
 companion.stage=stage;companion.trail=[];companion.route=[];companion.stuck=0;
 if(['following','hiding','trunk-run'].includes(stage)&&[saved?.x,saved?.y,saved?.z,saved?.yaw].every(Number.isFinite))
  Object.assign(companion.cat,{x:saved.x,y:saved.y,z:saved.z,yaw:saved.yaw});
 else if(stage==='trunk')Object.assign(companion.cat,TRUNK_APPROACH,{yaw:-Math.PI/2});
 else if(stage!=='waiting')Object.assign(companion.cat,{x:5.1,y:0,z:10.65,yaw:Math.PI});
 setVisibility(companion,['waiting','hiding','trunk'].includes(stage));
 poseEmy(companion.cat,{mode:'sit'});
}
function planRoute(companion,world,goal){
 const {cat}=companion;
 const planner=companion.planner??=new Pursuer(world);
 Object.assign(planner,{x:cat.x,y:cat.y,z:cat.z});
 if(planner.plan(goal))companion.route=planner.path.map(({x,y,z})=>({x,y,z}));
}
function moveToward(companion,world,goal,dt,speed){
 const cat=companion.cat,dx=goal.x-cat.x,dz=goal.z-cat.z,d=Math.hypot(dx,dz);
 if(d<.055)return false;
 const step=Math.min(d,speed*dt),nx=cat.x+dx/d*step,nz=cat.z+dz/d*step;
 const y=groundHeight(nx,nz,cat.y,world.hatch?.amount>.92);
 if(!Number.isFinite(y)||Math.abs(y-cat.y)>.30||blocked(world.boxes,nx,y,nz,.14,.62))return false;
 cat.x=nx;cat.y=y;cat.z=nz;cat.yaw+=deltaAngle(cat.yaw,Math.atan2(dx,dz))*(1-Math.exp(-12*dt));
 return true;
}
export function updateEmyCompanion(companion,delta,{world,player,reduced=false,finale=false}={}){
 const cat=companion.cat,dt=Number.isFinite(delta)?Math.max(0,Math.min(.1,delta)):0;
 if(finale){setVisibility(companion,true);return null;}
 if(companion.stage==='waiting'||companion.stage==='trunk')return null;
 companion.age+=dt;cat.age+=dt;
 if(companion.stage==='entrance'){
  const previous=companion.entranceAge/EMY_ENTRANCE_SECONDS;
  companion.entranceAge=Math.min(EMY_ENTRANCE_SECONDS,companion.entranceAge+dt);
  const t=companion.entranceAge/EMY_ENTRANCE_SECONDS;
  const p=smooth((t-.30)/.55);
  cat.x=WINDOW_START.x+(WINDOW_END.x-WINDOW_START.x)*p;
  cat.z=WINDOW_START.z+(WINDOW_END.z-WINDOW_START.z)*p;
  cat.y=1.17*(1-p)+Math.sin(p*Math.PI)*.51;
  cat.yaw=Math.atan2(WINDOW_END.x-WINDOW_START.x,WINDOW_END.z-WINDOW_START.z);
  poseEmy(cat,{mode:p>.04&&p<.98?'jump':'sit',phase:cat.age,blend:1-Math.exp(-24*dt)});
  if(t>=1){cat.y=0;companion.stage='following';companion.trail=[{...WINDOW_END}];return 'landed';}
  return previous<.3&&t>=.3?'jump':null;
 }
 const hide=player?.hidden;
 if(companion.stage==='hiding'&&!hide){
  companion.stage='following';companion.hiddenAt=null;
  // She reappears at the safe floor position where she followed Kitty in.
  setVisibility(companion,false);
 }
 if(companion.stage==='following'&&player&&!hide){
  const last=companion.trail.at(-1);
  if(!last||Math.hypot(player.x-last.x,player.z-last.z,2*(player.y-last.y))>.30){
   companion.trail.push({x:player.x,y:player.y,z:player.z});
   if(companion.trail.length>450)companion.trail.shift();
  }
 }
 if(companion.stage==='trunk-run'&&!companion.route.length&&distance(cat,TRUNK_APPROACH)>.42)
  planRoute(companion,world,TRUNK_APPROACH);
 if(companion.stage==='following'&&hide&&distance(cat,{x:player.x,z:player.z})<.9&&Math.abs(cat.y-player.y)<.45){
  companion.stage='hiding';companion.hiddenAt=hide.objectId;
  setVisibility(companion,true);
  return 'hid';
 }
 if(companion.stage==='hiding')return null;
 const heading=companion.stage==='trunk-run'?TRUNK_APPROACH:player;
 if(!heading)return null;
 if(companion.stage==='trunk-run'&&distance(cat,TRUNK_APPROACH)<.42&&Math.abs(cat.y)<.25){
  const trunk=world.objects.find(object=>object.id==='hide-trunk');
  if(hide?.objectId===trunk.id)return null;
  companion.stage='trunk-enter';
  companion.entranceAge=0;
  companion.route=[];
  companion.jumpStart={x:cat.x,z:cat.z,yaw:cat.yaw};
  companion.trunk=trunk;
 }
 if(companion.stage==='trunk-enter'){
  const t=companion.entranceAge+=dt;
  const start=companion.jumpStart;
  const inside=companion.trunk.hideCamera;
  // Turn along the long axis. Lift clear of the wooden side before crossing it.
  const travel=smooth((t-.65)/.65);
  cat.x=start.x+(inside.x-start.x)*travel;
  cat.z=start.z+(inside.z-start.z)*travel;
  cat.y=.80*smooth((t-.40)/.26)-.65*smooth((t-1.25)/.42);
  cat.yaw=start.yaw+deltaAngle(start.yaw,-Math.PI/2)*smooth(t/.42);
  companion.lidAmount=smooth(t/.42)*(1-smooth((t-1.73)/.52));
  const mode=t<.40?'idle':t<1.20?'jump':'sleep';
  poseEmy(cat,{mode,phase:cat.age,blend:1-Math.exp(-23*dt)});
  if(t>=2.25){
   companion.stage='trunk';
   setVisibility(companion,true);
   return 'trunk';
  }
  return 'entering-trunk';
 }
 let goal=heading;
 while(companion.route.length&&distance(cat,companion.route[0])<.12&&Math.abs(cat.y-companion.route[0].y)<.24)companion.route.shift();
 if(companion.route.length)goal=companion.route[0];
 else if(companion.stage==='following'){
  while(companion.trail.length>1&&distance(cat,companion.trail[0])<.22&&Math.abs(cat.y-companion.trail[0].y)<.27)companion.trail.shift();
  if(companion.trail.length)goal=companion.trail[0];
 }
 const far=distance(cat,heading)> (hide?.28:companion.stage==='following'?.88:.32)||Math.abs(cat.y-heading.y)>.25;
 let walking=false;
 if(companion.stage==='trunk-run'&&companion.route.length){
  // The study door can be closed again after Kitty collects the key.
  for(const door of world.objects){
   if(door.kind!=='door'||door.open||door.motion||door.locked||door.sealed)continue;
   if(Math.abs(door.y-1.1-cat.y)>.4||distance(cat,door.origin)>1.1)continue;
   if(companion.route.slice(0,5).some(node=>distance(node,door.origin)<.55))
    animateFurniture(door,true,{player,reducedMotion:reduced});
  }
 }
 if(far&&cat.reaction<=0)walking=moveToward(companion,world,goal,dt,companion.stage==='trunk-run'?1.4:1.23);
 if(!walking&&far&&cat.reaction<=0){
  companion.stuck+=dt;
  if(companion.stuck>1.2){planRoute(companion,world,goal);companion.stuck=0;}
 }else companion.stuck=0;
 if(companion.stage==='following'&&hide&&distance(cat,heading)<.9&&Math.abs(cat.y-heading.y)<.45){
  companion.stage='hiding';companion.hiddenAt=hide.objectId;setVisibility(companion,true);return 'hid';
 }
 if(cat.reaction>0&&player){
  const facing=Math.atan2(player.x-cat.x,player.z-cat.z);
  cat.yaw+=deltaAngle(cat.yaw,facing)*(1-Math.exp(-6*dt));

 }
 const mode=cat.reaction>0?'purr':walking?'walk':'sit';
 if(cat.reaction>0)cat.reaction=Math.max(0,cat.reaction-dt);
 cat.phase=mode;poseEmy(cat,{mode,walking,reduced,phase:cat.age,blend:1-Math.exp(-dt*10)});
 return null;
}
