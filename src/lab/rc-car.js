import {navigate} from './navigation.js';
import {blocked,groundHeight,lineBlocked} from './world.js';
import {inHatch} from './basement.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const RC_SPEED=3.4;
export const RC_DEPLOY_SECONDS=1;
export const RC_NOISE_SECONDS=8;
export const RC_RECOVERY_SPOTS=Object.freeze([
 {x:12.35,y:3.15,z:4.19},
 {x:9.75,y:3.15,z:2.48},
 {x:6.1,y:0,z:10.15},
 {x:2.72,y:0,z:8.14}
]);
export function createRC(object){
 return {object,mode:'packed',x:object.x,y:object.y-.14,z:object.z,yaw:Math.PI,elapsed:0,noise:0,beeps:0,crashes:0,velocity:0};
}
export function deployRC(rc,player,world){
 if(!['packed','parked'].includes(rc.mode))return false;
 if(rc.mode==='packed'){
  const dx=Math.sin(player.yaw)*.75,dz=Math.cos(player.yaw)*.75;
  const x=player.x+dx,z=player.z+dz,y=groundHeight(x,z,player.y,world.hatch?.amount===1);
  if(!Number.isFinite(y)||Math.abs(y-player.y)>.30||blocked(world.boxes,x,y,z,.22,.30))return false;
  Object.assign(rc,{x,z,y,yaw:player.yaw});
 }
 rc.mode='deploying';rc.elapsed=0;rc.object.taken=false;rc.object.interactable=false;
 syncRCObject(rc);return true;
}
export function syncRCObject(rc){
 Object.assign(rc.object,{x:rc.x,y:rc.y+.14,z:rc.z,yaw:rc.yaw,mode:rc.mode});
}
export function driveRC(rc,world,input,dt){
 if(rc.mode!=='driving'||dt<=0)return 0;
 const steer=clamp(Number(input.steer)||0,-1,1),throttle=clamp(Number(input.throttle)||0,-1,1);
 rc.yaw+=steer*dt*2.65*(throttle<-.03?-1:1);
 const speed=RC_SPEED*throttle,dx=Math.sin(rc.yaw)*speed*dt,dz=Math.cos(rc.yaw)*speed*dt;
 const before={x:rc.x,z:rc.z},car={x:rc.x,y:rc.y,z:rc.z};
 const distance=navigate(car,world,dx,dz,.38);
 Object.assign(rc,{x:car.x,y:car.y,z:car.z});
 rc.velocity=distance/Math.max(dt,.001);
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
 if(rc.mode==='driving'||rc.mode==='deploying'){rc.mode='parked';rc.noise=0;rc.velocity=0;return true;}
 return false;
}
export function crashRC(rc,world){
 rc.crashes++;rc.mode='disabled';rc.noise=0;rc.velocity=0;
 const choices=RC_RECOVERY_SPOTS.slice(rc.crashes%RC_RECOVERY_SPOTS.length).concat(RC_RECOVERY_SPOTS.slice(0,rc.crashes%RC_RECOVERY_SPOTS.length));
 const pos=choices.find(p=>!blocked(world.boxes,p.x,p.y,p.z,.20,.4))||RC_RECOVERY_SPOTS[0];
 Object.assign(rc,{x:pos.x,y:pos.y,z:pos.z,yaw:0});
 rc.object.taken=false;rc.object.interactable=true;
 syncRCObject(rc);return pos;
}
export function recoverRC(rc){
 if(rc.mode!=='disabled'&&rc.mode!=='parked')return false;
 rc.mode='packed';rc.object.taken=true;rc.object.interactable=false;rc.noise=0;
 return true;
}
export function rcCamera(rc,world){
 const forward={x:Math.sin(rc.yaw),z:Math.cos(rc.yaw)};
 const target={x:rc.x,y:rc.y+.18,z:rc.z};
 const ideal={x:rc.x-forward.x*1.55,y:rc.y+.91,z:rc.z-forward.z*1.55};
 // Avoid placing the chase camera behind a solid wall when going down stairs.
 const occluded=lineBlocked(world.boxes,ideal,target);
 const camera=occluded?{x:rc.x-forward.x*.52,y:rc.y+.53,z:rc.z-forward.z*.52}:ideal;
 const distance=Math.hypot(target.x-camera.x,target.z-camera.z);
 return {...camera,yaw:rc.yaw,pitch:Math.atan2(target.y-camera.y,distance)};
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
