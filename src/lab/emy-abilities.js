// Emy's tactical commands use the ACTUAL house dimensions, room data, stairs
// and walkable surfaces. This module does not modify story saves/checkpoints.
import {HEIGHT,HOUSE,STAIR,groundHeight,blocked} from './world.js';

export const EMY_SCAN_SECONDS=6;
export const EMY_SCAN_COOLDOWN=28;
export const EMY_DISTRACT_SECONDS=25;
export const EMY_DISTRACT_COOLDOWN=55;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// The name tag is a one-second, edge-triggered cue, never a persistent HUD.
export function createEmyNameCue(){return {left:0,cooldown:0,looking:false};}
export function advanceEmyNameCue(state,dt,looking,active=true,allowCue=true){
 const step=active?clamp(Number.isFinite(dt)?dt:0,0,.1):0;
 state.left=Math.max(0,state.left-step);
 state.cooldown=Math.max(0,state.cooldown-step);
 // A phone, cutaway or occupied hand hides the tag without resetting the
 // look-edge; ordinary gameplay still counts toward the three-minute wait.
 if(!active||!allowCue){state.left=0;return false;}
 if(!looking)state.left=0;
 if(looking&&!state.looking&&state.cooldown===0){
  state.left=1;state.cooldown=180;
 }
 state.looking=!!looking;
 return state.left>0&&looking;
}
export function createEmyAbilities(){return {scan:0,scanCooldown:0,distractCooldown:0,wave:0};}
export function advanceEmyAbilities(state,dt){
 const step=clamp(Number.isFinite(dt)?dt:0,0,.1);
 state.scan=Math.max(0,state.scan-step);
 state.scanCooldown=Math.max(0,state.scanCooldown-step);
 state.distractCooldown=Math.max(0,state.distractCooldown-step);
 state.wave=Math.max(0,state.wave-step);
}
export function activateEmyScan(state){
 if(state.scanCooldown>0)return false;
 state.scan=EMY_SCAN_SECONDS;state.scanCooldown=EMY_SCAN_COOLDOWN;state.wave=1.1;
 return true;
}

// The two long passages are NOT invented rooms. They are the real spaces
// between the 4.4 m/7.5 m partitions and, upstairs, the upstairs floor slabs.
// The upstairs stairwell void is intentionally excluded (no floating waypoint).
const SHORT={
 study:'Estudio',living:'Sala',kitchen:'Cocina',bath:'Baño',
 stairs:'Escalera',bedroom:'Dormitorio',reading:'Lectura',music:'Música',
 'hall-ground':'Pasillo','hall-upper':'Distribuidor'
};
const DOORS={study:'estudio',living:'salon',kitchen:'cocina',bath:'bano',
 bedroom:'dormitorio',reading:'lectura',music:'habitación'};
const rectangle=(x0,x1,z0,z1)=>({x0,x1,z0,z1});
export function roomChoices(rooms){
 const study=rooms.find(r=>r.id==='study'),kitchen=rooms.find(r=>r.id==='kitchen');
 const bath=rooms.find(r=>r.id==='bath'),music=rooms.find(r=>r.id==='music');
 if(!study||!kitchen||!bath||!music)return [];
 const west=study.x1,east=kitchen.x0;
 const hallGround={
  id:'hall-ground',label:'Recibidor y pasillo',short:SHORT['hall-ground'],floor:0,kind:'corridor',
  segments:[rectangle(west,east,0,HOUSE.depth),rectangle(east,bath.x1,bath.z1,HOUSE.depth)],
  hints:[{x:5.9,z:8.2},{x:6,z:4.1}]
 };
 const hallUpper={
  id:'hall-upper',label:'Distribuidor y descansillo',short:SHORT['hall-upper'],floor:1,kind:'corridor',
  segments:[
   rectangle(west,east,0,HOUSE.depth),
   rectangle(east,STAIR.wellX,music.z1,HOUSE.depth),
   rectangle(STAIR.wellX,HOUSE.width,music.z1,STAIR.zTop),
   rectangle(STAIR.wellX,HOUSE.width,STAIR.wellZ,HOUSE.depth)
  ],
  hints:[{x:9,z:4.1},{x:8.8,z:9.2},{x:6,z:8.4}]
 };
 const hints={
  study:[{x:3.62,z:2.5}],living:[{x:3.55,z:7.1}],
  kitchen:[{x:8.55,z:2.60}],bath:[{x:8.20,z:5.75}],
  stairs:[{x:12,z:10.78},{x:10.55,z:10.90}],
  bedroom:[{x:3.55,z:2.46}],reading:[{x:3.53,z:6.95}],
  music:[{x:9.0,z:2.23}]
 };
 const mapped=rooms.map(room=>({
  ...room,kind:room.id==='stairs'?'stairs':'room',
  short:SHORT[room.id]||room.label,
  segments:[rectangle(room.x0,room.x1,room.z0,room.z1)],
  hints:hints[room.id]||[]
 }));
 // Keep the order spatial and meaningful: 6 destinations downstairs, 4 upstairs.
 return [
  ...mapped.filter(r=>r.floor===0&&r.id!=='stairs'),hallGround,
  ...mapped.filter(r=>r.floor===0&&r.id==='stairs'),
  ...mapped.filter(r=>r.floor===1),hallUpper
 ];
}
export function isEmyRoomLocked(world,choice){
 const id=DOORS[choice?.id];
 const door=id&&world.objects.find(o=>o.id===id&&o.kind==='door');
 return !!door&&(door.locked||door.sealed)&&!door.open;
}
function walkable(world,choice,point){
 const level=choice.floor?HEIGHT:0;
 if(!Number.isFinite(point.x)||!Number.isFinite(point.z))return null;
 const y=groundHeight(point.x,point.z,level,world.hatch?.amount>.92);
 if(!Number.isFinite(y)||Math.abs(y-level)>.18||blocked(world.boxes,point.x,y,point.z,.20,.72))return null;
 return {x:point.x,y,z:point.z};
}
export function roomDestinations(world,choice){
 if(!choice||!Array.isArray(choice.segments))return [];
 const candidates=[],visited=new Set();
 const add=(x,z)=>{
  const k=x.toFixed(2)+':'+z.toFixed(2);
  if(visited.has(k))return;
  visited.add(k);
  if(!choice.segments.some(rect=>x>=rect.x0+.18&&x<=rect.x1-.18&&z>=rect.z0+.18&&z<=rect.z1-.18))return;
  const p=walkable(world,choice,{x,z});if(p)candidates.push(p);
 };
 // Places near actual room entrances are easier to reach than the middle of
 // large pieces of furniture. Check walkability on every candidate.
 for(const p of choice.hints||[])add(p.x,p.z);
 for(const rect of choice.segments){
  const cx=(rect.x0+rect.x1)/2,cz=(rect.z0+rect.z1)/2;
  for(const [u,v] of [[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75],
   [.25,.25],[.75,.25],[.25,.75],[.75,.75],[.38,.38],[.62,.62]]){
   add(rect.x0+(rect.x1-rect.x0)*u,rect.z0+(rect.z1-rect.z0)*v);
  }
 }
 return candidates.slice(0,12);
}
export function roomDestination(world,choice){return roomDestinations(world,choice)[0]||null;}

