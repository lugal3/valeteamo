import {blocked,groundHeight,lineBlocked,HEIGHT,HOUSE} from './world.js';
import {navigate} from './navigation.js';
import {indexNavigationColliders} from './navigation-collision.js';
import {BED_EXIT,RISE_SECONDS} from './pursuer-model.js';

const CELL=.4,dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*2,a.z-b.z);
const GRID_COLUMNS=35,GRID_ROWS=38;
const NEIGHBORS=[[1,0],[-1,0],[0,1],[0,-1]],LEVELS=[0,HEIGHT,-3.55];
const cellId=(i,j)=>i*(GRID_ROWS+2)+j;
export const SEARCH_ROUTE=Object.freeze([{x:12,y:HEIGHT,z:4.2},{x:6,y:HEIGHT,z:2.8},{x:2.5,y:HEIGHT,z:3.6},{x:6,y:HEIGHT,z:5.8},{x:6,y:0,z:8.7},{x:8.67,y:0,z:2.20}]);
const ENTRY_APPROACH={x:5.8,y:0,z:11};
const QUIET_ROUTE_END=4;
const CHASE_SECONDS=5.5,COOLDOWN_SECONDS=5;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export class Pursuer{
 constructor(world){this.world=world;this.reset();}
 reset(){this.breakerDelay=15;this.breakerGoal=null;this.intruderSeen=false;this.x=5.8;this.y=0;this.z=11;this.yaw=this.facing=Math.PI;this.mode='dormant';this.awareness=0;this.lost=10;this.witnessed=null;this.lastSeen=null;this.path=[];this.route=0;this.visited=0;this.replan=0;this.walk=this.speed=this.age=this.bedTime=0;this.stepDistance=0;this.caught=false;this.stuck=0;this.task=null;this.modeTime=0;this.quiet=false;}
 get active(){return this.mode!=='dormant';}
 start(){this.reset();this.mode='search';this.plan(SEARCH_ROUTE[0]);}
 goToBed(){this.mode='to-bed';this.task=BED_EXIT;this.plan(this.task);}
 sleep(){this.mode='sleeping';this.speed=0;this.task=null;Object.assign(this,BED_EXIT,{facing:BED_EXIT.yaw});}
 wake(){this.mode='rising';this.bedTime=0;}
 resumeSearch(){this.task=null;this.mode='search';this.route=4;this.visited=0;this.clearSight();this.plan(SEARCH_ROUTE[this.route]);}
 clearSight(){this.witnessed=null;this.lastSeen=null;this.awareness=0;this.lost=10;}
 cooldown(){this.clearSight();this.mode='cooldown';this.modeTime=COOLDOWN_SECONDS;this.replan=0;}
 settleUpstairs(){this.quiet=true;this.task=null;this.route=3;this.cooldown();}
 checkpoint(){
  return {x:this.x,y:this.y,z:this.z,facing:this.facing,route:this.route,visited:this.visited,
   rest:this.mode==='patrol-rest'?this.modeTime:0};
 }
 restorePatrol(saved,quiet){
  const {x,y,z,facing,route,visited,rest}=saved??{};
  if(![x,y,z,facing,rest].every(Number.isFinite)||!Number.isInteger(route)||route<0||route>=SEARCH_ROUTE.length||
   !Number.isInteger(visited)||visited<0||x<0||x>HOUSE.width||z<0||z>HOUSE.depth||y<0||y>HEIGHT||
   !(Math.abs(groundHeight(x,z,y,false)-y)<=.08)||blocked(this.world.boxes,x,y,z,.16,1.72))return false;
  Object.assign(this,{x,y,z,facing,yaw:facing,route,visited,quiet,mode:'cooldown',modeTime:Math.max(3,clamp(rest,0,7)),replan:0});
  return true;
 }
 planningBoxes(){const leaves=new Set(this.world.objects.filter(o=>o.kind==='door'&&o.state!=='open').flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)]));return this.world.boxes.filter(b=>b.solid&&!leaves.has(b));}
 buildGraph(){
  const hatchOpen=this.world.hatch?.amount>.92;
  if(this.nodes&&this.graphHatchOpen===hatchOpen)return;
  this.graphHatchOpen=hatchOpen;
  const doors=new Set(this.world.objects.filter(o=>o.kind==='door').flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)])),boxes=this.world.boxes.filter(b=>b.solid&&!doors.has(b));
  const isBlocked=indexNavigationColliders(boxes,.16,1.72);
  this.nodes=[];this.cells=new Map();
  for(let i=0;i<GRID_COLUMNS;i++)for(let j=0;j<GRID_ROWS;j++)for(const level of LEVELS){
   const x=.2+i*CELL,z=.2+j*CELL,y=groundHeight(x,z,level,hatchOpen),key=cellId(i,j);
   const cell=this.cells.get(key)||[];
   if(!Number.isFinite(y)||cell.some(n=>Math.abs(n.y-y)<.1)||isBlocked(x,y,z))continue;
   const n={x,y,z,i,j,index:this.nodes.length};cell.push(n);this.cells.set(key,cell);this.nodes.push(n);
  }
  for(const n of this.nodes){n.neighbors=[];for(const [di,dj]of NEIGHBORS)for(const next of this.cells.get(cellId(n.i+di,n.j+dj))||[]){
   if(Math.abs(next.y-n.y)>((n.y<0||next.y<0)?0.60:0.34))continue;
   let clear=true,sampleY=n.y;
   // Check the real walking surface on each substep, not a linear interpolation
   // between endpoints. At the hatch edge, that interpolation previously let
   // A* enter a wall that navigate() correctly refused to cross.
   for(let k=1;k<=8;k++){
    const t=k/8,x=n.x+(next.x-n.x)*t,z=n.z+(next.z-n.z)*t;
    const y=groundHeight(x,z,sampleY,hatchOpen);
    if(!Number.isFinite(y)||Math.abs(y-sampleY)>.35||isBlocked(x,y,z)){clear=false;break;}
    sampleY=y;
   }
   if(clear&&Math.abs(sampleY-next.y)<.08)n.neighbors.push(next.index);
  }}
 }
 plan(goal){
  this.buildGraph();
  // Cache occupancy only for this planning pass: the door/furniture state may change
  // between plans, but remains fixed while the synchronous search is running.
  const isBlocked=indexNavigationColliders(this.planningBoxes(),.16,1.72),availability=new Map();
  const available=n=>{
   if(!availability.has(n.index))availability.set(n.index,!isBlocked(n.x,n.y,n.z));
   return availability.get(n.index);
  };
  const nearest=p=>{let best=null,d=Infinity;for(const n of this.nodes){const v=dist(n,p);if(v<d&&available(n)){best=n;d=v;}}return best;};
  const start=nearest(this),end=nearest(goal);this.goal={...goal};this.path=[];this.replan=.8;if(!start||!end)return false;
  const open=new Set([start.index]),cost=new Map([[start.index,0]]),parent=new Map();let found=false;
  while(open.size){let id=null,best=Infinity;for(const i of open){const f=cost.get(i)+dist(this.nodes[i],end);if(f<best){best=f;id=i;}}open.delete(id);if(id===end.index){found=true;break;}
   for(const ni of this.nodes[id].neighbors){const n=this.nodes[ni];if(!available(n))continue;const value=cost.get(id)+dist(this.nodes[id],n);if(value>=(cost.get(ni)??Infinity))continue;cost.set(ni,value);parent.set(ni,id);open.add(ni);}
  }
  if(!found)return false;let at=end.index;while(at!==start.index){this.path.unshift(this.nodes[at]);at=parent.get(at);}this.path.unshift(start);return true;
 }
 canSee(p){
  if(p.hidden)return false;const dx=p.x-this.x,dz=p.z-this.z,d=Math.hypot(dx,dz);
  const range=(p.crouched?3.1:p.flashlight?6.2:5.1)*(p.dark&&!p.flashlight?.8:1);
  if(d>range||Math.abs(p.y-this.y)>1.8)return false;
  if(d>1.6&&(dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw))/Math.max(.01,d)<.05)return false;
  return !lineBlocked(this.world.boxes,{x:this.x,y:this.y+1.4,z:this.z},{x:p.x,y:p.y+(p.crouched?.75:1.1),z:p.z});
 }
 update(dt,p,onDoor=()=>{},decoy=null){
  const cues=[];if(!this.active||dt<=0)return cues;
  if(this.mode==='trapped'){this.age+=dt;this.speed=0;return cues;}
  if(this.mode==='sleeping'){this.age+=dt;return cues;}
  if(this.mode==='lying-down'||this.mode==='rising'){
   this.bedTime=Math.min(RISE_SECONDS,this.bedTime+dt);this.age+=dt;
   if(this.bedTime===RISE_SECONDS){
    if(this.mode==='lying-down')this.sleep();
    else{this.mode='to-entry';this.task=ENTRY_APPROACH;this.plan(this.task);cues.push('stood');}
   }
   return cues;
  }
  this.modeTime=Math.max(0,this.modeTime-dt);
  const bait=decoy?.active&&(decoy.noisy||this.canSee(decoy));
  if(bait){
   if(this.mode!=='rc-chase'){this.mode='rc-chase';this.replan=0;}
   this.lastSeen={x:decoy.x,y:decoy.y,z:decoy.z};this.task=null;this.witnessed=null;
   this.modeTime=6;
  }else if(this.mode==='rc-chase'&&this.modeTime===0)this.cooldown();
  const inPatrol=['search','patrol-rest','cooldown','investigate','chase'].includes(this.mode);
  const inSight=inPatrol&&!this.task&&this.canSee(p);
  if(inSight){
   this.intruderSeen=true;this.breakerGoal=null;
   if(this.mode==='patrol-rest'||this.mode==='cooldown'){this.mode='search';this.replan=0;}
  }
  if(this.mode==='patrol-rest'){
   if(this.modeTime>0){this.age+=dt;this.speed*=Math.exp(-8*dt);return cues;}
   this.mode='search';this.replan=0;
  }
  if(this.mode==='cooldown'&&this.modeTime===0){this.mode='search';this.replan=0;}
  const watching=!this.task&&!['cooldown','rc-chase'].includes(this.mode);
  const visible=watching&&inSight;
  const near=visible&&Math.hypot(this.x-p.x,this.z-p.z)<1.15;
  this.lost=visible?0:this.lost+dt;
  this.awareness=clamp(this.awareness+dt*(visible?(near?4.8:p.crouched?1:1.7):-.65),0,1);
  if(visible){this.lastSeen={x:p.x,y:p.y,z:p.z};if(p.entering)this.witnessed=p.hideId;}
  const witnessed=!!this.witnessed&&(p.hidden||p.entering)&&this.witnessed===p.hideId;
  if(!p.hidden&&!p.entering)this.witnessed=null;
  if(this.mode==='search'&&(this.awareness>=.26||witnessed)){
   this.mode='investigate';this.modeTime=3;this.replan=0;cues.push('investigate');
  }
  if((this.awareness>=1||witnessed)&&this.mode==='investigate'){
   this.mode='chase';this.modeTime=CHASE_SECONDS;this.replan=0;cues.push('spotted');
  }else if(this.mode==='chase'&&(!visible&&!witnessed&&(this.modeTime===0||this.lost>2))){
   this.cooldown();cues.push('lost');
  }else if(this.mode==='investigate'&&this.modeTime===0)this.cooldown();
  if(bait&&Math.abs(this.y-decoy.y)<.55&&Math.hypot(this.x-decoy.x,this.z-decoy.z)<.75){this.mode='search';this.lastSeen=null;cues.push('rc-hit');return cues;}
  const contact=witnessed?(p.hideExit||p):p;
  if(this.mode==='chase'&&(witnessed||(visible&&!cues.includes('spotted')))&&Math.abs(this.y-contact.y)<.65&&Math.hypot(this.x-contact.x,this.z-contact.z)<(witnessed?1.1:.92)){
   this.caught=true;cues.push('caught');return cues;
  }
  // A discovered intruder prompts a detour only during an otherwise free patrol.
  if(this.mode!=='search'||!this.world.lights.power.on)this.breakerGoal=null;
  if(this.intruderSeen&&!visible&&this.mode==='search'&&!this.task&&this.world.lights.power.on){
   this.breakerDelay-=dt;
   const meter=this.world.lights.meter;
   if(this.breakerDelay<=0&&!this.breakerGoal){this.breakerGoal={x:meter.x,y:0,z:meter.z+.58};this.replan=0;}
   if(this.breakerGoal&&Math.abs(this.y)<.2&&Math.hypot(this.x-meter.x,this.z-meter.z)<1){
    this.yaw=this.facing=Math.atan2(meter.x-this.x,meter.z-this.z);
    this.speed=0;this.path=[];this.breakerGoal=null;this.breakerDelay=65+Math.random()*30;
    this.mode='patrol-rest';this.modeTime=.85;this.replan=0;
    cues.push('cut-power');return cues;
   }
  }
  this.replan-=dt;
  const target=this.task||this.breakerGoal||(this.mode==='rc-chase'||this.mode==='investigate'||this.mode==='chase'?witnessed?(p.hideExit||this.lastSeen):this.lastSeen:SEARCH_ROUTE[this.route]);
  if(!target)return cues;
  if(this.replan<=0&&(this.mode==='chase'||this.mode==='rc-chase'||!this.path.length||this.stuck>.5||!this.goal||dist(target,this.goal)>.5))this.plan(target);
  for(const door of this.world.objects)if(door.kind==='door'&&door.state!=='open'&&Math.abs(door.y-1.1-this.y)<1.2&&Math.hypot(door.x-this.x,door.z-this.z)<1.6)onDoor(door);
  let moved=0;
  const next=this.path[0];if(next){const dx=next.x-this.x,dz=next.z-this.z,d=Math.hypot(dx,dz);if(d<.07){this.path.shift();}else{
   this.yaw=Math.atan2(dx,dz);const pace=this.mode==='rc-chase'?2.15:this.mode==='chase'?3.75:1.85;
   const step=Math.min(d,dt*pace);moved=navigate(this,this.world,dx/d*step,dz/d*step,1.72);this.walk+=moved;this.stepDistance+=moved;this.stuck=moved<.003?this.stuck+dt:0;
   if(this.stepDistance>.65){this.stepDistance%=.65;cues.push('step');}
  }}else if(this.goal&&dist(this,this.goal)<.8){
   if(this.mode==='to-bed'){
    const distance=Math.hypot(BED_EXIT.x-this.x,BED_EXIT.z-this.z);
    const turn=Math.atan2(Math.sin(BED_EXIT.yaw-this.facing),Math.cos(BED_EXIT.yaw-this.facing));
    this.yaw=BED_EXIT.yaw;
    if(distance>.025){
     const step=Math.min(distance,dt*.85),scale=step/distance;
     moved=navigate(this,this.world,(BED_EXIT.x-this.x)*scale,(BED_EXIT.z-this.z)*scale,1.72);this.walk+=moved;
    }else if(Math.abs(turn)<.09){this.sleep();this.mode='lying-down';this.bedTime=0;}
   }
   else if(this.mode==='to-entry')cues.push('at-entry');
   else if(this.mode==='search'||this.mode==='cooldown'){
    this.visited++;this.route=(this.route+1)%(this.quiet?QUIET_ROUTE_END:SEARCH_ROUTE.length);
    this.path=[];this.replan=0;
    if(this.mode==='search'&&this.visited%2===0){this.mode='patrol-rest';this.modeTime=4+(this.route%3)*1.5;}
   }
  }
  this.age+=dt;
  this.speed+=(moved/dt-this.speed)*(1-Math.exp(-8*dt));
  const turn=this.yaw-this.facing;
  this.facing+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-12*dt));
  return cues;
 }
 snapshot(){return {...this.checkpoint(),yaw:this.yaw,mode:this.mode,modeTime:this.modeTime,awareness:this.awareness,lost:this.lost,walk:this.walk,speed:this.speed,age:this.age,bedTime:this.bedTime,active:this.active,witnessed:this.witnessed,path:this.path.length,caught:this.caught};}
}
