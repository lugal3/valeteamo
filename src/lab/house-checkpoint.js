import {poseArrivalCar} from './arrival-car.js';
import {HATCH,poseHatch,poseHatchRug} from './basement.js';
import {createLouisEscape,freeLouis,LOUIS_HIDING_SPOT} from './louis-escape.js';
import {WINDOW_LANDING} from './window-intro.js';
import {MASTER_KEY_ID,posePianoCompartment,posePianoReward,setPianoScore} from './house-additions.js';
import {HEIGHT,blocked,groundHeight,poseFurniture,setDoor,setDrawer} from './world.js';
import {hiddenPose,hidingExit} from './hiding.js';
import {revealGreyCat} from './grey-cat.js';

const VERSION=1;
const STAGES=['explore','encounter','rest','basement','rc-setup','escape'];
const SECOND_CHASE_PHASES=new Set(['sleep','lockdown','hunt']);
const PICKUPS=new Set(['key','note','flashlight','battery']);
const BEDROOM={x:2.39,y:HEIGHT,z:3.85,yaw:-Math.PI/2,pitch:-.46};
const KITCHEN={x:9.75,y:0,z:3.34,yaw:-Math.PI/2,pitch:-.89};
const STUDY={x:3.3,y:0,z:3.6,yaw:-2.8,pitch:0};
export const SAFE_REWARD={id:'safe-heart',label:'Sobre de la caja fuerte',
 text:'El sobre guarda el mismo corazón que aparece en el cuadro del salón.'};

export function captureHouseCheckpoint({world,s,puzzle,events,mirrorSafe,rc,rcTrap,batterySwap,pursuer}){
 const bedroom=world.objects.find(object=>object.id==='dormitorio');
 let stage=bedroom.locked?'explore':'encounter';
 if(SECOND_CHASE_PHASES.has(events.phase))stage='rest';
 if(events.phase==='evaded'||events.phase==='rc-rescue')stage='basement';
 if(events.phase==='rc-setup')stage='rc-setup';
 if(rcTrap.closed)stage='escape';
 const phase=events.phase==='hide'&&s.hidden?'patrol':events.phase;
 const pursuit=['patrol','hunt','evaded','rc-setup'].includes(phase)?{phase,actor:pursuer?.active?pursuer.checkpoint():null}:null;
 return {
  version:VERSION,stage,drawer:puzzle.drawer,
  picked:world.objects.filter(object=>PICKUPS.has(object.kind)&&object.taken).map(object=>object.id),
  rugAside:world.hatchRug.aside,hatchUnlocked:!world.hatch.locked,hatchOpen:world.hatch.open,
  mirrorRevealed:mirrorSafe.revealed,safeOpened:mirrorSafe.opened,pianoSolved:world.piano.solved,
  battery:Math.ceil(s.battery),spares:s.inventory.batteries+Number(batterySwap!==null),
  rcOwned:s.inventory.rc||rc.mode==='disabled',trapArmed:rcTrap.armed,
  exitUnlocked:rcTrap.closed?!world.objects.find(item=>item.id==='entrada').sealed:undefined,
  pursuit,hide:s.hidden?.objectId,blackout:{...world.lights.power.blackout}
 };
}