const percent=(v,dim)=>(100*clamp(v/dim,0,1)).toFixed(3)+'%';
const boxStyle=r=>[
 'left:'+percent(r.x0,HOUSE.width),'top:'+percent(r.z0,HOUSE.depth),
 'width:'+percent(r.x1-r.x0,HOUSE.width),'height:'+percent(r.z1-r.z0,HOUSE.depth)
].join(';');

export function emyFloorMap(rooms,floor,{selectedId='',lockedIds=[]}={}){
 const choices=roomChoices(rooms).filter(r=>r.floor===floor);
 const locked=new Set(lockedIds),level=floor?'alta':'baja';
 let index=0;
 const tiles=choices.flatMap(room=>{
  const number=String(++index).padStart(2,'0'),selected=selectedId===room.id,blocked=locked.has(room.id);
  return room.segments.map((rect,part)=>'<button type="button" class="house-emy-room house-emy-'+room.kind+
   (selected?' is-selected':'')+(blocked?' is-locked':'')+(part?' is-extension':'')+
   '" data-act="emy:room:'+room.id+'" data-zone="'+room.id+'" data-floor="'+floor+
   '" aria-label="Seleccionar '+escapeHTML(room.label)+', planta '+level+
   (blocked?', puerta bloqueada':'')+'" aria-pressed="'+selected+'"'+
   (blocked?' disabled':'')+' style="'+boxStyle(rect)+'">'+
   (part===0?'<span class="house-emy-index">'+number+'</span>'+
   '<span class="house-emy-room-name">'+escapeHTML(room.short)+'</span>':'')+
   '</button>');
 }).join('');
 const voidRect=rectangle(STAIR.wellX,HOUSE.width,STAIR.zTop,STAIR.wellZ);
 const run=rectangle(STAIR.xMin,STAIR.xMax,STAIR.zTop,STAIR.zBottom);
 const stairVisual=floor?
  '<div class="house-emy-stair-void" aria-hidden="true" style="'+boxStyle(voidRect)+'">Hueco<br>escalera ↕</div>':
  '<div class="house-emy-stair-flight" aria-hidden="true" style="'+boxStyle(run)+'">↑</div>';
 return '<div class="house-emy-plan" role="group" aria-label="Plano real de la planta '+level+'">'+
  '<div class="house-emy-north" aria-hidden="true">NORTE ↑</div>'+
  tiles+stairVisual+
  '<div class="house-emy-entrance" aria-hidden="true">↓ '+(floor?'SUR':'ENTRADA')+'</div>'+
  '</div>';
}
export function emyFloorList(rooms,floor,{selectedId='',lockedIds=[],disabledReasons={}}={}){
 const choices=roomChoices(rooms).filter(r=>r.floor===floor),locked=new Set(lockedIds);
 return choices.map((room,index)=>{
  const selected=selectedId===room.id,blocked=locked.has(room.id),reason=disabledReasons[room.id]||'Puerta cerrada';
  return '<button type="button" class="house-emy-destination'+(selected?' is-selected':'')+
   (blocked?' is-locked':'')+'" data-act="emy:room:'+room.id+'" data-zone="'+room.id+
   '" aria-pressed="'+selected+'"'+(blocked?' disabled':'')+'>'+
   '<span class="house-emy-destination-number">'+String(index+1).padStart(2,'0')+'</span>'+
   '<span class="house-emy-destination-name">'+escapeHTML(room.label)+'</span>'+
   (blocked?'<small>'+escapeHTML(reason)+'</small>':'<span class="house-emy-destination-arrow" aria-hidden="true">›</span>')+
   '</button>';
 }).join('');
}
