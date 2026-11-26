import {poseEmy} from './emy-cat.js';
import {housePowered} from './house-lights.js';
import {BATH_MIRROR} from './mirror.js';
import {roomAt,lineBlocked} from './world.js';

// Scene references and completion predicates are editable in route order.
export const RESCUE_ROUTE=[
 ['Abre el cajón del escritorio para buscar una herramienta','drawer',c=>c.world.objects.find(o=>o.id==='drawer')?.open||c.s.inventory.screwdriver||c.world.studyVent.unlatched||c.puzzle.key],
 ['Recoge el destornillador que aparece dentro del cajón','screwdriver',c=>c.s.inventory.screwdriver||c.world.studyVent.unlatched||c.puzzle.key],
 ['Retira la tapa del conducto del estudio','emy-vent',c=>c.world.studyVent.unlatched||c.puzzle.key],
 ['Envía a Emy a buscar la llave del dormitorio','emy-vent',c=>c.puzzle.key],
 ['Abre el dormitorio','dormitorio',c=>c.puzzle.door],
 ['Busca refugio y espera a que se duerma','wardrobe',c=>!['explore','arrival','hide','patrol','resting'].includes(c.events.phase)],
 ['Lee la nota invertida del dormitorio','mirror-note',c=>c.mirrorSafe.collected||c.mirrorSafe.opened],
 ['Sal del dormitorio y despista al secuestrador','dormitorio',c=>!['sleep','lockdown','hunt'].includes(c.events.phase)],
 ['Acerca la nota al espejo iluminado','bath-mirror',c=>c.mirrorSafe.revealed||c.mirrorSafe.opened],
 ['Abre la caja fuerte del dormitorio','mirror-safe',c=>c.mirrorSafe.opened],
 ['Recoge la partitura de la caja','piano-sheet',c=>c.world.pianoSheet.taken],
 ['Toca la partitura en el descansillo','piano',c=>c.world.piano.solved],
 ['Recoge la llave roja del piano','red-key',c=>c.world.piano.reward.taken||!c.world.hatch.locked],
 ['Aparta el tapete rojo de la cocina','hatch-rug',c=>c.world.hatchRug.aside||!c.world.hatch.locked],
 ['Abre la escotilla','basement-hatch',c=>!c.world.hatch.locked],
 ['Recoge la llave maestra junto a Louis','master-key',c=>c.s.inventory.masterKey],
 ['Desata a Louis','rescue-louis',c=>c.puzzle.rescued],
 ['Espera a Louis tras la barra','hide-kitchen',c=>['rc-setup','escape','ending','safe'].includes(c.events.phase)],
 ['Recoge el auto y la tablet','rc-car',c=>c.s.inventory.rc||c.rcTrap.closed],
 ['Prepara la escotilla','basement-hatch',c=>c.rcTrap.armed||c.rcTrap.closed],
 ['Atrae al secuestrador al túnel y cierra desde la tablet','basement-hatch',c=>c.rcTrap.closed],
 ['Sal al jardín con Louis','entrada',c=>['ending','safe'].includes(c.events.phase)]
];
export function createRescueObjectives(){
 const tracker=new EventTarget();
 tracker.active=null;
 tracker.update=context=>{
  const row=RESCUE_ROUTE.find(([, ,complete])=>!complete(context));
  const target=row&&(row[1]==='bath-mirror'?BATH_MIRROR:context.world.objects.find(o=>o.id===row[1]));
  if(tracker.active?.name!==row?.[0]||tracker.active?.target!==target){
   tracker.active=row?{name:row[0],target}:null;
   tracker.dispatchEvent(new Event('change'));
  }
  return tracker.active;
 };
 return tracker;
}

