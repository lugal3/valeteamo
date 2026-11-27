const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const src=fs.readFileSync('src/demo/rescue-overworld.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const nightJs=ts.transpileModule(fs.readFileSync('src/demo/night-house-layout.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const nightExports={};vm.runInNewContext(nightJs,{exports:nightExports});
const vanJs=ts.transpileModule(fs.readFileSync('src/demo/abduction-van.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const vanExports={};vm.runInNewContext(vanJs,{exports:vanExports});
const context={exports:{},require(name){
 if(name==='./night-house-layout')return nightExports;
 if(name==='./abduction-van')return vanExports;
 if(name==='./rescue-ecology-render')return {createLivingEcology:()=>({update:()=>null,counts:()=>({})})};
 if(name==='phaser')return {default:{Geom:{Point:class {constructor(x,y){this.x=x;this.y=y;}}}}};
 if(name==='../isometric')return {ISO:{originX:400,originY:68,tileW:82,tileH:40},toScreen:p=>({x:400+(p.u-p.v)*41,y:68+(p.u+p.v)*20})};
 throw Error('Unexpected dependency: '+name);
}};
vm.runInNewContext(js,context,{filename:'rescue-overworld.ts'});
const world=context.exports;
const ids=['morning_garden','afternoon_meeting','dusk_search','night_neighborhood'];
assert.deepEqual(Array.from(world.RESCUE_MAP_ORDER),ids,'exactly four chapters, not another long linear strip');
for(const [i,id] of ids.entries()){
 const def=world.RESCUE_SCENES[id];
 assert.equal(def.id,id);
 assert(def.maxU-def.minU<24,'each compact scene only has its own terrain');
 assert(world.constrainRescue({u:-100,v:500},id).u>=def.minU,
  'player cannot leave the active scene through unmarked world edges');
 assert(world.constrainRescue({u:1000,v:500},id).u<=def.maxU-.45,
  'portals, not open space, are the only way to enter next scene');
 if(i<3){
  assert.equal(def.exit.to,ids[i+1],'directed portal connects the next chapter');
  assert(world.routeLimits(def.exit.u).min<def.exit.v&&world.routeLimits(def.exit.u).max>def.exit.v,
   'each exit must be reachable from the terrain');
 }else assert.equal(def.exit,undefined,'night house exits to the real 3D, not another 2D map');
}
assert.equal(world.mapForStage('intro'),'morning_garden');
assert.equal(world.mapForStage('defend'),'afternoon_meeting');
assert.equal(world.mapForStage('disappearance'),'afternoon_meeting');
assert.equal(world.mapForStage('ribbon'),'dusk_search');
assert.equal(world.mapForStage('petals'),'dusk_search');
assert.equal(world.mapForStage('wheel'),'dusk_search');
assert.equal(world.mapForStage('door'),'night_neighborhood');
assert.equal(world.mapForStage('house'),'night_neighborhood');
assert(!world.exitReady('morning_garden','intro'));
assert(!world.exitReady('morning_garden','feed-cat'));
assert(world.exitReady('morning_garden','cat-fed'));
assert(!world.exitReady('afternoon_meeting','talk-louis'),
 'can not skip the garden encounter, kidnapping and Louis');
assert(world.exitReady('afternoon_meeting','ribbon'));
assert(!world.exitReady('dusk_search','wheel'),'clue must be inspected before night portal opens');
assert(world.exitReady('dusk_search','door'));
assert.equal(world.rescueArea(3),'sendero');
assert.equal(world.rescueArea(13),'puente');
assert.equal(world.rescueArea(28),'jardin');
assert.equal(world.rescueArea(50),'bosque');
assert.equal(world.rescueArea(68),'vecindario');
assert.equal(world.rescueArea(76),'casa');
assert(world.routeLimits(13).max-world.routeLimits(13).min<
 world.routeLimits(29).max-world.routeLimits(29).min,
 'river bridge must be narrower than the afternoon garden');
for(const id of ids)for(const u of [
 world.RESCUE_SCENES[id].spawn.u,
 (world.RESCUE_SCENES[id].minU+world.RESCUE_SCENES[id].maxU)/2
]){
 const p=world.constrainRescue({u,v:100},id),b=world.routeLimits(p.u);
 assert(p.v<=b.max&&p.v>=b.min,'player is always on safe walkable land');
}
const stages=['intro','feed-cat','cat-fed','meet-couple','defend','talk-louis','talk-luis','walk-together','disappearance',
 'ribbon','petals','wheel','door','window'];
for(let i=1;i<stages.length;i++){
 if(stages[i]==='window')continue;
 assert(world.STORY_POSITIONS[stages[i]].u>world.STORY_POSITIONS[stages[i-1]].u,
  'separate scenes retain forward narrative progression');
}
assert(world.STORY_POSITIONS.window.u<world.STORY_POSITIONS.door.u,
 'Kitty must return WEST along the front/south facade to the accessible window');
const toPixel=p=>({x:400+(p.u-p.v)*41,y:68+(p.u+p.v)*20});
const width=340,reference=toPixel(world.STORY_POSITIONS.door);
const frontLeft=reference.x-width*5.9/14;
const frontDoor={x:frontLeft+width*5.9/14,y:reference.y};
const portalDoor=toPixel(world.STORY_POSITIONS.door);
assert(Math.hypot(portalDoor.x-frontDoor.x,portalDoor.y-frontDoor.y)<2,
 'locked door aligns with south/front 3D facade entrance');
const westWindow={x:frontLeft+width*2.2/14,y:reference.y};
const portalWindow=toPixel(world.STORY_POSITIONS.window);
assert(Math.hypot(portalWindow.x-westWindow.x,portalWindow.y-westWindow.y)<2,
 'window target aligns with front south-west 3D opening, not the rear wall');
assert.equal(world.darknessAt(5,'intro','morning_garden'),0);
assert(world.darknessAt(32,'defend','afternoon_meeting')>0);
assert(world.darknessAt(44,'disappearance','afternoon_meeting')>=.28);
assert(world.darknessAt(39,'walk-together','afternoon_meeting')<.20,'the happy garden should not reveal the horror prematurely');
assert(world.darknessAt(41,'ribbon','afternoon_meeting')>=world.darknessAt(41,'disappearance','afternoon_meeting'),'no return to daylight after the abduction');
assert(world.darknessAt(41,'ribbon','afternoon_meeting')<=world.darknessAt(46.8,'ribbon','dusk_search'),'continuous darkening across the forest portal');
assert(world.darknessAt(52,'ribbon','dusk_search')>.38);
assert(world.darknessAt(78,'door','night_neighborhood')>.68);
assert(world.darknessAt(78,'window','night_neighborhood')>
 world.darknessAt(56,'ribbon','dusk_search'),'night must be darker than dusk');
// V3.7 side trails use one world-space contract for art and collision.
assert.equal(world.SIDE_TRAILS.length,6);
for(const trail of world.SIDE_TRAILS){
 const mid=(trail.start+trail.end)/2,center=world.sideTrailPoint(trail,mid);
 assert(Math.abs(center.v-world.routeCenter(mid))>=3.6,'a real lateral destination, not a recolored main road');
 for(let i=0;i<=80;i++){
  const p=world.sideTrailPoint(trail,trail.start+(trail.end-trail.start)*i/80);
  const constrained=world.constrainRescue(p,trail.map);
  assert(Math.hypot(p.u-constrained.u,p.v-constrained.v)<.001,'side trail is connected and walkable '+trail.id);
  assert(!world.rescueLandmarkBlocks(p,trail.map),'landmark must not block the path');
 }
 const landmark=world.sideTrailLandmark(trail);
 const discovery=world.nearbyRescueLandmark(trail.map,center);
 assert.equal(discovery?.id,trail.id,'optional interaction is reachable beside solid scenery');
 assert(discovery.action&&discovery.message);
 assert(world.rescueLandmarkBlocks(landmark,trail.map));
 const corrected=world.constrainRescue(landmark,trail.map,center);
 assert(!world.rescueLandmarkBlocks(corrected,trail.map),'player cannot walk through landmark '+trail.id);
 assert(!world.rescueLandmarkBlocks(world.constrainRescue(landmark,trail.map),trail.map),'reload cannot strand player in furniture');
}
for(const stage of stages){
 const p=world.STORY_POSITIONS[stage],map=world.mapForStage(stage);
 assert(!world.rescueLandmarkBlocks(p,map),'mandatory story target remains accessible '+stage);
}
assert.equal(world.rescueLandmarks('night_neighborhood').length,0,'no new side trail obstructs the house');
assert.equal(world.nearbyRescueLandmark('night_neighborhood',{u:74,v:6}),undefined);
assert(world.RESCUE_SCENERY.morning_garden.length>=8&&world.RESCUE_SCENERY.afternoon_meeting.length>=10);
for(const id of ids.slice(0,3)){
 const cfg=world.RESCUE_SCENES[id];
 assert.equal(world.rescueObstacleList(id),world.rescueObstacleList(id),'no per-frame obstacle allocation');
 for(const prop of world.RESCUE_SCENERY[id])assert(world.rescueLandmarkBlocks(prop.point,id),'solid old furniture');
 for(let u=cfg.spawn.u;u<=cfg.exit.u;u+=.1){
  const p={u,v:world.routeCenter(u)};
  assert(!world.rescueLandmarkBlocks(p,id),'main route must remain clear '+id+' '+u);
 }
}
// Follow a full curved lateral trail using real collision and bounded steps.
for(const trail of world.SIDE_TRAILS.filter(t=>t.map==='afternoon_meeting')){
 let actor=world.sideTrailPoint(trail,trail.start),queue=[];
 for(let i=0;i<=400;i++){
  const player=world.sideTrailPoint(trail,trail.start+(trail.end-trail.start)*i/400);
  const result=world.stepRescueFollower(actor,player,queue,16,trail.map);
  assert(Math.hypot(result.position.u-actor.u,result.position.v-actor.v)<.06);
  assert(!world.rescueLandmarkBlocks(result.position,trail.map));
  actor=result.position;queue=result.trail;
 }
 const end=world.sideTrailPoint(trail,trail.end);
 for(let i=0;i<500;i++){const r=world.stepRescueFollower(actor,end,queue,16,trail.map);actor=r.position;queue=r.trail;}
 assert(Math.hypot(actor.u-end.u,actor.v-end.v)<1.2,'companion catches up without teleporting');
}
assert(src.includes('rail=scene.add.graphics().setDepth(p.y)'),'bridge railing uses local depth');
assert(src.includes('neighbor.style'),'night houses have distinctive shared render records');
const arcade=fs.readFileSync('src/iso-game.ts','utf8'),pro=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
assert(arcade.includes('buildRescueOverworld(this,this.floor')&&arcade.includes('constrainRescue(candidate,this.storyMap,this.p)'),
 'four maps belong to the original IsoAdventure and use its motion');
assert(arcade.includes('camera.startFollow(this.player')&&arcade.includes('Math.min(width/800,height/450)*1.08'),
 'zoom matches the original Corazones camera');
assert(arcade.includes('this.storyWorld?.destroy()')&&arcade.includes('this.story.travel(exit.to,'),
 'map change destroys old scenery and uses the required gated transition');
assert(pro.includes('prologue-curtain')&&pro.includes("setTransition({target,phase:'out'})")&&
 pro.includes("setTransition({target,phase:'in'})"),
 'transitions must fade to black, swap environment and fade back in');
assert(!arcade.includes('storyVeil')&&pro.includes('className="prologue-night"'),
 'old misaligned grey rectangle must stay deleted');
assert(src.includes('drawBridge(scene)')&&src.includes('water.clear()')&&
 src.includes('house(scene,NIGHT_HOUSE.center.u,NIGHT_HOUSE.center.v,true)')&&src.includes('destroy:()=>'),
 'animated river, accurate two-storey home and controlled scene cleanup');
const house=fs.readFileSync('src/lab/house-layout.js','utf8');
assert(house.includes('width:14,depth:12')&&house.includes('HEIGHT=3.15')&&
 src.includes('14×12 metres, 3.15m per floor')&&src.includes('HOUSE_3D_REFERENCE.frontDoorX/HOUSE_3D_REFERENCE.width')&&
 src.includes('the OPEN intro window in')&&src.includes('The other south windows have barricade boards.'),
 'isometric entrance, facade and floor proportions must match the 3D layout');
assert(!src.includes('new Phaser.Game'),'no new Phaser game or secondary renderer');
const house3d=fs.readFileSync('src/lab/house.js','utf8'),css3d=fs.readFileSync('src/lab/house.css','utf8');
assert(house3d.includes('if(opening)releaseMouse()')&&house3d.includes("setAttribute('aria-expanded'")&&
 css3d.includes('.house-emotes[hidden]{display:none!important'),
 '3D mouse emote fix must remain intact');
console.log('PASS: 4 separate themed maps, three gated portals, garden-to-night time progression, 3D house facade, original Corazones and safe 3D inputs.');

// Canopy overlap uses screen depth and restores normal opacity after walking out.
assert.equal(world.canopyOccludes({x:100,y:150},{x:100,y:100}),true);
assert.equal(world.canopyOccludes({x:100,y:150},{x:100,y:170}),false);
assert.equal(world.canopyOccludes({x:100,y:150},{x:180,y:100}),false);
assert.equal(world.canopyOccludes({x:100,y:150},{x:100,y:10}),false);
assert.equal(world.canopyAlpha(1,true,30,true),.28);
assert.equal(world.canopyAlpha(.28,false,30,true),1);
assert(world.canopyAlpha(1,true,30,false)<1);
assert(world.canopyAlpha(.28,false,30,false)>.28);

// Epilogue follows the same collision rules in the four original maps.
const routeJs=ts.transpileModule(fs.readFileSync('src/demo/epilogue-route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const routeContext={exports:{},require(name){if(name==='./rescue-overworld')return world;if(name==='./night-house-layout')return nightExports;throw Error(name);}};
vm.runInNewContext(routeJs,routeContext);
for(const [stage,chapter] of Object.entries(routeContext.exports.EPILOGUE_CHAPTERS)){
 const valid=p=>{const c=world.constrainRescue(p,chapter.map);return Math.hypot(c.u-p.u,c.v-p.v)<1e-6;};
 assert(valid(chapter.spawn),stage+' spawn is walkable');assert(valid(chapter.target),stage+' destination is walkable');
 const start={u:Math.round(chapter.spawn.u*4),v:Math.round(chapter.spawn.v*4)},queue=[start],seen=new Set([start.u+','+start.v]);let reached=false;
 for(let i=0;i<queue.length&&i<18000;i++){
  const p=queue[i];if(Math.hypot(p.u/4-chapter.target.u,p.v/4-chapter.target.v)<.8){reached=true;break;}
  for(const [du,dv] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const u=p.u+du,v=p.v+dv,k=u+','+v;if(seen.has(k)||!valid({u:u/4,v:v/4}))continue;seen.add(k);queue.push({u,v});
  }
 }
 assert(reached,stage+' has a walkable route to the return marker');
}
