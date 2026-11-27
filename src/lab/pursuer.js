import {blocked,groundHeight,lineBlocked,HEIGHT,HOUSE} from './world.js';
import {navigate} from './navigation.js';
import {difficultyProfile} from './difficulty.js';
import {indexNavigationColliders} from './navigation-collision.js';
import {BED_EXIT,RISE_SECONDS} from './pursuer-model.js';
import {canHearNoise,searchAroundLastSeen,TRAIL_SEARCH_SECONDS} from './pursuer-perception.js';

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
 constructor(world,navigationProfile=null){this.world=world;this.navigationProfile=navigationProfile;this.difficulty=difficultyProfile('normal',false);this.reset();}
 setDifficulty(profile){this.difficulty=profile||difficultyProfile('normal',false);}
 reset(){this.captureGrace=0;this.doorReach=0;this.doorWait=0;this.failedPlans=0;this.turnRate=0;this.breakerDelay=15;this.breakerGoal=null;this.intruderSeen=false;this.x=5.8;this.y=0;this.z=11;this.yaw=this.facing=Math.PI;this.mode='dormant';this.awareness=0;this.lost=10;this.witnessed=null;this.lastSeen=null;this.path=[];this.route=0;this.visited=0;this.replan=0;this.walk=this.speed=this.age=this.bedTime=0;this.stepDistance=0;this.caught=false;this.stuck=0;this.task=null;this.modeTime=0;this.quiet=false;this.noiseGoal=null;this.noiseSource=null;this.noiseRemaining=0;this.stunned=0;this.trailPoints=[];this.trailIndex=0;this.trailRemaining=0;this.searchPause=0;}
 get active(){return this.mode!=='dormant';}
 hearNoise(position,intensity=1,sourceKind=null){
  if(!this.active||['dormant','sleeping','lying-down','rising','to-bed','to-entry','trapped','stunned','rc-chase'].includes(this.mode))return false;
  if(this.mode==='chase'&&(this.lost<.85||this.witnessed||intensity<1.25))return false;
  if(!position||![position.x,position.y,position.z].every(Number.isFinite))return false;
  if(this.mode==='investigate'&&this.awareness>=.26)return false;
  const origin={x:this.x,y:this.y+1.1,z:this.z};
  const source={x:position.x,y:position.y+.4,z:position.z};
  // Sound is not an omniscient map ping. Walls and floors reduce range;
  // loud, purposeful Emy distractions can still be heard across the house.
  if(!canHearNoise(origin,source,intensity,lineBlocked(this.world.boxes,origin,source)))return false;
  const changed=this.mode!=='noise-investigate'||!this.noiseGoal||dist(this.noiseGoal,position)>.6;
  this.noiseSource=sourceKind;
  this.noiseGoal={x:position.x,y:position.y,z:position.z};
  this.noiseRemaining=Math.max(this.noiseRemaining,Math.min(9,3+intensity*2.5));
  if(changed){
   this.mode='noise-investigate';this.task=null;this.captureGrace=0;this.replan=0;this.path=[];
   this.trailPoints=[];this.trailIndex=0;this.trailRemaining=0;
   // Hearing a sound only generates suspicion, never a confirmed sighting.
   this.awareness=Math.min(.25,Math.max(.12,this.awareness));
  }
  return true;
 }
 trackEmyDistraction(cat){
  if(this.mode!=='noise-investigate'||this.noiseSource!=='emy'||!cat||cat.hidden||Math.abs(cat.y-this.y)>.5)return false;
  const gap=dist(this,cat);
  if(gap>3.5||lineBlocked(this.world.boxes,{x:this.x,y:this.y+1.25,z:this.z},{x:cat.x,y:cat.y+.35,z:cat.z}))return false;
  if(gap<=.95){this.path=[];this.noiseGoal={x:this.x,y:this.y,z:this.z};this.goal={...this.noiseGoal};this.replan=.3;this.yaw=Math.atan2(cat.x-this.x,cat.z-this.z);return true;}
  const ratio=1-.80/gap;
  const goal={x:this.x+(cat.x-this.x)*ratio,y:cat.y,z:this.z+(cat.z-this.z)*ratio};
  if(!this.noiseGoal||dist(goal,this.noiseGoal)>.38){this.noiseGoal=goal;this.replan=0;this.path=[];}
  this.yaw=Math.atan2(cat.x-this.x,cat.z-this.z);return true;
 }
 endEmyDistraction(){if(this.mode==='noise-investigate'&&this.noiseSource==='emy')this.cooldown();this.noiseSource=null;}
 stun(seconds=2){
  if(!this.active||this.mode==='trapped')return false;
  this.stunned=Math.max(.5,Math.min(3,seconds*this.difficulty.stun/2));this.mode='stunned';this.path=[];this.speed=0;this.noiseGoal=null;this.noiseRemaining=0;
  return true;
 }
 start(){this.reset();this.mode='search';this.plan(SEARCH_ROUTE[0]);}
 goToBed(){this.mode='to-bed';this.task=BED_EXIT;this.plan(this.task);}
 sleep(){this.mode='sleeping';this.speed=0;this.turnRate=0;this.doorReach=0;this.doorWait=0;this.task=null;Object.assign(this,BED_EXIT,{facing:BED_EXIT.yaw});}
 wake(){this.mode='rising';this.bedTime=0;}
 resumeSearch(){this.task=null;this.mode='search';this.route=4;this.visited=0;this.clearSight();this.plan(SEARCH_ROUTE[this.route]);}
 clearSight(){
  this.witnessed=null;this.lastSeen=null;this.awareness=0;this.lost=10;
  this.trailPoints=[];this.trailIndex=0;this.trailRemaining=0;this.searchPause=0;
 }
 startTrailSearch(){
  // Sample only the last *actually seen* coordinate. Never query hidden
  // Kitty's live position to decide where the secuestrador should search.
  const goal=this.lastSeen;
  if(!goal)return false;
  const hatchOpen=this.world.hatch?.amount>.92;
  this.trailPoints=searchAroundLastSeen(goal,
   (x,z,y)=>groundHeight(x,z,y,hatchOpen),
   (x,y,z)=>!blocked(this.world.boxes,x,y,z,.16,1.72));
  if(!this.trailPoints.length)return false;
  this.mode='trail-search';this.trailIndex=0;this.searchPause=0;
  this.trailRemaining=this.difficulty.trail;this.modeTime=this.difficulty.trail;
  this.replan=0;this.path=[];this.task=null;
  return true;
 }
 cooldown(){this.clearSight();this.mode='cooldown';this.modeTime=this.difficulty.cooldown;this.replan=0;this.noiseGoal=null;this.noiseRemaining=0;}
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
 planningBoxes(){const leaves=new Set(this.world.objects.filter(o=>o.kind==='door'&&o.state!=='open'&&!o.locked&&!o.sealed).flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)]));return this.world.boxes.filter(b=>b.solid&&!leaves.has(b));}
 buildGraph(){
  const hatchOpen=this.world.hatch?.amount>.92;
  if(this.nodes&&this.graphHatchOpen===hatchOpen)return;
  this.graphHatchOpen=hatchOpen;
  const doors=new Set(this.world.objects.filter(o=>o.kind==='door').flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)])),boxes=this.world.boxes.filter(b=>b.solid&&!doors.has(b));
  const profile=this.navigationProfile,ground=profile?.ground??groundHeight;
  const cellSize=profile?.cellSize??CELL,columns=profile?Math.ceil(HOUSE.width/cellSize):GRID_COLUMNS,rows=profile?Math.ceil(15.2/cellSize):GRID_ROWS;
  const keyOf=profile?((i,j)=>i*(rows+2)+j):cellId;
  const isBlocked=indexNavigationColliders(boxes,profile?.radius??.16,profile?.height??1.72);
  this.nodes=[];this.cells=new Map();
  for(let i=0;i<columns;i++)for(let j=0;j<rows;j++)for(const level of LEVELS){
   const x=.2+i*cellSize,z=.2+j*cellSize,y=ground(x,z,level,hatchOpen),key=keyOf(i,j);
   const cell=this.cells.get(key)||[];
   if(!Number.isFinite(y)||cell.some(n=>Math.abs(n.y-y)<.1)||isBlocked(x,y,z))continue;
   const n={x,y,z,i,j,index:this.nodes.length};cell.push(n);this.cells.set(key,cell);this.nodes.push(n);
  }
  for(const n of this.nodes){n.neighbors=[];for(const [di,dj]of NEIGHBORS)for(const next of this.cells.get(keyOf(n.i+di,n.j+dj))||[]){
   if(Math.abs(next.y-n.y)>((n.y<0||next.y<0)?0.60:0.34))continue;
   let clear=true,sampleY=n.y;
   // Check the real walking surface on each substep, not a linear interpolation
   // between endpoints. At the hatch edge, that interpolation previously let
   // A* enter a wall that navigate() correctly refused to cross.
   for(let k=1;k<=8;k++){
    const t=k/8,x=n.x+(next.x-n.x)*t,z=n.z+(next.z-n.z)*t;
    const y=ground(x,z,sampleY,hatchOpen);
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
  const profile=this.navigationProfile,ground=profile?.ground??groundHeight,hatchOpen=this.world.hatch?.amount>.92;
  const isBlocked=indexNavigationColliders(this.planningBoxes(),profile?.radius??.16,profile?.height??1.72),availability=new Map();
  // The companion is small enough to enter real low refuges. Connect its
  // exact position to the graph with a swept, height-aware segment instead
  // of selecting a nearest node on the wrong side of a stair wall.
  const link=(from,to)=>{
   if(!profile)return true;
   const length=Math.hypot(to.x-from.x,to.z-from.z);
   if(length>1.15)return false;
   let y=from.y;
   const steps=Math.max(1,Math.ceil(length/.05));
   for(let i=1;i<=steps;i++){
    const x=from.x+(to.x-from.x)*i/steps,z=from.z+(to.z-from.z)*i/steps,next=ground(x,z,y,hatchOpen);
    if(!Number.isFinite(next)||Math.abs(next-y)>.12||isBlocked(x,next,z))return false;
    y=next;
   }
   return Math.abs(y-to.y)<.10;
  };
  const available=n=>{
   if(!availability.has(n.index))availability.set(n.index,!isBlocked(n.x,n.y,n.z));
   return availability.get(n.index);
  };
  const nearest=(p,fromActor)=>{let best=null,d=Infinity;for(const n of this.nodes){const v=dist(n,p);if(v<d&&available(n)&&(!profile||(fromActor?link(p,n):link(n,p)))){best=n;d=v;}}return best;};
  const start=nearest(this,true),end=nearest(goal,false);this.goal={...goal};this.path=[];this.replan=.8;if(!start||!end)return false;
  const open=new Set([start.index]),cost=new Map([[start.index,0]]),parent=new Map();let found=false;
  while(open.size){let id=null,best=Infinity;for(const i of open){const f=cost.get(i)+dist(this.nodes[i],end);if(f<best){best=f;id=i;}}open.delete(id);if(id===end.index){found=true;break;}
   for(const ni of this.nodes[id].neighbors){const n=this.nodes[ni];if(!available(n)||profile&&!link(this.nodes[id],n))continue;const value=cost.get(id)+dist(this.nodes[id],n);if(value>=(cost.get(ni)??Infinity))continue;cost.set(ni,value);parent.set(ni,id);open.add(ni);}
  }
  if(!found)return false;let at=end.index;while(at!==start.index){this.path.unshift(this.nodes[at]);at=parent.get(at);}this.path.unshift(start);return true;
 }
 canSee(p){
  if(p.hidden)return false;const dx=p.x-this.x,dz=p.z-this.z,d=Math.hypot(dx,dz);
  const range=(p.crouched?3.1:p.flashlight?6.2:5.1)*(p.dark&&!p.flashlight?.8:1)*this.difficulty.sight;
  if(d>range||Math.abs(p.y-this.y)>1.8)return false;
  if(d>1.6&&(dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw))/Math.max(.01,d)<.05)return false;
  return !lineBlocked(this.world.boxes,{x:this.x,y:this.y+1.4,z:this.z},{x:p.x,y:p.y+(p.crouched?.75:1.1),z:p.z});
 }
 update(dt,p,onDoor=()=>{},decoy=null){
  const cues=[];if(!this.active||dt<=0)return cues;
  if(this.mode==='trapped'){this.age+=dt;this.speed=0;return cues;}
  if(this.mode==='stunned'){this.stunned=Math.max(0,this.stunned-dt);this.age+=dt;this.speed=0;if(!this.stunned)this.cooldown();return cues;}
  if(this.mode==='noise-investigate'){this.noiseRemaining=Math.max(0,this.noiseRemaining-dt);if(!this.noiseRemaining){this.noiseGoal=null;this.cooldown();}}
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
  this.captureGrace=Math.max(0,this.captureGrace-dt);this.doorReach=Math.max(0,this.doorReach-dt);this.doorWait=Math.max(0,this.doorWait-dt);
  // Confirmed pursuit of Kitty outranks a new RC lure. An unconfirmed
  // rustle may still be overridden by the RC or Emy distraction.
  const kittyVisible=this.canSee(p);
  const confirmedKitty=kittyVisible&&(
   this.mode==='chase'||this.awareness>=.85||
   Math.abs(this.y-p.y)<.65&&Math.hypot(this.x-p.x,this.z-p.z)<1.25);
  if(confirmedKitty&&this.mode==='rc-chase'){
   // Spotting Kitty at close range cancels the toy decoy. A sound alone
   // does not grant knowledge of Kitty's hidden position.
   this.mode='investigate';this.awareness=Math.max(.75,this.awareness);
   this.modeTime=3;this.replan=0;this.path=[];this.task=null;
  }
  // The RC horn is deliberately loud, but it cannot reveal a position
  // beyond the same finite, wall-aware acoustic model used for Emy.
  const validDecoy=decoy?.active&&[decoy.x,decoy.y,decoy.z].every(Number.isFinite);
  const audibleDecoy=validDecoy&&decoy.noisy&&canHearNoise(
   {x:this.x,y:this.y+1.1,z:this.z},{x:decoy.x,y:decoy.y+.2,z:decoy.z},2.5,
   lineBlocked(this.world.boxes,{x:this.x,y:this.y+1.1,z:this.z},{x:decoy.x,y:decoy.y+.2,z:decoy.z}));
  const bait=validDecoy&&!confirmedKitty&&(audibleDecoy||this.canSee(decoy));
  if(bait){
   if(this.mode!=='rc-chase'){this.mode='rc-chase';this.replan=0;}
   this.lastSeen={x:decoy.x,y:decoy.y,z:decoy.z};this.task=null;this.witnessed=null;
   this.modeTime=6;
  }else if(this.mode==='rc-chase'&&this.modeTime===0)this.cooldown();
  const inPatrol=['search','patrol-rest','cooldown','investigate','chase','noise-investigate','trail-search'].includes(this.mode);
  const inSight=inPatrol&&!this.task&&kittyVisible;
  if(inSight&&!(this.mode==='cooldown'&&this.modeTime>0&&this.difficulty.id==='story')){
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
  this.awareness=clamp(this.awareness+dt*(visible?(near?4.8:p.crouched?1:1.7)*this.difficulty.awareness:-.65),0,1);
  if(visible){this.lastSeen={x:p.x,y:p.y,z:p.z};if(p.entering)this.witnessed=p.hideId;}
  const witnessed=!!this.witnessed&&(p.hidden||p.entering)&&this.witnessed===p.hideId;
  if(!p.hidden&&!p.entering)this.witnessed=null;
  if((['search','noise-investigate'].includes(this.mode)&&
    (this.awareness>=.26||witnessed))||
   (this.mode==='trail-search'&&visible&&this.awareness>=.26)){
   this.mode='investigate';this.modeTime=3;this.replan=0;cues.push('investigate');
  }
  if((this.awareness>=1||witnessed)&&this.mode==='investigate'){
   this.mode='chase';this.modeTime=CHASE_SECONDS;this.captureGrace=this.difficulty.grace;this.replan=0;cues.push('spotted');
  }else if(this.mode==='chase'&&(!visible&&!witnessed&&(this.modeTime===0||this.lost>this.difficulty.lost))){
   if(!this.startTrailSearch())this.cooldown();
   cues.push('lost');
  }else if(this.mode==='investigate'&&this.modeTime===0){
   if(!visible&&!witnessed&&this.lastSeen&&this.lost<6){
    if(!this.startTrailSearch())this.cooldown();
   }else this.cooldown();
  }
  if(this.mode==='trail-search'){
   this.trailRemaining=Math.max(0,this.trailRemaining-dt);
   if(!this.trailRemaining||this.trailIndex>=this.trailPoints.length)this.cooldown();
   else if(this.searchPause>0){
    // The enemy visibly pauses and looks rather than checking five
    // suspicious points in a single frame. Awareness can still reacquire
    // a truly visible Kitty earlier in this update.
    this.searchPause=Math.max(0,this.searchPause-dt);
    this.age+=dt;this.speed*=Math.exp(-8*dt);
    this.facing+=Math.sin(this.age*2.2)*dt*.23;
    return cues;
   }
  }
  if(bait&&Math.abs(this.y-decoy.y)<.55&&Math.hypot(this.x-decoy.x,this.z-decoy.z)<.75){this.mode='search';this.lastSeen=null;cues.push('rc-hit');return cues;}
  const contact=witnessed?(p.hideExit||p):p;
  if(this.mode==='chase'&&this.captureGrace<=0&&(witnessed||(visible&&!cues.includes('spotted')))&&Math.abs(this.y-contact.y)<.65&&Math.hypot(this.x-contact.x,this.z-contact.z)<(witnessed?1.1:.92)){
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
    this.speed=0;this.path=[];this.breakerGoal=null;this.breakerDelay=78;
    this.mode='patrol-rest';this.modeTime=.85;this.replan=0;
    cues.push('cut-power');return cues;
   }
  }
  this.replan-=dt;
  const target=this.task||this.breakerGoal||
   (this.mode==='noise-investigate'?this.noiseGoal:null)||
   (this.mode==='trail-search'?this.trailPoints[this.trailIndex]:null)||
   (['rc-chase','investigate','chase'].includes(this.mode)?
    witnessed?(p.hideExit||this.lastSeen):this.lastSeen:SEARCH_ROUTE[this.route]);
  if(!target)return cues;
  if(this.replan<=0&&(this.mode==='chase'||this.mode==='rc-chase'||this.mode==='noise-investigate'||!this.path.length||this.stuck>.5||!this.goal||dist(target,this.goal)>.5)){
   const planned=this.plan(target);this.failedPlans=planned?0:this.failedPlans+1;
   if(!planned&&this.failedPlans>=3&&!this.task&&!this.navigationProfile){
    this.failedPlans=0;this.stuck=0;this.breakerGoal=null;
    if(this.mode==='search'||this.mode==='cooldown'){this.route=(this.route+1)%(this.quiet?QUIET_ROUTE_END:SEARCH_ROUTE.length);this.replan=.45;}
    else if(this.mode!=='rc-chase'){this.cooldown();}
   }
  }
  for(const door of this.world.objects)if(door.kind==='door'&&door.state!=='open'&&Math.abs(door.y-1.1-this.y)<1.2&&Math.hypot(door.x-this.x,door.z-this.z)<1.6){
   if(onDoor(door)===true){this.doorReach=.44;this.doorWait=.24;this.doorYaw=Math.atan2(door.x-this.x,door.z-this.z);break;}
  }
  if(this.doorWait>0){this.age+=dt;this.speed*=Math.exp(-10*dt);if(Number.isFinite(this.doorYaw)){const turn=Math.atan2(Math.sin(this.doorYaw-this.facing),Math.cos(this.doorYaw-this.facing));this.facing+=turn*(1-Math.exp(-10*dt));}return cues;}
  let moved=0;
  const next=this.path[0];if(next){const dx=next.x-this.x,dz=next.z-this.z,d=Math.hypot(dx,dz);if(d<.07){this.path.shift();}else{
   this.yaw=Math.atan2(dx,dz);const pace=this.mode==='rc-chase'?2.15:this.mode==='noise-investigate'&&this.noiseSource==='emy'?Math.max(1.55,this.difficulty.patrol):this.mode==='chase'?this.difficulty.chase:this.difficulty.patrol;
   const step=Math.min(d,dt*pace);moved=navigate(this,this.world,dx/d*step,dz/d*step,1.72);this.walk+=moved;this.stepDistance+=moved;this.stuck=moved<.003?this.stuck+dt:0;
   if(this.stuck>1.5&&!this.navigationProfile){this.path=[];this.replan=.18;this.stuck=0;if(!this.task&&this.mode==='search')this.route=(this.route+1)%(this.quiet?QUIET_ROUTE_END:SEARCH_ROUTE.length);}
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
   else if(this.mode==='trail-search'){
    this.trailIndex++;this.replan=0;this.path=[];this.searchPause=.72;
    // No supernatural leap from a checked cupboard to Kitty's new location:
    // continue through a few safe, locally sampled points only.
    if(this.trailIndex>=this.trailPoints.length)this.cooldown();
   }
   else if(this.mode==='search'||this.mode==='cooldown'){
    this.visited++;this.route=(this.route+1)%(this.quiet?QUIET_ROUTE_END:SEARCH_ROUTE.length);
    this.path=[];this.replan=0;
    if(this.mode==='search'&&this.visited%2===0){this.mode='patrol-rest';this.modeTime=(4+(this.route%3)*1.5)*this.difficulty.rest;}
   }
  }
  this.age+=dt;
  this.speed+=(moved/dt-this.speed)*(1-Math.exp(-8*dt));
  const turn=this.yaw-this.facing;
  const angle=Math.atan2(Math.sin(turn),Math.cos(turn));
  this.turnRate+=(Math.max(-4,Math.min(4,angle/dt))-this.turnRate)*(1-Math.exp(-8*dt));
  this.facing+=angle*(1-Math.exp(-9*dt));
  return cues;
 }
 snapshot(){return {...this.checkpoint(),yaw:this.yaw,mode:this.mode,modeTime:this.modeTime,awareness:this.awareness,lost:this.lost,walk:this.walk,speed:this.speed,age:this.age,bedTime:this.bedTime,active:this.active,witnessed:this.witnessed,path:this.path.length,caught:this.caught,stunned:this.stunned,difficulty:this.difficulty.id,assistance:this.difficulty.assistance,captureGrace:this.captureGrace,doorReach:this.doorReach,turnRate:this.turnRate,searching:this.mode==='trail-search',searchStops:this.trailPoints.length-this.trailIndex};}
}
