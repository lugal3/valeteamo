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
const clearPath=(world,a,b,r,h)=>Array.from({length:Math.max(2,Math.ceil(distance(a,b)/.075)+1)},(_,i)=>i/Math.max(1,Math.ceil(distance(a,b)/.075))).every(t=>{
 const p=interpolate(a,b,t);
 return !blocked(world.boxes,p.x,p.y,p.z,r,h)&&Math.abs(groundHeight(p.x,p.z,p.y,world.hatch?.amount>.92)-p.y)<.17;
});
// Prefer the full lateral shot; use the same action at shorter distances
// in hallways. Never force a cat or a camera through the room geometry.
export function planEmyRescueShot(world,kitty,attacker,from,actualCat=null){
 const base=heading(kitty,attacker),angles=[base,base+.45,base-.45,base+Math.PI/2,base-Math.PI/2,base+Math.PI];
 const shapes=[
  {reach:.79,step:.40,entry:1.05,launch:.72,contact:.40,landing:.70,back:.30,arc:2.9,kind:'wide'},
  {reach:.68,step:.22,entry:.74,launch:.57,contact:.35,landing:.54,back:.15,arc:2.15,kind:'tight'}
 ];
 let closeup=null;
 for(const shape of shapes)for(const angle of angles)for(const side of [-1,1]){
  const dx=Math.sin(angle),dz=Math.cos(angle),sx=Math.cos(angle)*side,sz=-Math.sin(angle)*side;
  const foe=point(kitty,dx*shape.reach,dz*shape.reach),recoil=point(foe,dx*shape.step,dz*shape.step);
  const takeoff=point(foe,sx*shape.launch-dx*.24,sz*shape.launch-dz*.24);
  let start=point(kitty,sx*shape.entry-dx*.38,sz*shape.entry-dz*.38);
  const hit=point(foe,sx*shape.contact-dx*.13,sz*shape.contact-dz*.13),land=point(kitty,sx*shape.landing+dx*.16,sz*shape.landing+dz*.16);
  const safe=point(kitty,-dx*shape.back,-dz*shape.back);
  // Grounded protective step towards Kitty; retain the landing if obstructed.
  const candidateGuard=interpolate(land,safe,.20);
  const guard=distance(candidateGuard,safe)>.38&&clearPath(world,land,candidateGuard,.15,.48)?candidateGuard:land;
  // A nearby following Emy starts at her real location if the short run is clear.
  const realStart=actualCat&&!actualCat.hidden&&Math.abs(actualCat.y-kitty.y)<.15&&distance(actualCat,takeoff)<1.7&&distance(actualCat,kitty)>.37&&clearPath(world,actualCat,takeoff,.14,.48);
  if(realStart&&[0,.25,.5,.75,1].every(t=>distance(interpolate(actualCat,takeoff,t),kitty)>.34))start={x:actualCat.x,y:actualCat.y,z:actualCat.z};
  if(!clearPath(world,foe,recoil,.17,1.72)||!clearPath(world,start,takeoff,.14,.48)||!clearPath(world,land,land,.14,.48)||!clearPath(world,kitty,safe,.19,1.65))continue;
  // Validate the exact authored flight, including the curved rebound segment.
  const staged={kitty:{...kitty,yaw:angle},foe,recoil,start,takeoff,hit,land,guard,safe,side,angle,arc:shape.arc,kind:shape.kind,compact:false,realStart:!!realStart&&start.x===actualCat.x&&start.z===actualCat.z};
  if(!Array.from({length:33},(_,i)=>i/32).every(u=>{
   const t=mix(EMY_RESCUE_BEATS.launch,EMY_RESCUE_BEATS.land,u),p=sampleEmergencyRescue(t,staged).cat;
   return !blocked(world.boxes,p.x,p.y,p.z,.15,.40);
  }))continue;
  const subject={x:(kitty.x+foe.x)/2,y:kitty.y+.91,z:(kitty.z+foe.z)/2};
  for(const radius of [2.2,1.65,1.25])for(const s of [-1,1]){
   const camera={x:subject.x+sx*radius*s-dx*.4,y:kitty.y+1.67,z:subject.z+sz*radius*s-dz*.4};
   if(blocked(world.boxes,camera.x,camera.y-.12,camera.z,.12,.18)||lineBlocked(world.boxes,camera,subject)||lineBlocked(world.boxes,camera,{...land,y:land.y+.3})||lineBlocked(world.boxes,camera,{...foe,y:foe.y+1.2})||lineBlocked(world.boxes,camera,{...guard,y:guard.y+.3}))continue;
   return {...staged,camera,viewMode:'third'};
  }
  // If the side camera cannot fit, a lower first-person view can still
  // show the jump and the attack without drawing Kitty over her own eyes.
  const eye={x:kitty.x,y:kitty.y+1.25,z:kitty.z};
  if(!closeup&&!blocked(world.boxes,eye.x,eye.y-.08,eye.z,.09,.13)&&!lineBlocked(world.boxes,eye,{...hit,y:hit.y+.70})&&!lineBlocked(world.boxes,eye,{...foe,y:foe.y+1.10}))closeup={...staged,camera:eye,viewMode:'first',kind:'closeup'};
 }
 if(closeup)return closeup;
 // A genuinely blocked hiding nook cannot support a visible collision-free
 // leap. Do not spawn Emy inside Kitty; the impact is heard off-screen and
 // the normal checkpoint handoff occurs. No fake contact geometry.
 const angle=Number.isFinite(base)?base:kitty.yaw||0;
 const foe={...attacker};
 return {kitty:{...kitty,yaw:angle},foe,recoil:foe,start:{...kitty},takeoff:{...kitty},hit:{...kitty},land:{...kitty},safe:{...kitty},camera:{...from},side:1,angle,arc:0,kind:'occluded',viewMode:'occluded',compact:true,realStart:false};
}
export function sampleEmergencyRescue(t,stage){
 const B=EMY_RESCUE_BEATS;
 const approach=ease((t-B.enter)/(B.plant-B.enter)),up=clamp((t-B.launch)/(B.impact-B.launch)),down=clamp((t-B.impact)/(B.land-B.impact));
 const flight=clamp((t-B.launch)/(B.land-B.launch)),airborne=t>=B.launch&&t<B.land&&!stage.compact;
 const guard=stage.guard??stage.land,guardStep=ease((t-B.protect)/.44);
 const cat=t<B.launch?interpolate(stage.start,stage.takeoff,approach):t<B.impact?interpolate(stage.takeoff,stage.hit,up):t<B.land?interpolate(stage.hit,stage.land,down*(2-down)):interpolate(stage.land,guard,guardStep);
 cat.y+=airborne?(stage.arc??2.9)*flight*(1-flight):0;
 const strike=ease((t-1.46)/.23)*(1-ease((t-B.impact)/.27)),compression=Math.max(ease((t-B.plant)/.19)*(1-ease((t-B.launch)/.14)),ease((t-2.18)/.11)*(1-ease((t-B.land)/.23)));
 const hit=curve([[0,0],[B.impact,0],[1.83,1],[2.15,.76],[2.80,.36],[3.95,.08]],t),back=ease((t-B.impact)/.48);
 const foe=interpolate(stage.foe,stage.recoil,back),grip=ease((t-.05)/.29)*(1-ease((t-B.impact)/.24));
 const kitty=interpolate(stage.kitty,stage.safe,ease((t-B.release)/.58));
 const focus={x:mix(kitty.x,foe.x,.48),y:kitty.y+.83,z:mix(kitty.z,foe.z,.48)};
 const runFace=heading(stage.start,stage.takeoff),catFace=heading(stage.takeoff,stage.hit),returnFace=heading(stage.land,kitty);
 return {cat:{...cat,yaw:turn(turn(runFace,catFace,ease((t-B.plant)/.27)),returnFace,ease((t-B.land)/.29)),compression,flight,airborne,strike,walking:!stage.compact&&(t>=B.enter&&t<B.plant||t>=B.protect&&t<B.protect+.44&&distance(stage.land,guard)>.04),alarm:curve([[0,0],[.75,1],[2.29,1],[3.24,.15],[B.end,0]],t)},foe:{...foe,yaw:stage.angle+Math.PI+(stage.side*.30)*back,grip,hit},kitty:{...kitty,yaw:turn(stage.angle,heading(kitty,stage.land),ease((t-2.65)/.58))},focus};
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