export function restoreHouseCheckpoint(saved,{world,s,puzzle,events,mirrorSafe,rc,rcTrap,pursuer}){
 if(saved?.version!==VERSION||!STAGES.includes(saved.stage)||!Array.isArray(saved.picked))return null;
 const stage=saved.stage;
 const bedroomUnlocked=stage!=='explore';
 const resting=stage==='rest';
 const escapedTrap=stage==='escape';
 // Old escape checkpoints already had an open exit before the piano key existed.
 const exitUnlocked=escapedTrap&&saved.exitUnlocked!==false;
 const louisUntied=stage==='rc-setup'||escapedTrap;
 const pursuitCompleted=louisUntied||stage==='basement';
 const patrol=stage==='encounter'&&saved.pursuit?.phase==='patrol';
 const hunt=stage==='rest'&&saved.pursuit?.phase==='hunt';
 const object=id=>world.objects.find(item=>item.id===id);
 const picked=new Set(saved.picked);
 const solvedPiano=saved.pianoSolved===true&&picked.has('piano-sheet');
 if(!solvedPiano)picked.delete(MASTER_KEY_ID);
 // Later checkpoints imply the prerequisites even if an older write omitted a pickup.
 if(bedroomUnlocked)picked.add('key');
 if(saved.hatchUnlocked===true||louisUntied)picked.add('red-key');
 for(const item of world.objects){
  if(PICKUPS.has(item.kind)&&picked.has(item.id))item.taken=true;
 }

 puzzle.note=!!object('note-hall').taken;
 puzzle.key=!!object('key').taken;
 puzzle.drawer=puzzle.key||saved.drawer===true;
 puzzle.door=bedroomUnlocked;
 puzzle.symbol=saved.safeOpened===true;
 puzzle.rescued=louisUntied;
 setDrawer(object('drawer'),puzzle.drawer);
 if(puzzle.door){
  const bedroom=object('dormitorio');
  bedroom.locked=false;setDoor(bedroom,true);
 }

 const note=object('mirror-note');
 mirrorSafe.collected=!!note.taken;
 mirrorSafe.revealed=mirrorSafe.collected&&saved.mirrorRevealed===true;
 mirrorSafe.opened=puzzle.symbol;
 if(mirrorSafe.opened){
  const safe=object('mirror-safe');
  poseFurniture(safe,1);safe.open=true;safe.state='open';
 }

 const inventory=s.inventory;
 for(const {id,kind,label,text,taken,mirrored} of world.objects){
  if(kind!=='note'||!taken)continue;
  if(!mirrored)inventory.notes.push({id,label,text});
  else if(mirrorSafe.revealed)inventory.notes.push({id,label:'Nota del espejo · resuelta',text});
  else inventory.pendingNote={id,label,text};
 }
 if(mirrorSafe.opened)inventory.notes.push({...SAFE_REWARD});
 if(solvedPiano){
  world.piano.solved=true;
  setPianoScore(world.piano,true);
  posePianoCompartment(world.piano,1);
 }
 posePianoReward(world.piano);
 inventory.masterKey=world.piano.reward.taken===true;
 inventory.key=puzzle.key&&!puzzle.door;
 inventory.torch=!!object('media-flashlight').taken;
 inventory.rc=saved.rcOwned===true||escapedTrap;
 if(inventory.rc){rc.object.taken=true;rc.object.interactable=false;}
 if(Number.isFinite(saved.battery))s.battery=Math.max(0,Math.min(100,saved.battery));
 const maxSpares=1+world.objects.filter(item=>item.kind==='battery').length;
 if(Number.isInteger(saved.spares))inventory.batteries=Math.max(0,Math.min(maxSpares,saved.spares));
 s.flashlight=inventory.torch&&s.battery>0;

 const hatch=world.hatch,rug=world.hatchRug;
 hatch.locked=saved.hatchUnlocked!==true&&!louisUntied;
 hatch.open=!hatch.locked&&!escapedTrap&&(saved.hatchOpen===true||stage==='rc-setup');
 if(!hatch.locked)for(const chain of hatch.chains)chain.hiddenGeometry=true;
 inventory.redKey=!!object('red-key').taken&&hatch.locked;
 rug.aside=saved.rugAside===true||hatch.open;
 poseHatch(hatch,Number(hatch.open));
 poseHatchRug(rug,Number(rug.aside));

 let louis=null;
 if(patrol||resting||pursuitCompleted){
  events.phase=patrol?'patrol':hunt?'hunt':resting?'sleep':'evaded';events.notified=true;events.replied=true;
  if(hunt)events.remaining=28;
  const entrance=object('entrada');
  entrance.sealed=hunt||(pursuitCompleted&&!exitUnlocked);setDoor(entrance,exitUnlocked);
  poseArrivalCar(world.car,1);
  poseFurniture(world.entryWindow,0);world.entryWindow.latch.hiddenGeometry=false;
  for(const box of world.boxes)if(box.id.startsWith('entry-padlock'))box.hiddenGeometry=!entrance.sealed;
 }
 if(resting&&!hunt)pursuer.sleep();
 const quiet=stage==='basement'||stage==='rc-setup';
 if(patrol||hunt||quiet){
  const phase=stage==='rc-setup'?'rc-setup':events.phase;
  const actor=saved.pursuit?.phase===phase?saved.pursuit.actor:null;
  if(!pursuer.restorePatrol(actor,quiet)){
   if(quiet){Object.assign(pursuer,{x:6,y:HEIGHT,z:5.8});pursuer.settleUpstairs();}
   else if(hunt){pursuer.resumeSearch();pursuer.cooldown();}
   else pursuer.start();
  }
  const {until,left}=saved.blackout??{};
  if(Number.isFinite(until)&&Number.isFinite(left)){
   world.lights.power.blackout={until:Math.max(0,Math.min(48,until)),left:Math.max(0,Math.min(5,left))};
  }
 }
 if(louisUntied){
  object('rescue-louis').taken=true;
  louis=Object.assign(object('captive-louis'),createLouisEscape(world),LOUIS_HIDING_SPOT,{
   phase:'hidden',age:1.6,crouch:1,concealed:true
  });
  for(const box of world.boxes)if(box.id.startsWith('captive-rope-'))box.hiddenGeometry=true;
  rcTrap.armed=stage==='rc-setup'&&saved.trapArmed===true;
  rcTrap.closed=escapedTrap;
  events.phase=stage;
  if(escapedTrap){
   freeLouis(louis);
   revealGreyCat(world.greyCat);
   Object.assign(pursuer,{mode:'trapped',x:HATCH.x,y:groundHeight(HATCH.x,6,-3,true),z:6});
  }
 }

 const pose=pursuitCompleted?KITCHEN:bedroomUnlocked?BEDROOM:puzzle.drawer||puzzle.note?STUDY:WINDOW_LANDING;
 const safePose=blocked(world.boxes,pose.x,pose.y,pose.z,.2,1.69)?WINDOW_LANDING:pose;
 Object.assign(s,safePose);
 const hide=object(saved.hide);
 if(hide?.kind==='hide'&&!louisUntied&&(patrol||resting||pursuitCompleted||stage==='explore')){
  const floor=hide.y>HEIGHT?HEIGHT:0,outside=hidingExit(world,hide,floor);
  if(outside){
   const inside=hiddenPose(hide,outside);
   Object.assign(s,{x:outside.x,y:floor,z:outside.z,eye:outside.eye,crouched:outside.crouched,hidden:inside,yaw:inside.yaw,pitch:inside.pitch});
   if(hide.wardrobeLeaves)poseFurniture(hide,.035);
  }
 }
 return {louis,encounterCheckpoint:patrol||resting?BEDROOM:null,equipment:inventory.torch?'flashlight':'empty'};
}