export const EMY_SENSES={dangerDistance:3.2,earAngle:.52,earSpeed:2.0,smoothing:6};
export const ALTAR_THRESHOLD={x:9,y:3.15,z:3.6};
export function updateEmySenses(companion,player,world,enemy,objective,dt,beam){
 const cat=companion.cat;
 cat.darkEyes=!housePowered(world.lights.power);
 const live=['following','stay','hold','distract','distract-recover'].includes(companion.stage);
 if(!live){companion.altarWait=false;companion.altarFear=false;cat.earTurn=0;cat.earFlatten=0;cat.alarm=0;cat.senseTarget=null;cat.curiosityTarget=null;return;}
 const wasWaiting=!!companion.altarWait;
 const inside=roomAt(player.x,player.z,player.y)==='Sala de música';
 companion.altarWait=companion.stage==='following'&&inside;
 if(wasWaiting!==companion.altarWait){
  Object.assign(companion,{route:[],trail:[],routeTarget:null,nextPlanAt:0,nextSight:0,direct:false,chasing:undefined,stuck:0});
 }
 const nearAltar=Math.abs(cat.y-ALTAR_THRESHOLD.y)<.45&&Math.hypot(cat.x-ALTAR_THRESHOLD.x,cat.z-ALTAR_THRESHOLD.z)<2.1;
 const altarFear=nearAltar&&(inside||Math.abs(player.y-ALTAR_THRESHOLD.y)<.45&&Math.hypot(player.x-ALTAR_THRESHOLD.x,player.z-ALTAR_THRESHOLD.z)<1.45);
 companion.altarFear=altarFear;
 const gap=Math.hypot(cat.x-enemy.x,cat.z-enemy.z),sameFloor=Math.abs(cat.y-enemy.y)<1.1;
 const active=enemy.active&&!['trapped','sleeping','stunned'].includes(enemy.mode);
 // Do not detect an enemy through a ceiling or use omniscient hints. Nearby
 // footsteps can cause mild concern through a wall, but full bristle needs
 // close line of sight or an actual chase in Emy's vicinity.
 const nearby=active&&sameFloor&&gap<EMY_SENSES.dangerDistance;
 const chasing=enemy.mode==='chase'&&active&&sameFloor&&gap<7&&Math.abs(player.y-cat.y)<1.1&&Math.hypot(player.x-cat.x,player.z-cat.z)<5;
 const visible=nearby&&!lineBlocked(world.boxes,{x:cat.x,y:cat.y+.42,z:cat.z},{x:enemy.x,y:enemy.y+1.05,z:enemy.z});
 const close=nearby&&gap<1.5;
 const danger=altarFear?1:chasing?.96:visible?Math.max(.45,1-gap/5.4):close?.48:nearby?.26:0;
 // Inspect nearby actual props occasionally, not on every animation frame.
 companion.senseClock=(companion.senseClock||0)+dt;
 if(companion.senseClock>=(companion.nextCuriosity||0)){
  companion.nextCuriosity=companion.senseClock+2.6;
  const eye={x:cat.x,y:cat.y+.43,z:cat.z};
  const objects=world.objects.filter(o=>!o.taken&&!o.concealed&&o.kind!=='emy-cat'&&['inspect','door','light-switch','piano','television','note','drawer','cupboard'].includes(o.kind)&&Math.abs(o.y-cat.y)<1.9&&Math.hypot(o.x-cat.x,o.z-cat.z)<3.2);
  objects.sort((a,b)=>Math.hypot(a.x-cat.x,a.z-cat.z)-Math.hypot(b.x-cat.x,b.z-cat.z));
  const visibleObjects=objects.slice(0,8).filter(o=>!lineBlocked(world.boxes,eye,{x:o.x,y:o.y,z:o.z},o.box?.id||''));
  const other=visibleObjects.find(o=>o.id!==cat.curiosityTarget?.id)||visibleObjects[0];
  cat.curiosityTarget=other?{id:other.id,x:other.x,y:other.y,z:other.z}:null;
 }
 let target=altarFear?{x:12.27,y:cat.y,z:.44}:danger>0?{x:enemy.x,y:enemy.y,z:enemy.z}:cat.curiosityTarget;
 if(!target&&companion.stage==='following'&&objective?.target){
  // Preserve the original subtle directional clue when there is nothing
  // nearby worth investigating, without overriding a real fear reaction.
  target=objective.target;
  if(Math.abs(cat.y-(target.floor??target.y))>2.65)target=cat.y<1.6?{x:12,y:cat.y,z:9.95}:{x:12,y:cat.y,z:4.95};
}
 // A mild sound reaction may turn ears toward a noise, but never reveal a
 // pursuer marker or exact location to the player.
 cat.senseTarget=target;
 let turn=target?Math.atan2(target.x-cat.x,target.z-cat.z)-cat.yaw:0;
 turn=Math.max(-EMY_SENSES.earAngle,Math.min(EMY_SENSES.earAngle,Math.atan2(Math.sin(turn),Math.cos(turn))));
 const flick=companion.senseClock%5.3,earFlick=flick<.23?Math.sin(flick/.23*Math.PI)*.14:0;
 const blend=1-Math.exp(-dt*EMY_SENSES.smoothing),step=dt*EMY_SENSES.earSpeed;
 cat.earTurn=(cat.earTurn||0)+Math.max(-step,Math.min(step,(turn+earFlick-(cat.earTurn||0))*blend));
 const fearBlend=1-Math.exp(-dt*(danger>(cat.alarm||0)?7:1.35));
 cat.alarm=(cat.alarm||0)+(danger-(cat.alarm||0))*fearBlend;
 cat.earFlatten=(cat.earFlatten||0)+(danger-(cat.earFlatten||0))*blend;
}
const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
// The camera sees Kitty held at the threshold, Emy striking, then all three leaving.
export function poseEscapeAmbush(shot,cat,enemy,reduced){
 const t=shot.elapsed,start=shot.kitty.from,approach=ease(t/1.05),recoil=ease((t-2.1)/.85);
 // The 3D entrance/front wall is at z=12. The old pursuer stayed INSIDE
 // at z≈11 and disappeared behind the opaque wall from the exterior camera.
 // Stage the encounter just OUTSIDE the front threshold in a readable lane.
 Object.assign(enemy,{x:start.x+.58+.68*recoil,y:0,z:Math.max(12.37,start.z-.10)+.26*approach-.05*recoil,
  yaw:Math.PI*.08+recoil*1.2,mode:t<2.1?'chase':'trapped',speed:t<1?1.5:0});
 enemy.facing=enemy.yaw;
 // Emy enters the exterior lane before the warning. Her existing four-paw
 // rig compresses before takeoff, extends at the impact and absorbs landing.
 if(t<.95)return false;
 const appeared=cat.hidden;
 cat.hidden=false;for(const {box} of cat.parts)box.hiddenGeometry=false;
 if(appeared){cat.footContacts=null;cat.lastFootRoot=null;}
 const turn=(a,b,v)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*v;
 const mix=(a,b,v)=>a+(b-a)*v;
 const from={x:start.x-1.25,z:start.z+.18};
 const takeoff={x:start.x-.68,z:start.z+.16};
 const strike={x:start.x+.43,z:Math.max(12.37,start.z-.10)+.47};
 const landing={x:start.x+.18,z:start.z+.92};
 const lead={x:5.38,z:17.05};
 const approachCat=ease((t-.95)/.38);
 const flight=Math.max(0,Math.min(1,(t-1.45)/1.28));
 const up=ease((t-1.45)/.63),down=ease((t-2.08)/.65);
 const run=ease((t-2.84)/.94);
 const prep=ease((t-1.23)/.22)*(1-ease((t-1.45)/.14));
 const absorb=ease((t-2.65)/.10)*(1-ease((t-2.75)/.18));
 const face=Math.atan2(strike.x-takeoff.x,strike.z-takeoff.z);
 const retreatFace=Math.atan2(landing.x-strike.x,landing.z-strike.z);
 const leadFace=Math.atan2(lead.x-landing.x,lead.z-landing.z);
 const x=t<1.45?mix(from.x,takeoff.x,approachCat):t<2.08?mix(takeoff.x,strike.x,up):mix(strike.x,landing.x,down);
 const z=t<1.45?mix(from.z,takeoff.z,approachCat):t<2.08?mix(takeoff.z,strike.z,up):mix(strike.z,landing.z,down);
 // Ballistic rise and fall: gravity accelerates the descent instead of
 // easing to a hover just before touching the ground. The paws absorb it.
 const height=3.84*flight*(1-flight);
 const yaw=t<2.08?face:t<2.73?turn(face,retreatFace,down):turn(retreatFace,leadFace,ease((t-2.73)/.17));
 Object.assign(cat,{x:mix(x,lead.x,run),z:mix(z,lead.z,run),y:height,
  yaw:turn(yaw,0,ease((t-3.56)/.22)),alarm:ease((t-1.10)/.25)*(1-ease((t-2.44)/.40)),
  earFlatten:ease((t-1.10)/.25)*(1-ease((t-2.44)/.40))});
 const walking=t<1.33||t>2.84&&t<3.78,airborne=t>1.45&&t<2.73;
 poseEmy(cat,{mode:walking?'walk':'idle',walking,phase:t,reduced,
  leap:{compression:Math.max(prep,absorb),flight,airborne,strike:ease((t-1.83)/.22)*(1-ease((t-2.10)/.24))}});

 return appeared;
}

