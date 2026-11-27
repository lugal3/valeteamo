import {poseEmy} from './emy-cat.js';
import {EMY_DISTRACT_SECONDS} from './emy-abilities.js';
import {animateFurniture} from './furniture-motion.js';
import {Pursuer} from './pursuer.js';
import {ALTAR_THRESHOLD} from './emy-rescue.js';
import {inHatch} from './basement.js';
import {roomAt,blocked,groundHeight,segmentHitsBox,lineBlocked} from './world.js';

export const EMY_ENTRANCE_SECONDS=3.5;
const WINDOW_START={x:2.2,y:1.17,z:12.48};
const WINDOW_END={x:2.65,y:0,z:10.75};
const TRUNK_APPROACH={x:2.08,y:0,z:2.25};
// Emy gives Kitty room to move.  The two thresholds deliberately create a
// small hysteresis band: walking around her does not make her keep turning
// and taking little corrective steps, but moving away still calls her along.
export const FOLLOW_STOP=1.62;
export const FOLLOW_RESUME=2.28;
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const deltaAngle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
// Emy stays above the open hatch after her story withdrawal. If a legacy
// save placed her below ground, permit a real uphill escape, never a snap.
export function emyGroundHeight(x,z,y,hatchOpen){
 const next=groundHeight(x,z,y,hatchOpen);
 return y>=-.01&&next<-.01?NaN:next;
}
const EMY_NAV_PROFILE=Object.freeze({radius:.16,height:.62,cellSize:.40,ground:emyGroundHeight});
const EMY_NOOK_PROFILE=Object.freeze({...EMY_NAV_PROFILE,cellSize:.30});
// The narrow floor-level strip beside the stair nook needs a finer lattice.
// Keep the previously validated main-house lattice elsewhere.
const nearNook=p=>p.y<.15&&p.y>=-.01&&p.x>10.12&&p.x<12.85&&p.z>5.22&&p.z<8.03;
const clearNavigation=companion=>Object.assign(companion,{route:[],trail:[],routeTarget:null,nextPlanAt:0,nextSight:0,direct:false,chasing:undefined,stuck:0});

