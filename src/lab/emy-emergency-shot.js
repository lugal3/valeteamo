import {blocked,lineBlocked,groundHeight} from './world.js';
import {setJoint} from './character-rig.js';
import {curve,ease,feet,arm} from './animations/pose-tools.js';

export const EMY_RESCUE_BEATS=Object.freeze({enter:.38,plant:.93,launch:1.20,impact:1.69,release:1.93,land:2.29,protect:2.62,relief:3.24,end:3.95});
const clamp=t=>Math.max(0,Math.min(1,t));
const mix=(a,b,t)=>a+(b-a)*t;
const point=(p,dx,dz)=>({x:p.x+dx,y:p.y,z:p.z+dz});
const turn=(a,b,w)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*w;
const heading=(a,b)=>Math.atan2(b.x-a.x,b.z-a.z);
const interpolate=(a,b,t)=>({x:mix(a.x,b.x,t),y:mix(a.y,b.y,t),z:mix(a.z,b.z,t)});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clearPath=(world,a,b,r,h)=>[0,.25,.5,.75,1].every(t=>{
 const p=interpolate(a,b,t);
 return !blocked(world.boxes,p.x,p.y,p.z,r,h)&&Math.abs(groundHeight(p.x,p.z,p.y,world.hatch?.amount>.92)-p.y)<.17;
});
export function planEmyRescueShot(world,kitty,attacker,from){
 const base=heading(kitty,attacker),angles=[base,base+.45,base-.45,base+Math.PI/2,base-Math.PI/2,base+Math.PI];
 for(const angle of angles)for(const side of [-1,1]){
  const dx=Math.sin(angle),dz=Math.cos(angle),sx=Math.cos(angle)*side,sz=-Math.sin(angle)*side;
  const foe=point(kitty,dx*.79,dz*.79),recoil=point(foe,dx*.40,dz*.40);
  const start=point(kitty,sx*1.05-dx*.38,sz*1.05-dz*.38),takeoff=point(foe,sx*.65-dx*.22,sz*.65-dz*.22);
  const hit=point(foe,sx*.17-dx*.14,sz*.17-dz*.14),land=point(kitty,sx*.70+dx*.18,sz*.70+dz*.18);
  const safe=point(kitty,-dx*.30,-dz*.30);
  if(!clearPath(world,foe,recoil,.17,1.72)||!clearPath(world,start,takeoff,.14,.48)||!clearPath(world,land,land,.14,.48)||!clearPath(world,kitty,safe,.19,1.65))continue;
  // Sample the elevated flight separately; the cat must not pass through a wall.
  if(!Array.from({length:17},(_,i)=>i/16).every(t=>{const p=t<.45?interpolate(takeoff,hit,t/.45):interpolate(hit,land,(t-.45)/.55);return !blocked(world.boxes,p.x,p.y+2.9*t*(1-t),p.z,.15,.40);}))continue;
  const subject={x:(kitty.x+foe.x)/2,y:kitty.y+.91,z:(kitty.z+foe.z)/2};
  for(const radius of [2.2,1.65,1.25])for(const s of [-1,1]){
   const camera={x:subject.x+sx*radius*s-dx*.4,y:kitty.y+1.67,z:subject.z+sz*radius*s-dz*.4};
   if(blocked(world.boxes,camera.x,camera.y-.12,camera.z,.12,.18)||lineBlocked(world.boxes,camera,subject)||lineBlocked(world.boxes,camera,{...land,y:land.y+.3})||lineBlocked(world.boxes,camera,{...foe,y:foe.y+1.2}))continue;
   return {kitty:{...kitty,yaw:angle},foe,recoil,start,takeoff,hit,land,safe,camera,side,angle,compact:false};
  }
 }
 // No blind camera placement in a cramped alcove. Retain the first-person
 // position and local poses; the following checkpoint recovery is unchanged.
 const angle=Number.isFinite(base)?base:kitty.yaw||0,dx=Math.sin(angle),dz=Math.cos(angle);
 const foe={...attacker},local=Math.abs(foe.y-kitty.y)<.35&&distance(kitty,foe)<1.8;
 return {kitty:{...kitty,yaw:angle},foe,recoil:foe,start:{...kitty},takeoff:{...kitty},hit:{...kitty},land:{...kitty},safe:{...kitty},camera:{...from},side:1,angle,compact:true,local};
}
export function sampleEmergencyRescue(t,stage){
 const B=EMY_RESCUE_BEATS;
 const approach=ease((t-B.enter)/(B.plant-B.enter)),up=clamp((t-B.launch)/(B.impact-B.launch)),down=clamp((t-B.impact)/(B.land-B.impact));
 const flight=clamp((t-B.launch)/(B.land-B.launch)),airborne=t>=B.launch&&t<B.land&&!stage.compact;
 const cat=t<B.launch?interpolate(stage.start,stage.takeoff,approach):t<B.impact?interpolate(stage.takeoff,stage.hit,up):interpolate(stage.hit,stage.land,down*(2-down));
 cat.y+=airborne?2.9*flight*(1-flight):0;
 const strike=ease((t-1.46)/.23)*(1-ease((t-B.impact)/.27)),compression=Math.max(ease((t-B.plant)/.19)*(1-ease((t-B.launch)/.14)),ease((t-2.18)/.11)*(1-ease((t-B.land)/.23)));
 const hit=curve([[0,0],[B.impact,0],[1.83,1],[2.15,.76],[2.80,.36],[3.95,.08]],t),back=ease((t-B.impact)/.48);
 const foe=interpolate(stage.foe,stage.recoil,back),grip=ease((t-.05)/.29)*(1-ease((t-B.impact)/.24));
 const kitty=interpolate(stage.kitty,stage.safe,ease((t-B.release)/.58));
 const focus={x:mix(kitty.x,foe.x,.48),y:kitty.y+.95,z:mix(kitty.z,foe.z,.48)};
 const catFace=heading(stage.takeoff,stage.hit),returnFace=heading(stage.land,kitty);
 return {cat:{...cat,yaw:turn(catFace,returnFace,ease((t-B.land)/.29)),compression,flight,airborne,strike,walking:!stage.compact&&t>=B.enter&&t<B.plant,alarm:curve([[0,0],[.75,1],[2.29,1],[3.24,.15],[B.end,0]],t)},foe:{...foe,yaw:stage.angle+Math.PI+(stage.side*.30)*back,grip,hit},kitty:{...kitty,yaw:turn(stage.angle,heading(kitty,stage.land),ease((t-2.65)/.58))},focus};
}
export function sampleRescuedKitty(t,out){
 const B=EMY_RESCUE_BEATS,held=ease(t/.28)*(1-ease((t-B.release)/.32)),flinch=curve([[0,0],[1.68,0],[1.9,1],[2.4,.3],[3.2,0]],t),relief=ease((t-2.62)/.65);
 out.fill(0);
 feet(out,{y:-.065*held-.07*flinch});
 setJoint(out,'body',-.10*held+.20*flinch,0,-.05*flinch);
 setJoint(out,'head',-.22*held+.19*flinch+.12*relief,-.26*relief,0);
 arm(out,'left',[-.29,.73+.24*held,.20+.16*held],[.15,0,-.1],held*.4);
 arm(out,'right',[.30,.77+.23*held,.23+.10*held],[-.10,0,.10],held*.4);
 return out;
}
