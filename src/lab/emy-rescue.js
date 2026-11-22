import {poseEmy} from './emy-cat.js';
import {housePowered} from './house-lights.js';
import {BATH_MIRROR} from './mirror.js';
import {roomAt} from './world.js';

// Scene references and completion predicates are editable in route order.
export const RESCUE_ROUTE=[
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
 if(companion.stage!=='following'){cat.earTurn=0;cat.alarm=0;return;}
 companion.altarWait=roomAt(player.x,player.z,player.y)==='Sala de música';
 const watching=['search','investigate','chase'].includes(enemy.mode);
 const close=Math.hypot(cat.x-enemy.x,cat.y-enemy.y,cat.z-enemy.z)<EMY_SENSES.dangerDistance&&Math.abs(cat.y-enemy.y)<1.8;
 const nearby=close&&enemy.active&&!['trapped','sleeping'].includes(enemy.mode);
 const danger=nearby||(watching&&enemy.canSee({...player,hidden:!!player.hidden,dark:cat.darkEyes,flashlight:beam}));
 let target=danger?enemy:companion.altarWait?{x:12.27,z:.44}:objective?.target;
 if(!danger&&!companion.altarWait&&target&&Math.abs(cat.y-(target.floor??target.y))>2.65){
  target=cat.y<1.6?{x:12,z:9.95}:{x:12,z:4.95};
 }
 let turn=target?Math.atan2(target.x-cat.x,target.z-cat.z)-cat.yaw:0;
 turn=Math.max(-EMY_SENSES.earAngle,Math.min(EMY_SENSES.earAngle,Math.atan2(Math.sin(turn),Math.cos(turn))));
 const blend=1-Math.exp(-dt*EMY_SENSES.smoothing),step=dt*EMY_SENSES.earSpeed;
 cat.earTurn=(cat.earTurn||0)+Math.max(-step,Math.min(step,(turn-(cat.earTurn||0))*blend));
 cat.alarm=(cat.alarm||0)+(Number(danger||companion.altarWait)-(cat.alarm||0))*blend;
}
const ease=t=>{t=Math.min(1,Math.max(0,t));return t*t*(3-2*t);};
// The camera sees Kitty held at the threshold, Emy striking, then all three leaving.
export function poseEscapeAmbush(shot,cat,enemy,reduced){
 const t=shot.elapsed,start=shot.kitty.from,approach=ease(t/1.05),recoil=ease((t-2.1)/.85);
 Object.assign(enemy,{x:start.x+.12+.6*recoil,y:0,z:start.z-1.65+1.22*approach-.95*recoil,
  yaw:Math.PI*.08+recoil*1.2,mode:t<2.1?'chase':'trapped',speed:t<1?1.5:0});
 enemy.facing=enemy.yaw;
 if(t<1.45)return false;
 const appeared=cat.hidden;
 cat.hidden=false;for(const {box} of cat.parts)box.hiddenGeometry=false;
 const leap=ease((t-1.45)/.88),land=ease((t-2.33)/.64),run=ease((t-3.1)/3.3);
 Object.assign(cat,{x:start.x-1.25+1.4*leap+.28*land+.15*run,
  z:start.z-.15-.23*leap+.54*land+2.1*run,
  y:land===1?0:Math.sin(leap*Math.PI)*.36+.94*leap*(1-land),yaw:Math.PI*.53*(1-land)});
 poseEmy(cat,{mode:land<1?'jump':run>0?'walk':'idle',walking:run>0&&run<1,phase:t,reduced});
 return appeared;
}
