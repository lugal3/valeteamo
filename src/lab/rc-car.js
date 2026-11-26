import {navigate} from './navigation.js';
import {blocked,groundHeight,lineBlocked} from './world.js';
import {inHatch} from './basement.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const RC_SPEED=3.4;
export const RC_ACCEL=9.5;
export const RC_BRAKE=14;
export const RC_IDLE_DECEL=11;
// Wider view ONLY while the RC tablet is in driving mode (the house stays unchanged).
export const RC_PROJECTION=1.02;
export const RC_CAMERA_DISTANCE=2.05;
export const RC_DEPLOY_SECONDS=1;
export const RC_NOISE_SECONDS=8;
export const RC_RECOVERY_SPOTS=Object.freeze([
 {x:12.35,y:3.15,z:4.19},
 {x:9.75,y:3.15,z:2.48},
 {x:6.1,y:0,z:10.15},
 {x:2.72,y:0,z:8.14}
]);
export function createRC(object){
 return {object,mode:'packed',x:object.x,y:object.y-.14,z:object.z,yaw:Math.PI,elapsed:0,noise:0,beeps:0,crashes:0,velocity:0,driveSpeed:0,steerAngle:0,roll:0,tilt:0,suspension:0,travel:0,signal:1};
}
export function deployRC(rc,player,world){
 if(!['packed','parked'].includes(rc.mode))return false;
 if(rc.mode==='packed'){
  const dx=Math.sin(player.yaw)*.75,dz=Math.cos(player.yaw)*.75;
  const x=player.x+dx,z=player.z+dz,y=groundHeight(x,z,player.y,world.hatch?.amount===1);
  if(!Number.isFinite(y)||Math.abs(y-player.y)>.30||blocked(world.boxes,x,y,z,.22,.30))return false;
  Object.assign(rc,{x,z,y,yaw:player.yaw});
 }
 rc.mode='deploying';rc.elapsed=0;rc.driveSpeed=0;rc.steerAngle=0;rc.roll=0;rc.tilt=0;rc.suspension=0;rc.travel=0;rc.signal=1;rc.object.taken=false;rc.object.interactable=false;
 syncRCObject(rc);return true;
}
export function syncRCObject(rc){
 Object.assign(rc.object,{x:rc.x,y:rc.y+.14,z:rc.z,yaw:rc.yaw,mode:rc.mode,roll:rc.roll||0,tilt:rc.tilt||0,suspension:rc.suspension||0});
}
export function driveRC(rc,world,input,dt){
 if(rc.mode!=='driving'||dt<=0)return 0;
 const step=clamp(dt,0,.055);
 const steer=clamp(Number.isFinite(input?.steer)?input.steer:0,-1,1);
 const throttle=clamp(Number.isFinite(input?.throttle)?input.throttle:0,-1,1);
 const desired=RC_SPEED*throttle;
 const current=Number.isFinite(rc.driveSpeed)?rc.driveSpeed:0;
 const rate=!throttle?RC_IDLE_DECEL:current*desired<0?RC_BRAKE:Math.abs(desired)<Math.abs(current)?RC_BRAKE:RC_ACCEL;
 rc.driveSpeed=current+clamp(desired-current,-rate*step,rate*step);
 if(Math.abs(rc.driveSpeed)<.025&&Math.abs(throttle)<.02)rc.driveSpeed=0;
 const steerBlend=1-Math.exp(-12*step);
 rc.steerAngle=(rc.steerAngle||0)+(steer-(rc.steerAngle||0))*steerBlend;
 const pace=Math.min(1,Math.abs(rc.driveSpeed)/.75);
 rc.yaw+=rc.steerAngle*step*2.65*pace*(rc.driveSpeed<0?-1:1);
 const speed=rc.driveSpeed,dx=Math.sin(rc.yaw)*speed*step,dz=Math.cos(rc.yaw)*speed*step;
 const before={x:rc.x,y:rc.y,z:rc.z},car={x:rc.x,y:rc.y,z:rc.z};
 const distance=navigate(car,world,dx,dz,.38);
 Object.assign(rc,{x:car.x,y:car.y,z:car.z});
 rc.velocity=distance/Math.max(step,.001);
 if(distance<Math.abs(speed*step)*.12&&Math.abs(speed)>.3)rc.driveSpeed*=.26;
 const blend=1-Math.exp(-11*step);
 const targetRoll=clamp(-rc.steerAngle*rc.velocity*.045,-.14,.14);
 const targetTilt=clamp(-Math.atan2(rc.y-before.y,Math.max(.03,distance))*Math.sign(speed||1),-.34,.34);
 rc.roll=(rc.roll||0)+(targetRoll-(rc.roll||0))*blend;
 rc.tilt=(rc.tilt||0)+(targetTilt-(rc.tilt||0))*blend;
 rc.travel=(rc.travel||0)+distance;
 const stair=distance>.002&&Math.abs(rc.y-before.y)>.002;
 const targetBump=stair?Math.sin(rc.travel*28)*.016:0;
 rc.suspension=(rc.suspension||0)+(targetBump-(rc.suspension||0))*blend;
 syncRCObject(rc);
 return Math.hypot(rc.x-before.x,rc.z-before.z);
}
export function beepRC(rc){
 if(rc.mode!=='driving')return false;
 rc.noise=RC_NOISE_SECONDS;rc.beeps++;return true;
}
export function updateRC(rc,dt){
 if(rc.mode==='deploying'){rc.elapsed+=dt;if(rc.elapsed>=RC_DEPLOY_SECONDS){rc.elapsed=RC_DEPLOY_SECONDS;rc.mode='driving';}}
 rc.noise=Math.max(0,rc.noise-dt);
}
export function stopRC(rc){
 if(rc.mode==='driving'||rc.mode==='deploying'){rc.mode='parked';rc.noise=0;rc.velocity=0;rc.driveSpeed=0;rc.roll=0;rc.tilt=0;rc.suspension=0;syncRCObject(rc);return true;}
 return false;
}
export function crashRC(rc,world){
 rc.crashes++;rc.mode='disabled';rc.noise=0;rc.velocity=0;rc.driveSpeed=0;rc.roll=0;rc.tilt=0;rc.suspension=0;rc.signal=0;
 const choices=RC_RECOVERY_SPOTS.slice(rc.crashes%RC_RECOVERY_SPOTS.length).concat(RC_RECOVERY_SPOTS.slice(0,rc.crashes%RC_RECOVERY_SPOTS.length));
 const pos=choices.find(p=>!blocked(world.boxes,p.x,p.y,p.z,.20,.4))||RC_RECOVERY_SPOTS[0];
 Object.assign(rc,{x:pos.x,y:pos.y,z:pos.z,yaw:0});
 rc.object.taken=false;rc.object.interactable=true;
 syncRCObject(rc);return pos;
}
export function recoverRC(rc){
 if(rc.mode!=='disabled'&&rc.mode!=='parked')return false;
 rc.mode='packed';rc.object.taken=true;rc.object.interactable=false;rc.noise=0;rc.driveSpeed=0;rc.roll=0;rc.tilt=0;rc.suspension=0;rc.signal=1;
 return true;
}
export function rcCamera(rc,world){
 const forward={x:Math.sin(rc.yaw),z:Math.cos(rc.yaw)};
 const target={x:rc.x,y:rc.y+.18,z:rc.z};
 const ideal={x:rc.x-forward.x*RC_CAMERA_DISTANCE,y:rc.y+1.05,z:rc.z-forward.z*RC_CAMERA_DISTANCE};
 // Avoid placing the chase camera behind a solid wall when going down stairs.
 const occluded=lineBlocked(world.boxes,ideal,target);
 const camera=occluded?{x:rc.x-forward.x*.62,y:rc.y+.62,z:rc.z-forward.z*.62}:ideal;
 const distance=Math.hypot(target.x-camera.x,target.z-camera.z);
 return {...camera,yaw:rc.yaw,pitch:Math.atan2(target.y-camera.y,distance)};
}
// Camera stabilization is visual only: the world position and collision authority
// remain in navigate(). Teleports/recoveries reset via a distance threshold.
export function advanceRCCamera(previous,target,dt,reduced=false){
 if(!previous||reduced||dt<=0)return {...target};
 const gap=Math.hypot(target.x-previous.x,target.y-previous.y,target.z-previous.z);
 if(!Number.isFinite(gap)||gap>2.5)return {...target};
 const t=1-Math.exp(-Math.min(.1,dt)*12);
 const deltaYaw=Math.atan2(Math.sin(target.yaw-previous.yaw),Math.cos(target.yaw-previous.yaw));
 return {x:previous.x+(target.x-previous.x)*t,
  y:previous.y+(target.y-previous.y)*t,z:previous.z+(target.z-previous.z)*t,
  yaw:previous.yaw+deltaYaw*t,pitch:previous.pitch+(target.pitch-previous.pitch)*t};
}
export function rcDeploymentView(rc,world,player,view,reduced=false){
 if(reduced)return {view,hands:null,tabletLift:1};
 const t=rc.elapsed/RC_DEPLOY_SECONDS;
 const ease=value=>{const u=clamp(value,0,1);return u*u*(3-2*u);};
 const close=Math.hypot(rc.x-player.x,rc.y-player.y,rc.z-player.z)<1.65;
 const crouch=close?ease(t/.43):0,tablet=ease((t-.46)/.25);
 const camera={...view,y:view.y-.83*crouch+.23*crouch*tablet,
  pitch:view.pitch*(1-crouch)-.82*crouch+.38*crouch*tablet};
 const blend=ease((t-.74)/.26);
 let next=camera;
 if(close&&blend>0){
  const chase=rcCamera(rc,world);
  if(!lineBlocked(world.boxes,camera,chase)){
   const yaw=chase.yaw-camera.yaw;
   next={x:camera.x+(chase.x-camera.x)*blend,y:camera.y+(chase.y-camera.y)*blend,
    z:camera.z+(chase.z-camera.z)*blend,
    yaw:camera.yaw+Math.atan2(Math.sin(yaw),Math.cos(yaw))*blend,
    pitch:camera.pitch+(chase.pitch-camera.pitch)*blend};
  }
 }
 const hands=close&&t<.53?[-1,1].map(side=>({
  x:rc.x+Math.cos(player.yaw)*side*.18,y:rc.y+.16+.32*(1-crouch),
  z:rc.z-Math.sin(player.yaw)*side*.18
 })):null;
 return {view:next,hands,tabletLift:!hands&&t<.94?tablet*(1-blend):null};
}