export function createEmyCompanion(cat,{waiting=true}={}){
 const companion={cat,stage:waiting?'waiting':'following',age:0,entranceAge:0,trail:[],route:[],stuck:0,planner:null,hiddenAt:null};
 companion.lidAmount=0;companion.mood='calm';companion.fatigue=0;companion.idleAge=0;
 if(!waiting){Object.assign(cat,{x:5.1,y:0,z:10.65,yaw:Math.PI});poseEmy(cat,{mode:'sit'});}
 setVisibility(companion,waiting);
 return companion;
}
function setVisibility(companion,hidden){
 companion.cat.hidden=hidden;
 for(const {box} of companion.cat.parts)box.hiddenGeometry=hidden;
}
export function commandEmyStay(companion){
 if(!companion||companion.stage!=='following'||companion.cat.hidden)return false;
 Object.assign(companion,{stage:'stay',route:[],trail:[],chasing:false,stuck:0,idleAge:0});
 companion.cat.reaction=0;return true;
}
export function releaseEmyStay(companion){
 if(!companion||companion.stage!=='stay')return false;
 Object.assign(companion,{stage:'following',idleAge:0});clearNavigation(companion);
 return true;
}
// Stop an existing distraction only by approaching the physical cat.
// The caller must retain the independent ability cooldown.
export function rejoinEmyInPerson(companion,world,player){
 if(!companion||!['stay','distract','distract-recover'].includes(companion.stage)||companion.cat.hidden)return false;
 const cat=companion.cat;
 if(!player||player.hidden||Math.abs(player.y-cat.y)>.45||distance(cat,player)>1.45||
  lineBlocked(world.boxes,{x:player.x,y:player.y+(player.eye??1.63),z:player.z},{x:cat.x,y:cat.y+.38,z:cat.z}))return false;
 Object.assign(companion,{stage:'following',distraction:null,idleAge:0,refuge:null});clearNavigation(companion);
 return true;
}
// Uses the existing rig; no extra meshes or animation systems.
function companionIdle(companion,dt,{reduced=false,lookAt=null,quiet=false}={}){
 const cat=companion.cat;
 companion.idleAge=(companion.idleAge||0)+dt;
 const t=companion.idleAge%33;
 const alarm=cat.alarm||0;
 // Mood is an overlay, not a new task. It cannot interrupt story or movement.
 companion.mood=alarm>.28?'scared':quiet?'calm':(companion.fatigue||0)>.68||t>25?'tired':t>=3&&t<7?'curious':'calm';
 let mode=quiet?'crouch':alarm>.28?'alert':t<3?'sit':t<7?'idle':t<12?'groom':t<15?'sit':t<18?'stretch':t<25?'sit':'sleep';
 if(companion.mood==='tired'&&t>18&&!quiet&&alarm<.28)mode='sleep';
 if(reduced&&['groom','stretch'].includes(mode))mode='sit';
 let headYaw=0;
 const target=alarm>.28?cat.senseTarget:companion.mood==='curious'?cat.curiosityTarget:lookAt;
 if(target&&Math.abs((target.y??cat.y)-cat.y)<2.1&&mode!=='sleep'&&mode!=='groom'&&mode!=='stretch'){
  headYaw=Math.max(-.72,Math.min(.72,deltaAngle(cat.yaw,Math.atan2(target.x-cat.x,target.z-cat.z))));
 }
 companion.fatigue=Math.max(0,(companion.fatigue||0)-dt*(mode==='sleep'?.045:.012));
 cat.phase=mode;
 poseEmy(cat,{mode,walking:false,phase:cat.age,activityAge:t,reduced,headYaw,blend:1-Math.exp(-dt*6)});
}
export function beginEmyEntrance(companion){
 if(companion.stage!=='waiting')return false;
 Object.assign(companion,{stage:'entrance',entranceAge:0,trail:[],route:[],chasing:undefined});
 Object.assign(companion.cat,WINDOW_START,{yaw:Math.PI});
 setVisibility(companion,false);
 poseEmy(companion.cat,{mode:'sit'});
 return true;
}
export function emyEntranceCamera(camera,progress,reduced=false,cat){
 // Kitty looks over her shoulder toward the living-room window, then back to the door.
 const look=smooth(progress/.27)*(1-smooth((progress-.78)/.22));
 const peek=camera.x<4.4?{x:camera.x,z:camera.z}:{x:4.85,z:6.2};
 const dx=(cat?.x??2.2)-peek.x,dz=(cat?.z??12.2)-peek.z;
 const windowYaw=Math.atan2(dx,dz);
 const pitch=Math.atan2((cat?.y??1.17)+.36-camera.y,Math.hypot(dx,dz));
 if(reduced)return {...camera,...peek,yaw:windowYaw,pitch:-.08};
 return {...camera,x:camera.x+(peek.x-camera.x)*look,z:camera.z+(peek.z-camera.z)*look,
  yaw:camera.yaw+deltaAngle(camera.yaw,windowYaw)*look,
  pitch:camera.pitch+(pitch-camera.pitch)*look};
}
// Hold the physical lid shut only while a visible cat occupies its
// footprint. The story command runs independently and walks her off it.
export function emyOccupiesHatch(companion){
 const cat=companion?.cat;
 return !!cat&&!cat.hidden&&cat.y>=-.05&&cat.y<.35&&inHatch(cat.x,cat.z,.18);
}
export function sendEmyToTrunk(companion){
 if(['waiting','trunk-run','trunk','trunk-enter'].includes(companion.stage))return false;
 // A shared closet animation may have temporarily moved the model inside
 // a closed prop. Resume at its recorded walkable entrance, not its camera.
 if(companion.stage==='closet-entry'&&companion.closetEntry)Object.assign(companion.cat,{x:companion.closetEntry.x,z:companion.closetEntry.z});
 if(companion.sharedBed){Object.assign(companion.cat,companion.sharedBed.from);companion.sharedBed=null;}
 companion.stage='trunk-run';clearNavigation(companion);companion.distraction=null;companion.refuge=null;companion.hiddenAt=null;companion.closetEntry=null;companion.altarWait=false;
 companion.cat.reaction=0;
 setVisibility(companion,false);
 return true;
}
export function requestRibbonKey(companion,vent,key){
 if(companion?.stage!=='following'||vent.coverAmount!==1||key.taken)return false;
 companion.fetch={vent,key,phase:'approach',time:0};
 companion.route=[];
 companion.stuck=0;
 companion.stage='fetch';
 companion.cat.reaction=0;
 return true;
}
// Wind up on planted paws, follow a short ballistic arc, then absorb impact.
function leapPose(cat,from,to,time,airTime,arc,landingYaw){
 const u=Math.max(0,Math.min(1,(time-.20)/airTime)),travel=smooth(u);
 const settle=Math.max(0,Math.min(1,(time-.20-airTime)/.30));
 cat.x=from.x+(to.x-from.x)*travel;cat.z=from.z+(to.z-from.z)*travel;
 cat.y=from.y+(to.y-from.y)*u+4*arc*u*(1-u);
 const heading=Math.atan2(to.x-from.x,to.z-from.z),startYaw=from.yaw??heading;
 cat.yaw=startYaw+deltaAngle(startYaw,heading)*smooth(time/.20);
 if(landingYaw!==undefined)cat.yaw+=deltaAngle(heading,landingYaw)*smooth(settle);
 return {flight:u,compression:time<.20?smooth(time/.20):u<1?1-smooth(u/.20):Math.sin(Math.PI*settle),
  airborne:u>0&&u<1};
}
// Approach and return use the same collision checks as ordinary following.
// The short crawl inside the prop is authored, with a separate optional exit.
function fetchKey(companion,world,player,dt,reduced){
 const job=companion.fetch,{cat}=companion,{vent,key}=job;
 let walking=false,mode='walk',cue=null,leap;
 if(job.phase==='leap-in'||job.phase==='leap-out'){
  const entering=job.phase==='leap-in',from=job.start,to=entering?vent.entrance:vent.takeoff;
  job.time+=dt;leap=leapPose(cat,from,to,job.time,.64,.63,entering?Math.PI:undefined);mode='leap';
  if(job.time>=1.14){job.phase=entering?'crawl':'return';job.time=0;}
 }else if(job.phase==='crawl'){
  job.time+=dt;
  const exit=vent.mode==='through'?vent.exit:vent.entrance;
  const depth=vent.depth??.48;
  const inward=smooth(job.time/1.35),outward=smooth((job.time-2.7)/1.35);
  cat.x=outward?exit.x:vent.entrance.x;
  cat.y=outward?exit.y:vent.entrance.y;
  cat.z=(outward?exit.z:vent.entrance.z)-depth*inward*(1-outward);
  cat.yaw=Math.PI*(1-smooth((job.time-2.25)/.45));
  if(job.time>1.35&&job.time<2.65&&job.time>=(job.nextScratch??0)){cue='scratch';job.nextScratch=job.time+.32;}
  if(job.time>=2.18)job.carrying=true;
  walking=job.time<1.35||job.time>2.7;
  if(job.time>=4.05){
   job.phase='leap-out';job.start={x:cat.x,y:cat.y,z:cat.z,yaw:cat.yaw};job.time=0;
  }
  mode='stretch';
 }else{
  const returning=job.phase==='return',goal=returning?player:vent.takeoff;
  if(distance(cat,goal)<(returning?.85:.17)&&Math.abs(cat.y-goal.y)<.3&&clearPassage(world,cat,goal)){
   if(returning){
    mode='sit';
    cat.yaw+=deltaAngle(cat.yaw,Math.atan2(player.x-cat.x,player.z-cat.z))*(1-Math.exp(-dt*8));
    job.offerTime=(job.offerTime||0)+dt;
    if(job.offerTime>=.55){
     companion.stage='following';companion.fetch=null;companion.route=[];companion.chasing=false;
     return 'delivered';
    }
   }else{job.phase='leap-in';job.start={x:cat.x,y:cat.y,z:cat.z,yaw:cat.yaw};job.time=0;companion.route=[];}
  }else{
   let point=goal;
   if(!clearPassage(world,cat,goal)){
    while(companion.route.length&&distance(cat,companion.route[0])<.14&&Math.abs(cat.y-companion.route[0].y)<.25)companion.route.shift();
    if(!companion.route.length&&companion.age>=(job.nextPlan||0)){
     planRoute(companion,world,goal);job.nextPlan=companion.age+.5;
    }
    openRouteDoor(companion,world,player,reduced);
    point=companion.route[0]||goal;
   }else companion.route=[];
   walking=moveToward(companion,world,point,dt,1.65);
  }
 }
 poseEmy(cat,{mode,walking,leap,phase:cat.age,reduced,blend:1-Math.exp(-15*dt)});
 if(job.carrying){
  const mouth=cat.parts.find(p=>p.id==='philtrum').box;
  // The ring sits between her teeth, with the shaft hanging down as she turns.
  const tilt=1.10,offset=.055*Math.cos(tilt);
  Object.assign(key,{carried:true,yaw:cat.yaw,tilt,x:mouth.x+Math.sin(cat.yaw)*offset,
   y:mouth.y-.055*Math.sin(tilt),z:mouth.z+Math.cos(cat.yaw)*offset});
 }
 return cue;
}
// Preview and execution share the same validation and A* route. Only the
// planner cache may be populated while the player studies the map.
export function previewEmyDistract(companion,world,goal){
 if(companion?.stage!=='following'||world.hatch?.open||!goal||![goal.x,goal.y,goal.z].every(Number.isFinite)||goal.y<-.01)return null;
 if(roomAt(goal.x,goal.z,goal.y)==='Sala de música')return null;
 const ground=emyGroundHeight(goal.x,goal.z,goal.y,world.hatch?.amount>.92);
 if(!Number.isFinite(ground)||Math.abs(ground-goal.y)>.18||blocked(world.boxes,goal.x,ground,goal.z,.20,.62))return null;
 const draft={...companion,route:[],trail:[],stuck:0};
 planRoute(draft,world,goal);
 // Cache only the reusable graph, not the companion's live task or route.
 companion.planner=draft.planner;companion.nookPlanner=draft.nookPlanner;
 const lockedDoors=world.objects.filter(door=>door.kind==='door'&&(door.locked||door.sealed)&&!door.open);
 const origin={x:companion.cat.x,y:companion.cat.y,z:companion.cat.z};
 const waypoints=[origin,...draft.route,{...goal}];
 const collidesWithLockedDoor=lockedDoors.some(door=>{
  const walls=[door.box,...(door.parts||[]).map(part=>part.box)].filter(box=>box?.solid);
  return waypoints.slice(1).some((node,i)=>{
   const prior=waypoints[i],from={x:prior.x,y:prior.y+.70,z:prior.z},to={x:node.x,y:node.y+.70,z:node.z};
   return walls.some(box=>segmentHitsBox(from,to,box,.13));
  });
 });
 if(waypoints.slice(1).some(node=>roomAt(node.x,node.z,node.y)==='Sala de música')||collidesWithLockedDoor||!draft.route.length&&(distance(companion.cat,goal)>.85||!clearPassage(world,companion.cat,goal)))return null;
 const metres=waypoints.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-waypoints[i].x,p.y-waypoints[i].y,p.z-waypoints[i].z),0);
 return {goal:{...goal},route:draft.route,waypoints,seconds:Math.max(1,Math.ceil(metres/2.0)),metres};
}
export function sendEmyDistract(companion,world,goal){
 const plan=previewEmyDistract(companion,world,goal);
 if(!plan)return false;
 clearNavigation(companion);
 companion.route=plan.route;companion.routeTarget={...plan.goal};companion.nextPlanAt=companion.age+1.1;
 companion.distraction={goal:{...plan.goal},remaining:EMY_DISTRACT_SECONDS,arrived:false,nextNoise:0,nextPlan:0,stuck:0};
 companion.stage='distract';companion.cat.reaction=0;return true;
}
export function snapshotEmyCompanion(companion){
 const {cat,stage}=companion;
 if(companion.sharedBed)return {stage:stage==='hiding'?'hiding':'following',...companion.sharedBed.from,yaw:cat.yaw};
 if(stage==='closet-entry')return {stage:'following',x:companion.closetEntry.x,y:cat.y,z:companion.closetEntry.z,yaw:cat.yaw};
 if(stage==='fetch'&&['leap-in','crawl','leap-out'].includes(companion.fetch.phase))return {stage:'following',...companion.fetch.vent.takeoff,yaw:0};
 return {stage:['entrance','fetch','distract','distract-recover','hold'].includes(stage)?'following':stage==='trunk-enter'?'trunk':stage,
  x:cat.x,y:cat.y,z:cat.z,yaw:cat.yaw};
}
export function restoreEmyCompanion(companion,saved,storyPhase='explore'){
 const valid=['waiting','following','stay','hiding','trunk-run','trunk'];
 const stage=valid.includes(saved?.stage)?saved.stage:storyPhase==='explore'?'waiting':['sleep','patrol','hide','resting','arrival'].includes(storyPhase)?'following':'trunk';
 companion.stage=stage;clearNavigation(companion);companion.refuge=null;companion.distraction=null;companion.idleAge=0;companion.wardrobeAttempt=0;companion.closetEntry=null;companion.sharedBed=null;companion.cat.dodge=null;companion.altarWait=false;
 if(['following','stay','hiding','trunk-run'].includes(stage)&&[saved?.x,saved?.y,saved?.z,saved?.yaw].every(Number.isFinite))
  Object.assign(companion.cat,{x:saved.x,y:saved.y,z:saved.z,yaw:saved.yaw});
 else if(stage==='trunk')Object.assign(companion.cat,TRUNK_APPROACH,{yaw:-Math.PI/2});
 else if(stage!=='waiting')Object.assign(companion.cat,{x:5.1,y:0,z:10.65,yaw:Math.PI});
 setVisibility(companion,['waiting','hiding','trunk'].includes(stage));
 poseEmy(companion.cat,{mode:'sit'});
}
// Trial setup only: choose a genuine walkable spot on Kitty's current floor.
// Never use this during normal following, distraction or hiding.
export function trialEmyPose(world,player){
 if(!player||![player.x,player.y,player.z,player.yaw].every(Number.isFinite))return null;
 const room=roomAt(player.x,player.z,player.y);
 const angles=[.95,-.95,1.57,-1.57,.52,-.52,2.1,-2.1,2.62,-2.62,0,Math.PI];
 let alternative=null,nearby=null;
 for(const radius of [1.20,1.34,1.04,1.55,.86,1.85,2.20,2.65,3.10]){
  for(const angle of angles){
   const a=player.yaw+angle,x=player.x+Math.sin(a)*radius,z=player.z+Math.cos(a)*radius;
   const y=groundHeight(x,z,player.y,world.hatch?.amount>.92);
   if(!Number.isFinite(y)||Math.abs(y-player.y)>.12||blocked(world.boxes,x,y,z,.24,.72))continue;
   const pose={x,y,z,yaw:Math.atan2(player.x-x,player.z-z)};
   if(!clearPassage(world,pose,player)){if(roomAt(x,z,y)===room)nearby??=pose;continue;}
   if(roomAt(x,z,y)===room)return pose;
   alternative??=pose;
  }
 }
 return alternative??nearby;
}
export function initializeTrialEmy(companion,world,player,stage='following'){
 if(stage==='following'){
  const pose=trialEmyPose(world,player);
  // Explicit failure, not a silently invisible cat or an unsafe teleport.
  if(!pose)return false;
  restoreEmyCompanion(companion,{stage,...pose},'explore');
 }else restoreEmyCompanion(companion,{stage},'explore');
 return true;
}
function planRoute(companion,world,goal){
 const {cat}=companion;
 const useNook=nearNook(cat)||nearNook(goal);
 const planner=useNook?(companion.nookPlanner??=new Pursuer(world,EMY_NOOK_PROFILE)):(companion.planner??=new Pursuer(world,EMY_NAV_PROFILE));
 Object.assign(planner,{x:cat.x,y:cat.y,z:cat.z});
 companion.route=[];companion.routeTarget={x:goal.x,y:goal.y,z:goal.z};companion.nextPlanAt=companion.age+1.1;
 if(!planner.plan(goal))return false;
 companion.route=planner.path.map(({x,y,z})=>({x,y,z}));return true;
}
function openRouteDoor(companion,world,player,reduced){
 const {cat,route}=companion;
 for(const door of world.objects){
  if(door.kind!=='door'||door.open||door.motion||door.locked||door.sealed)continue;
  if(Math.abs(door.y-1.1-cat.y)>.4||distance(cat,door.origin)>1.1)continue;
  if(route.slice(0,5).some(node=>distance(node,door.origin)<.55))animateFurniture(door,true,{player,reducedMotion:reduced});
 }
}
// Test the corridor at cat height, including the walking surface on stairs.
function clearPassage(world,from,to){
 const length=distance(from,to);
 if(length>4)return false;
 const steps=Math.max(1,Math.ceil(length/.06));
 let floor=from.y;
 for(let i=1;i<=steps;i++){
  const x=from.x+(to.x-from.x)*i/steps,z=from.z+(to.z-from.z)*i/steps;
  const y=emyGroundHeight(x,z,floor,world.hatch?.amount>.92);
  if(!Number.isFinite(y)||Math.abs(y-floor)>.12||blocked(world.boxes,x,y,z,.16,.62))return false;
  floor=y;
 }
 return Math.abs(floor-to.y)<.23;
}
function moveToward(companion,world,goal,dt,speed){
 const cat=companion.cat,dx=goal.x-cat.x,dz=goal.z-cat.z,d=Math.hypot(dx,dz);
 if(d<.055)return false;
 const turn=deltaAngle(cat.yaw,Math.atan2(dx,dz));
 cat.yaw+=turn*(1-Math.exp(-18*dt));
 const step=Math.min(d,speed*dt*Math.max(.12,Math.cos(turn))),pieces=Math.max(1,Math.ceil(step/.045));
 let moved=false;
 for(let i=0;i<pieces;i++){
  const nx=cat.x+dx/d*step/pieces,nz=cat.z+dz/d*step/pieces,y=emyGroundHeight(nx,nz,cat.y,world.hatch?.amount>.92);
  if(roomAt(cat.x,cat.z,cat.y)!=='Sala de música'&&roomAt(nx,nz,y)==='Sala de música')break;
  if(!Number.isFinite(y)||Math.abs(y-cat.y)>.12||blocked(world.boxes,nx,y,nz,.16,.62))break;
  cat.x=nx;cat.y=y;cat.z=nz;moved=true;
 }
 return moved;
}
// A short collision-checked orbit in the commanded room, away from Kitty.
export function distractionEscapePoint(world,cat,job,threat,player){
 const center=job.goal,angle=Math.atan2(cat.x-center.x,cat.z-center.z);
 const room=roomAt(center.x,center.z,center.y),danger=distance(cat,threat);
 let best=null,score=-Infinity;
 for(const radius of [.85,1.25,1.65])for(const offset of [Math.PI/3,-Math.PI/3,Math.PI/2,-Math.PI/2,Math.PI,0]){
  const a=angle+offset,x=center.x+Math.sin(a)*radius,z=center.z+Math.cos(a)*radius;
  const y=emyGroundHeight(x,z,cat.y,world.hatch?.amount>.92),p={x,y,z};
  if(!Number.isFinite(y)||Math.abs(y-cat.y)>.12||roomAt(x,z,y)!==room||room==='Sala de música'||distance(p,cat)<.35||!clearPassage(world,cat,p))continue;
  const gap=distance(p,threat);
  if(gap<Math.max(.75,danger-.08))continue;
  if(player&&Math.abs(player.y-y)<.5&&distance(p,player)<Math.min(2,distance(cat,player)))continue;
  const rank=gap-.20*distance(cat,p)+.15*(Math.sign(offset)===(job.orbitSide||1)?1:0);
  if(rank>score){score=rank;best=p;}
 }
 return best;
}
// A local refuge is a real, traversable floor point screened by furniture.
// No invisible relocation and no navigation toward Kitty's hiding spot.
export function findEmyRefuge(world,cat,player,threat){
 const origin={x:cat.x,y:cat.y,z:cat.z},eye={x:cat.x,y:cat.y+1.55,z:cat.z};
 // Restrict repeated collision checks to the local search radius, allowing
 // for rotated furniture. No full navigation rebuild when Kitty hides.
 const localBoxes=world.boxes.filter(b=>b.solid&&Math.abs(b.y-cat.y)<b.h/2+1.8&&Math.hypot(b.x-cat.x,b.z-cat.z)<3.2+Math.hypot(b.w,b.d)/2);
 const localWorld={...world,boxes:localBoxes};
 const danger=threat?.active&&Math.abs(threat.y-cat.y)<1.4?{x:threat.x,y:threat.y+1.5,z:threat.z}:eye;
 const hidden=player?.hidden,avoid=hidden?{x:hidden.returnX??player.x,z:hidden.returnZ??player.z}:player;
 let best=null,score=-Infinity;
 for(const radius of [.65,1.05,1.45,1.85,2.25])for(let i=0;i<12;i++){
  const angle=i*Math.PI/6,x=cat.x+Math.sin(angle)*radius,z=cat.z+Math.cos(angle)*radius;
  const y=emyGroundHeight(x,z,cat.y,world.hatch?.amount>.92),point={x,y,z};
  if(!Number.isFinite(y)||Math.abs(y-cat.y)>.1||roomAt(x,z,y)!==roomAt(cat.x,cat.z,cat.y)||roomAt(x,z,y)==='Sala de música'||blocked(localBoxes,x,y,z,.24,.72)||!clearPassage(localWorld,origin,point))continue;
  if(avoid&&Math.abs(player.y-y)<.45&&distance(point,avoid)<Math.min(1.75,distance(origin,avoid)))continue;
  if(!lineBlocked(world.boxes,danger,{x,y:y+.32,z}))continue;
  const cover=localBoxes.some(b=>b.solid&&!b.walkSurface&&b.h>.07&&b.y+b.h/2>y+.3&&b.y-b.h/2<y+.95&&Math.hypot(Math.max(0,Math.abs(x-b.x)-b.w/2),Math.max(0,Math.abs(z-b.z)-b.d/2))<.65);
  if(!cover)continue;
  const rank=-radius+(threat?.active?Math.min(3,distance(point,threat))*.18:0);
  if(rank>score){score=rank;best=point;}
 }
 return best;
}
function beginIndependentCover(companion,world,player,threat){
 clearNavigation(companion);
 Object.assign(companion,{stage:'hold',refuge:findEmyRefuge(world,companion.cat,player,threat),refugeAge:0});
 companion.cat.reaction=0;
}
function updateIndependentCover(companion,world,dt,reduced){
 const cat=companion.cat,goal=companion.refuge;
 companion.refugeAge=(companion.refugeAge||0)+dt;
 if(goal&&companion.refugeAge<3&&distance(cat,goal)>.12&&clearPassage(world,cat,goal)){
  const walking=moveToward(companion,world,goal,dt,1.45);
  if(walking){cat.phase='walk';poseEmy(cat,{mode:'walk',walking:true,phase:cat.age,reduced,blend:1});return;}
 }
 companion.refuge=null;companionIdle(companion,dt,{reduced,quiet:true});
}
export function updateEmyCompanion(companion,delta,{world,player,enteringHide=null,reduced=false,finale=false,threat=null,distractCooldown=0,scriptedHide=false}={}){
 const cat=companion.cat,dt=Number.isFinite(delta)?Math.max(0,Math.min(.1,delta)):0;
 if(finale){setVisibility(companion,true);return null;}
 // Story priority also applies after a restore or an interrupted command.
 // Once the hatch opens, Emy must retire; Kitty below ground is never a follow target.
 if((world.hatch?.open||player?.y<-.02)&&!['waiting','trunk','trunk-run','trunk-enter'].includes(companion.stage))sendEmyToTrunk(companion);
 if(companion.stage==='waiting'||companion.stage==='trunk')return null;
 companion.age+=dt;cat.age+=dt;
 if(['bed-entry','bed-exit'].includes(companion.stage)){
  const entry=companion.sharedBed;
  if(!entry){companion.stage='following';return null;}
  const entering=companion.stage==='bed-entry'&&!!(enteringHide||player?.hidden);
  entry.t=Math.max(0,Math.min(1,entry.t+dt/.68*(entering?1:-1)));
  const t=smooth(entry.t);
  cat.x=entry.from.x+(entry.to.x-entry.from.x)*t;cat.z=entry.from.z+(entry.to.z-entry.from.z)*t;cat.y=entry.from.y;
  cat.yaw=Math.atan2(entry.to.x-entry.from.x,entry.to.z-entry.from.z);cat.alarm=0;
  poseEmy(cat,{mode:'crouch',walking:entry.t>0&&entry.t<1,phase:cat.age,reduced,leap:{compression:1,flight:0,airborne:false},blend:1});
  if(entry.t===1&&entering){
   companion.stage='hiding';companion.hiddenAt='underbed';cat.hidden=true;
   for(const {box} of cat.parts)box.hiddenGeometry=false;
   return 'hid';
  }
  if(entry.t===0&&!entering){companion.sharedBed=null;companion.stage='following';companion.hiddenAt=null;clearNavigation(companion);setVisibility(companion,false);}
  return null;
 }
 if(companion.stage==='closet-entry'){
  const step=companion.closetEntry;
  const t=smooth((step.time+=dt)/.76);
  cat.x=step.x+(step.inside.x-step.x)*t;cat.z=step.z+(step.inside.z-step.z)*t;
  cat.yaw=Math.atan2(step.inside.x-step.x,step.inside.z-step.z);
  poseEmy(cat,{mode:'walk',walking:true,phase:cat.age,reduced});
  if(t===1){
   setVisibility(companion,true);cat.x=step.x;cat.z=step.z;
   companion.stage='hiding';companion.hiddenAt='wardrobe';return 'hid';
  }
  return null;
 }
 if(companion.stage==='fetch')return fetchKey(companion,world,player,dt,reduced);
 if(companion.stage==='entrance'){
  const previous=companion.entranceAge/EMY_ENTRANCE_SECONDS;
  companion.entranceAge=Math.min(EMY_ENTRANCE_SECONDS,companion.entranceAge+dt);
  const t=companion.entranceAge/EMY_ENTRANCE_SECONDS;
  const clock=(t-.30)*EMY_ENTRANCE_SECONDS+.20;
  if(clock<0){poseEmy(cat,{mode:'sit',reduced});return null;}
  const leap=leapPose(cat,WINDOW_START,WINDOW_END,clock,.86,.50);
  poseEmy(cat,{mode:'leap',leap,phase:cat.age,reduced,blend:1-Math.exp(-24*dt)});
  const contact=.30+.86/EMY_ENTRANCE_SECONDS;
  if(previous<contact&&t>=contact)return 'touchdown';
  if(t>=1){cat.y=0;companion.stage='following';companion.trail=[{...WINDOW_END}];return 'landed';}
  return previous<.3&&t>=.3?'jump':null;
 }
 if(cat.dodge){
  const dodge=cat.dodge,t=Math.min(1,(dodge.elapsed+=dt)/dodge.duration),u=smooth(t);
  cat.x=dodge.from.x+(dodge.to.x-dodge.from.x)*u;
  cat.z=dodge.from.z+(dodge.to.z-dodge.from.z)*u;
  cat.y=dodge.from.y+(dodge.to.y-dodge.from.y)*u+(reduced?0:.12*Math.sin(Math.PI*u));
  cat.yaw=dodge.from.yaw+deltaAngle(dodge.from.yaw,dodge.to.yaw)*u;
  poseEmy(cat,{mode:'jump',walking:t<1,phase:cat.age,reduced,blend:1-Math.exp(-18*dt)});
  if(t===1){cat.y=dodge.to.y;cat.dodge=null;companion.route=[];companion.chasing=undefined;}
  return null;
 }
 if(companion.stage==='stay'){
  // Explicit hold persists across floor changes and hiding; no movement/noises.
  companion.route=[];companion.trail=[];
  companionIdle(companion,dt,{reduced,lookAt:player,quiet:!!(enteringHide||player?.hidden)});
  return null;
 }
 if(companion.stage==='distract'){
  const job=companion.distraction;
  if(!job){companion.stage='following';return null;}
  if(!job.arrived){
   const goal=job.goal;
   while(companion.route.length&&distance(cat,companion.route[0])<.19&&Math.abs(cat.y-companion.route[0].y)<.28)companion.route.shift();
   if(companion.route.length)openRouteDoor(companion,world,player,reduced);
   const point=companion.route[0]||goal;
   const walking=moveToward(companion,world,point,dt,2.25);
   job.stuck=walking?0:job.stuck+dt;
   if(job.stuck>.65&&companion.age>job.nextPlan){
    planRoute(companion,world,goal);job.nextPlan=companion.age+1.0;
   }
   poseEmy(cat,{mode:walking?'walk':'idle',walking,phase:cat.age,reduced,blend:1-Math.exp(-12*dt)});
   // Horizontal proximity alone can be on the other side of a wall/floor.
   // Never start the noise countdown until Emy really has a clear final leg.
   if(distance(cat,goal)<.60&&Math.abs(cat.y-goal.y)<.18&&clearPassage(world,cat,goal)){
    job.arrived=true;job.nextNoise=0;companion.route=[];
   }
   job.travelAge=(job.travelAge||0)+dt;
   if(job.stuck>12||job.travelAge>60){companion.stage='following';companion.distraction=null;clearNavigation(companion);return 'distract-failed';}
   return null;
  }
  job.remaining-=dt;job.nextNoise-=dt;
  const nearEnemy=threat?.active&&threat.mode==='noise-investigate'&&threat.noiseSource==='emy'&&Math.abs(cat.y-threat.y)<.48&&distance(cat,threat)<3.2;
  let walking=false;
  if(nearEnemy){
   job.orbitSide??=1;
   if((!job.escape||distance(cat,job.escape)<.18||distance(job.escape,threat)<.68)&&companion.age>=(job.nextEscapeAt||0)){
    job.escape=distractionEscapePoint(world,cat,job,threat,player);job.nextEscapeAt=companion.age+.24;
   }
   if(job.escape)walking=moveToward(companion,world,job.escape,dt,2.7);
   if(!walking)job.escape=null;
  }else job.escape=null;
  if(!walking)cat.yaw+=deltaAngle(cat.yaw,nearEnemy?Math.atan2(threat.x-cat.x,threat.z-cat.z):Math.PI*.5)*(1-Math.exp(-dt*4));
  poseEmy(cat,{mode:walking?'walk':nearEnemy?'alert':'idle',walking,phase:cat.age,reduced,blend:1-Math.exp(-9*dt)});
  if(job.remaining<=0){
   // The noise finishes at the commanded room even when Kitty is hidden on
   // another floor. Do NOT automatically path back toward a live hiding spot:
   // that creates unfair noise and exposes Kitty's wardrobe to the pursuer.
   companion.distraction=null;clearNavigation(companion);
   if(enteringHide||player?.hidden)beginIndependentCover(companion,world,player,threat);
   else companion.stage='following';
   return 'distract-done';
  }
  if(job.nextNoise<=0){job.nextNoise=1.5;return 'distract-noise';}
  return null;
 }
 if(companion.stage==='distract-recover'){
  if(enteringHide||player?.hidden)beginIndependentCover(companion,world,player,threat);
  else {companion.stage='following';clearNavigation(companion);}
  return 'distract-done';
 }
 const hide=enteringHide||player?.hidden;
 if(companion.altarWait&&companion.stage==='following'&&!hide)player=ALTAR_THRESHOLD;
 // "hold" is a safe, quiet companion state, distinct from the story's
 // initial "waiting" and physical "hiding". Only a short local refuge path,
 // no cat noise, no approach to the player's remote wardrobe.
 if(companion.stage==='hold'){
  if(hide){
   updateIndependentCover(companion,world,dt,reduced);
   return null;
  }
  companion.refuge=null;companion.stage='following';clearNavigation(companion);
 }
 // Only a nearby Emy may OPTIONALLY join Kitty's wardrobe. A remote Emy,
 // especially on another floor, must stop instead of travelling for ages
 // toward a hiding player. This never gates Kitty's animation in house.js.
 companion.wardrobeAttempt=hide&&companion.stage==='following'?(companion.wardrobeAttempt||0)+dt:0;
 const sharedDoor=hide&&player?{x:hide.returnX??player.x,y:player.y,z:hide.returnZ??player.z}:null;
 if(companion.stage==='following'&&hide&&player&&
  ((hide.objectId!=='wardrobe'&&!(scriptedHide&&hide.objectId==='underbed'))||Math.abs(cat.y-player.y)>.48||distance(cat,sharedDoor)>(scriptedHide?3.5:2.1)||companion.wardrobeAttempt>(scriptedHide?6:3.0)||
   (roomAt(cat.x,cat.z,cat.y)!==roomAt(sharedDoor.x,sharedDoor.z,sharedDoor.y)&&!clearPassage(world,cat,sharedDoor)))){
  beginIndependentCover(companion,world,player,threat);
  updateIndependentCover(companion,world,dt,reduced);
  return null;
 }
 let following=companion.stage==='following';
 if(following&&hide)cat.reaction=0;
 if(companion.stage==='hiding'&&!hide){
  if(companion.sharedBed){companion.stage='bed-exit';setVisibility(companion,false);return null;}
  companion.stage='following';companion.hiddenAt=null;following=true;clearNavigation(companion);
  // She reappears at the safe floor position where she followed Kitty in.
  setVisibility(companion,false);
 }
 if(companion.stage==='following'&&player&&!hide){
  const last=companion.trail.at(-1);
  if(!last||Math.hypot(player.x-last.x,player.z-last.z,2*(player.y-last.y))>.16){
   companion.trail.push({x:player.x,y:player.y,z:player.z});
   if(companion.trail.length>450)companion.trail.shift();
  }
 }
 if(companion.stage==='trunk-run'&&!companion.route.length&&companion.age>=(companion.nextPlanAt||0)&&(distance(cat,TRUNK_APPROACH)>.42||Math.abs(cat.y)>.25))
  planRoute(companion,world,TRUNK_APPROACH);
 if(companion.stage==='hiding'){
  if(companion.sharedBed){cat.alarm=0;poseEmy(cat,{mode:'crouch',phase:cat.age,reduced,leap:{compression:1,flight:0,airborne:false},blend:1});}
  return null;
 }
 const hideDoor=hide&&player?{x:hide.returnX??player.x,y:player.y,z:hide.returnZ??player.z}:null;
 const heading=following?(hideDoor||player):TRUNK_APPROACH;
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
 if(following&&hide&&companion.lastHide!==hide.objectId){
  companion.route=[];companion.trail=[];
  if(!clearPassage(world,cat,heading))planRoute(companion,world,heading);
 }
 let goal=heading;
 while(companion.route.length&&distance(cat,companion.route[0])<.12&&Math.abs(cat.y-companion.route[0].y)<.24)companion.route.shift();
 if(companion.route.length)goal=companion.route[0];
 else if(companion.stage==='following'){
  while(companion.trail.length>1&&distance(cat,companion.trail[0])<.22&&Math.abs(cat.y-companion.trail[0].y)<.27)companion.trail.shift();
  if(companion.trail.length)goal=companion.trail[0];
 }
 const gap=distance(cat,heading);
 if(following&&!hide){
  const differentFloor=Math.abs(cat.y-heading.y)>.25;
  // A small horizontal gap through a closed wall is not actual proximity.
  const separateRoom=roomAt(cat.x,cat.z,cat.y)!==roomAt(heading.x,heading.z,heading.y);
  const separated=differentFloor||(separateRoom&&!companion.direct);
  if(companion.chasing===undefined)companion.chasing=gap>FOLLOW_RESUME||separated;
  if(companion.chasing&&!separated&&gap<=FOLLOW_STOP){
   // Her current spot is intentional once she is close enough.  Discarding
   // stale breadcrumbs avoids a delayed turn if Kitty circles around Emy.
   companion.chasing=false;
   companion.trail.length=0;
   companion.route.length=0;
  }else if(!companion.chasing&&(gap>FOLLOW_RESUME||separated))companion.chasing=true;
 }
 if(following){
  // Prefer Kitty when there is room for the whole cat. Keep the recorded
  // footsteps around blind bends and across changes in floor height.
  if(companion.age>=(companion.nextSight||0)||companion.lastHide!==hide?.objectId){
   companion.direct=clearPassage(world,cat,heading);
   companion.nextSight=companion.age+.12;
   companion.lastHide=hide?.objectId;
  }
  if(companion.direct){
   goal=heading;
   companion.trail.length=0;
   companion.route.length=0;companion.routeTarget=null;
  }else if(companion.age>=(companion.nextPlanAt||0)&&(companion.chasing||hide||companion.altarWait)){
   const target=companion.routeTarget;
   if(!companion.route.length||!target||distance(target,heading)>1.1||Math.abs(target.y-heading.y)>.4){
    // Clear breadcrumbs from a different elevation or a long-obsolete
    // doorway. Plan to the latest real location and follow only that path.
    companion.trail.length=0;planRoute(companion,world,heading);
    goal=companion.route[0]||heading;
   }
  }
 }
 const stop=following?(hide?.21:companion.altarWait?.18:FOLLOW_STOP):.32;
 // During normal exploration, only leave the resting ring once Kitty is
 // properly away.  Hiding remains deliberately close so Emy takes cover.
 const far=following&&!hide&&!companion.altarWait?Boolean(companion.chasing):(gap>stop+.008||Math.abs(cat.y-heading.y)>.25);
 let walking=false;
 if((companion.stage==='trunk-run'||hide||following)&&companion.route.length)openRouteDoor(companion,world,player,reduced);
 if(far&&cat.reaction<=0&&dt>0){
  const pace=following?Math.min(4.2,.70+2.35*Math.max(0,gap-stop)):1.4;
  const directStop=goal===heading&&Math.abs(cat.y-heading.y)<.25&&(!following||companion.direct);
  walking=moveToward(companion,world,goal,dt,directStop?Math.min(pace,Math.max(0,gap-stop)/dt):pace);
 }
 if(!walking&&far&&cat.reaction<=0){
  companion.stuck+=dt;
  if(companion.stuck>1.2&&companion.age>=(companion.nextPlanAt||0)){companion.trail.length=0;planRoute(companion,world,heading);companion.stuck=0;}
 }else companion.stuck=0;
 if(companion.stage==='following'&&hide&&companion.direct&&distance(cat,heading)<.38&&Math.abs(cat.y-heading.y)<.45){
  if(hide.objectId==='wardrobe'&&(enteringHide||player?.hidden?.objectId==='wardrobe')){
   const closet=world.objects.find(o=>o.id===hide.objectId);
   companion.closetEntry={x:cat.x,z:cat.z,time:0,inside:closet.hideCamera,shared:scriptedHide};
   companion.stage='closet-entry';return null;
  }
  if(scriptedHide&&hide.objectId==='underbed'){
   const bed=world.objects.find(o=>o.id==='underbed');
   const from={x:cat.x,y:cat.y,z:cat.z};
   const to=[0,.16,-.16,.25,-.25].map(dx=>({x:bed.hideCamera.x+dx,y:cat.y,z:bed.hideCamera.z+.35}))
    .find(p=>Array.from({length:19},(_,i)=>i/18).every(t=>!blocked(world.boxes,from.x+(p.x-from.x)*t,from.y,from.z+(p.z-from.z)*t,.14,.40)));
   if(to){companion.sharedBed={from,to,t:0};companion.stage='bed-entry';return null;}
   beginIndependentCover(companion,world,player,threat);return null;
  }
  companion.stage='hiding';companion.hiddenAt=hide.objectId;setVisibility(companion,true);return 'hid';
 }
 if(companion.altarWait&&following&&!walking){cat.yaw+=deltaAngle(cat.yaw,Math.atan2(12.27-cat.x,.44-cat.z))*(1-Math.exp(-4*dt));}
 if(cat.reaction>0&&player){
  const facing=Math.atan2(player.x-cat.x,player.z-cat.z);
  cat.yaw+=deltaAngle(cat.yaw,facing)*(1-Math.exp(-6*dt));

 }
 companion.restTime=walking?0:(companion.restTime||0)+dt;
 if(walking){companion.fatigue=Math.min(1,(companion.fatigue||0)+dt*.008);companion.mood=cat.alarm>.28?'scared':'calm';}
 if(cat.alarm>.28)companion.mood='scared';
 const mode=cat.reaction>0?'purr':walking?'walk':cat.alarm>.28?'alert':companion.restTime<.65?'idle':'sit';
 if(cat.reaction>0)cat.reaction=Math.max(0,cat.reaction-dt);
 if(!walking&&cat.reaction<=0&&companion.restTime>=.65){
  companionIdle(companion,dt,{reduced,lookAt:player});
 }else{
  companion.idleAge=0;
  cat.phase=mode;poseEmy(cat,{mode,walking,reduced,phase:cat.age,blend:1-Math.exp(-dt*10)});
 }
 return null;
}