// An emergency rescue happens exactly ONCE when the fourth life marker
// reaches zero. Emy leaps in from the side instead of teleporting Kitty or
// swapping the existing pursuer mesh. This is a 3D pose on the SAME Emy rig.
export function poseEmyLastChance(shot,cat,enemy,reduced=false){
 const t=Math.max(0,shot.elapsed),home=shot.kitty,threat=shot.attacker;
 const appear=t>=.55,leap=ease((t-.55)/.78),retreat=ease((t-1.40)/.72);
 if(!appear)return false;
 const wasHidden=cat.hidden;
 cat.hidden=false;
 for(const {box} of cat.parts)box.hiddenGeometry=false;
 const sideX=home.x-.92,sideZ=home.z+.58;
 const strikeX=threat.x-.16,strikeZ=threat.z+.13;
 Object.assign(cat,{
  x:sideX+(strikeX-sideX)*leap-.20*retreat,
  z:sideZ+(strikeZ-sideZ)*leap+.56*retreat,
  y:home.y+(leap<1?Math.sin(Math.PI*leap)*.40:0),
  yaw:Math.atan2(threat.x-sideX,threat.z-sideZ),
  reaction:t<1.45?1:0
 });
 enemy.x=threat.x+(threat.x-home.x)*.55*retreat;
 enemy.y=threat.y;
 enemy.z=threat.z+(threat.z-home.z)*.55*retreat;
 enemy.facing=enemy.yaw=threat.yaw??0;
 enemy.speed=0;
 if(t>=1.4)enemy.mode='stunned';
 poseEmy(cat,{mode:t<1.45?'jump':'idle',walking:false,phase:t,reduced});
 return wasHidden;
}