export function canTrapPursuer(pursuer,hatch,armed){
 return !!armed&&hatch.open&&hatch.amount>.92&&pursuer.active&&pursuer.y<-.55&&pursuer.z>4.35&&Math.abs(pursuer.x-8.55)<1.05;
}
export function rcCarModel(piece,kit=false){
 const parts=[],add=(id,x,y,z,w,h,d,mat,color,extra={})=>parts.push(piece(id,x,y,z,w,h,d,mat,{color,...extra}));
 const pink=[.97,.39,.63],rose=[.74,.19,.37],cream=[.99,.93,.89],tire=[.13,.12,.18],glass=[.40,.72,.88];
 add('chassis',0,.14,0,.37,.17,.62,'pink',pink,{shape:'rounded-box',roundness:.2});
 add('hood',0,.24,.16,.32,.08,.27,'pink',cream,{shape:'rounded-box',roundness:.20});
 add('canopy',0,.285,-.13,.29,.16,.27,'pink',pink,{shape:'round',segments:12,rings:8});
 add('windshield',0,.326,.011,.24,.074,.027,'glass',glass);
 add('nose',0,.23,.327,.19,.049,.028,'cream',cream);
 add('bow-left',.064,.337,.10,.082,.072,.04,'bow',rose,{shape:'round'});
 add('bow-right',.148,.347,.065,.077,.075,.04,'bow',rose,{shape:'round'});
 add('bow-knot',.111,.345,.094,.041,.043,.035,'brass',cream,{shape:'round'});
 add('spoiler',0,.30,-.32,.41,.036,.065,'bow',rose);
 add('front-bumper',0,.126,.344,.39,.058,.064,'cream',cream,{shape:'rounded-box',roundness:.24});
 add('rear-diffuser',0,.104,-.324,.36,.052,.079,'dark',tire);
 for(const side of [-1,1]){
  add('side-skirt-'+side,side*.191,.115,0,.043,.054,.35,'bow',rose);
  add('rear-light-'+side,side*.115,.168,-.346,.088,.037,.023,'torchglass',[1,.28,.48],{glow:true});
 }
 for(const side of [-1,1])for(const dz of [-.22,.22]){
  add('tire-'+side+'-'+dz,side*.205,.105,dz,.113,.165,.155,'dark',tire,{shape:'cylinder',segments:12,yaw:Math.PI/2});
  add('rim-'+side+'-'+dz,side*.26,.105,dz,.018,.078,.077,'cream',cream,{shape:'cylinder',segments:10,yaw:Math.PI/2});
 }
 for(const side of [-1,1])add('light-'+side,side*.12,.195,.317,.071,.046,.018,'torchglass',cream,{glow:true});
 if(kit){
  add('tablet',0,.16,-.55,.48,.33,.055,'dark',[.18,.19,.29],{shape:'rounded-box'});
  add('tablet-display',0,.17,-.588,.405,.26,.006,'glass',[.43,.77,.89],{emissive:true});
  for(const x of [-.12,.12])add('touch-pad-'+x,x,.13,-.595,.068,.07,.004,'pink',cream);
 }
 return parts;
}

// UI telemetry, not a new range restriction. Basement and floors attenuate
// the displayed signal, but the controls and rescue route remain usable.
export function rcSignalStrength(rc,player){
 if(rc.mode==='disabled')return 0;
 const distance=Math.hypot(rc.x-player.x,rc.z-player.z),floors=Math.abs(rc.y-player.y);
 return clamp(1-distance/45-floors*.047,.30,1);
}
export function rcCameraVibration(view,rc,reduced=false){
 return reduced?view:{...view,y:view.y+(rc.suspension||0)*.85,pitch:view.pitch+(rc.suspension||0)*.35};
}
