import {blocked,groundHeight,lineBlocked,HEIGHT} from './world.js';
import {navigate} from './navigation.js';

const CELL=.4,dist=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*2,a.z-b.z);
export const SEARCH_ROUTE=Object.freeze([{x:12,y:HEIGHT,z:4.2},{x:6,y:HEIGHT,z:2.8},{x:2.5,y:HEIGHT,z:3.6},{x:6,y:HEIGHT,z:5.8}]);
export class Pursuer{
 constructor(world){this.world=world;this.reset();}
 reset(){this.x=5.8;this.y=0;this.z=11;this.yaw=this.facing=Math.PI;this.mode='dormant';this.awareness=0;this.lost=10;this.witnessed=null;this.lastSeen=null;this.path=[];this.route=0;this.visited=0;this.replan=0;this.walk=this.speed=this.age=0;this.stepDistance=0;this.caught=false;this.stuck=0;}
 get active(){return this.mode!=='dormant'&&this.mode!=='gone';}
 start(){this.reset();this.mode='search';this.plan(SEARCH_ROUTE[0]);}
 retreat(){this.mode='retreat';this.witnessed=null;this.lastSeen=null;this.awareness=0;this.plan({x:5.8,y:0,z:11});}
 planningBoxes(){const leaves=new Set(this.world.objects.filter(o=>o.kind==='door'&&o.state!=='open').flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)]));return this.world.boxes.filter(b=>!leaves.has(b));}
 buildGraph(){
  if(this.nodes)return;
  const doors=new Set(this.world.objects.filter(o=>o.kind==='door').flatMap(o=>[o.box,...(o.parts||[]).map(p=>p.box)])),boxes=this.world.boxes.filter(b=>!doors.has(b));
  this.nodes=[];this.cells=new Map();
  for(let i=0;i<35;i++)for(let j=0;j<30;j++)for(const level of [0,HEIGHT]){
   const x=.2+i*CELL,z=.2+j*CELL,y=groundHeight(x,z,level),key=i+','+j;if(!Number.isFinite(y)||blocked(boxes,x,y,z,.16,1.72))continue;
   const cell=this.cells.get(key)||[];if(cell.some(n=>Math.abs(n.y-y)<.1))continue;
   const n={x,y,z,i,j,index:this.nodes.length};cell.push(n);this.cells.set(key,cell);this.nodes.push(n);
  }
  for(const n of this.nodes){n.neighbors=[];for(const [di,dj]of [[1,0],[-1,0],[0,1],[0,-1]])for(const next of this.cells.get((n.i+di)+','+(n.j+dj))||[]){if(Math.abs(next.y-n.y)>.34)continue;let clear=true;for(let k=1;k<=4;k++){const t=k/4;if(blocked(boxes,n.x+(next.x-n.x)*t,n.y+(next.y-n.y)*t,n.z+(next.z-n.z)*t,.16,1.72)){clear=false;break;}}if(clear)n.neighbors.push(next.index);}}
 }
 plan(goal){
  this.buildGraph();const boxes=this.planningBoxes(),available=n=>!blocked(boxes,n.x,n.y,n.z,.16,1.72),nearest=p=>{let best=null,d=Infinity;for(const n of this.nodes){const v=dist(n,p);if(v<d&&available(n)){best=n;d=v;}}return best;};
  const start=nearest(this),end=nearest(goal);this.goal={...goal};this.path=[];this.replan=.8;if(!start||!end)return false;
  const open=new Set([start.index]),cost=new Map([[start.index,0]]),parent=new Map();let found=false;
  while(open.size){let id=null,best=Infinity;for(const i of open){const f=cost.get(i)+dist(this.nodes[i],end);if(f<best){best=f;id=i;}}open.delete(id);if(id===end.index){found=true;break;}
   for(const ni of this.nodes[id].neighbors){const n=this.nodes[ni];if(!available(n))continue;const value=cost.get(id)+dist(this.nodes[id],n);if(value>=(cost.get(ni)??Infinity))continue;cost.set(ni,value);parent.set(ni,id);open.add(ni);}
  }
  if(!found)return false;let at=end.index;while(at!==start.index){this.path.unshift(this.nodes[at]);at=parent.get(at);}this.path.unshift(start);return true;
 }
 canSee(p){
  if(p.hidden)return false;const dx=p.x-this.x,dz=p.z-this.z,d=Math.hypot(dx,dz),range=p.crouched?4.2:p.flashlight?8:6.5;
  if(d>range||Math.abs(p.y-this.y)>1.8)return false;
  if(d>1.6&&(dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw))/Math.max(.01,d)<.05)return false;
  return !lineBlocked(this.world.boxes,{x:this.x,y:this.y+1.4,z:this.z},{x:p.x,y:p.y+(p.crouched?.75:1.1),z:p.z});
 }
 update(dt,p,onDoor=()=>{}){
  const cues=[];if(!this.active||dt<=0)return cues;
  const visible=this.mode!=='retreat'&&this.canSee(p);this.lost=visible?0:this.lost+dt;
  this.awareness=Math.max(0,Math.min(1,this.awareness+dt*(visible?(p.crouched?1:1.7):-.5)));
  if(visible){this.lastSeen={x:p.x,y:p.y,z:p.z};if(p.entering)this.witnessed=p.hideId;}
  if(this.awareness>=1&&this.mode!=='chase'){this.mode='chase';cues.push('spotted');this.replan=0;}
  if(this.mode==='chase'&&this.lost>3&&!this.witnessed){this.mode='search';cues.push('lost');}
  const witnessed=p.hidden&&this.witnessed===p.hideId;
  if((visible||witnessed)&&Math.abs(this.y-p.y)<.6&&Math.hypot(this.x-p.x,this.z-p.z)<(witnessed?1.5:.85)){this.caught=true;cues.push('caught');return cues;}
  this.replan-=dt;
  const target=this.mode==='retreat'?{x:5.8,y:0,z:11}:witnessed?(p.hideExit||this.lastSeen):this.lastSeen&&this.lost<4?this.lastSeen:SEARCH_ROUTE[this.route];
  if(this.replan<=0&&(this.mode==='chase'||!this.path.length||this.stuck>.5||!this.goal||dist(target,this.goal)>.5))this.plan(target);
  for(const door of this.world.objects)if(door.kind==='door'&&door.state!=='open'&&Math.abs(door.y-1.1-this.y)<1.2&&Math.hypot(door.x-this.x,door.z-this.z)<1.6)onDoor(door);
  let moved=0;
  const next=this.path[0];if(next){const dx=next.x-this.x,dz=next.z-this.z,d=Math.hypot(dx,dz);if(d<.07){this.path.shift();}else{
   this.yaw=Math.atan2(dx,dz);const step=Math.min(d,dt*(this.mode==='chase'?2.15:1.45));moved=navigate(this,this.world,dx/d*step,dz/d*step,1.72);this.walk+=moved;this.stepDistance+=moved;this.stuck=moved<.003?this.stuck+dt:0;
   if(this.stepDistance>.65){this.stepDistance%=.65;cues.push('step');}
  }}else if(this.goal&&dist(this,this.goal)<.8){if(this.mode==='retreat'){this.mode='gone';cues.push('gone');}else{this.lastSeen=null;this.witnessed=null;this.visited++;this.route=(this.route+1)%SEARCH_ROUTE.length;this.plan(SEARCH_ROUTE[this.route]);}}
  this.age+=dt;
  this.speed+=(moved/dt-this.speed)*(1-Math.exp(-8*dt));
  const turn=this.yaw-this.facing;
  this.facing+=Math.atan2(Math.sin(turn),Math.cos(turn))*(1-Math.exp(-12*dt));
  return cues;
 }
 snapshot(){return {x:this.x,y:this.y,z:this.z,yaw:this.yaw,facing:this.facing,mode:this.mode,awareness:this.awareness,lost:this.lost,walk:this.walk,speed:this.speed,age:this.age,active:this.active,witnessed:this.witnessed,path:this.path.length,caught:this.caught};}
}
