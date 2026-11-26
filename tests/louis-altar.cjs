const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {createAltarVisit,advanceAltarVisit,activateAltarRecord}=await import('../src/lab/louis-altar.js');
 const {createHouse,roomAt,setDoor,blocked}=await import('../src/lab/world.js');
 const {createEmyCompanion,restoreEmyCompanion,updateEmyCompanion,sendEmyDistract}=await import('../src/lab/emy-companion.js');
 const {ALTAR_THRESHOLD,updateEmySenses}=await import('../src/lab/emy-rescue.js');
 const visit=createAltarVisit();assert(!activateAltarRecord(visit));
 assert(advanceAltarVisit(visit,{inside:false,near:true,afraid:true,dt:.1}).warn);
 assert(!advanceAltarVisit(visit,{inside:true,near:true,afraid:true,dt:.1}).warn,'Warn only once during the visit');
 assert(activateAltarRecord(visit));assert(!activateAltarRecord(visit),'No overlapping playback');
 for(let i=0;i<50;i++)advanceAltarVisit(visit,{inside:true,near:true,afraid:true,dt:.1});
 assert(visit.pulse>.99&&activateAltarRecord(visit));
 assert(advanceAltarVisit(visit,{near:false,inside:false,dt:.1}).left);
 assert(advanceAltarVisit(visit,{near:true,afraid:true,dt:.1}).warn,'New visit can warn again');
 const world=createHouse();const cat=createEmyCompanion(world.emy,{waiting:false});
 const doorway=ALTAR_THRESHOLD,inside={x:9,y:3.15,z:2.2,yaw:Math.PI};
 setDoor(world.objects.find(o=>o.id==='habitación'),true);
 assert.equal(roomAt(inside.x,inside.z,inside.y),'Sala de música');
 assert.notEqual(roomAt(doorway.x,doorway.z,doorway.y),'Sala de música');
 assert(!blocked(world.boxes,doorway.x,doorway.y,doorway.z,.16,.62),'Real exterior threshold must be walkable');
 restoreEmyCompanion(cat,{stage:'following',...doorway,yaw:Math.PI},'explore');
 const enemy={x:0,y:0,z:0,active:false,mode:'dormant'};
 const tick=player=>{updateEmySenses(cat,player,world,enemy,null,.05,false);updateEmyCompanion(cat,.05,{world,player,threat:enemy,reduced:true});};
 for(let i=0;i<160;i++){tick(inside);assert.notEqual(roomAt(cat.cat.x,cat.cat.z,cat.cat.y),'Sala de música');}
 assert(cat.altarWait&&cat.altarFear&&cat.cat.alarm>.95&&cat.cat.earFlatten>.9,'Emy waits outside, visibly alarmed with flattened ears');
 assert(!sendEmyDistract(cat,world,inside),'Cannot override fear with a command');
 const outside={x:6,y:3.15,z:5.5,yaw:0};
 for(let i=0;i<180;i++)tick(outside);
 assert(!cat.altarWait&&!cat.altarFear&&cat.cat.alarm<.1,'Leaving releases fear and restores normal following');
 assert.equal(cat.stage,'following');
 assert(Math.hypot(cat.cat.x-outside.x,cat.cat.z-outside.z)<2.5,'Cat rejoins Kitty after exit');
 for(const id of ['altar-ticket','altar-house-sketch','record-player','altar-mechon','altar-registro','president-dossier']){
  const o=world.objects.find(x=>x.id===id);assert(o&&o.text,'Existing and optional room clues are present');
 }
 assert.equal(world.boxes.filter(b=>b.id.startsWith('louis-altar-flame-')).length,4);
 const shader=fs.readFileSync('src/lab/material-shaders.js','utf8');
 assert(shader.includes('uAltarPulse')&&shader.includes('uHolidayMotion*sin(uTime*8.5'));
 console.log('PASS altar: real doorway refusal, visible fear, return to normal following, optional clues, bounded original record and shader-only candles');
})().catch(e=>{console.error(e);process.exitCode=1;});
