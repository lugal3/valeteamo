const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
const src=fs.readFileSync('src/demo/rescue-overworld.ts','utf8');
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const context={exports:{},require(name){
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
assert(world.exitReady('morning_garden','intro'));
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
const stages=['intro','defend','talk-louis','talk-luis','walk-together','disappearance',
 'ribbon','petals','wheel','door','window'];
for(let i=1;i<stages.length;i++){
 if(stages[i]==='window')continue;
 assert(world.STORY_POSITIONS[stages[i]].u>world.STORY_POSITIONS[stages[i-1]].u,
  'separate scenes retain forward narrative progression');
}
assert(world.STORY_POSITIONS.window.u<world.STORY_POSITIONS.door.u,
 'Kitty must turn BACK along the facade for the separate side window, not keep following a line');
const toPixel=p=>({x:400+(p.u-p.v)*41,y:68+(p.u+p.v)*20});
const footprint=toPixel({u:78.7,v:9.0});
const frontDoor={x:footprint.x-225*.58+225*5.9/14,y:footprint.y-5};
const portalDoor=toPixel(world.STORY_POSITIONS.door);
assert(Math.hypot(portalDoor.x-frontDoor.x,portalDoor.y-frontDoor.y)<35,
 'locked door target is physically at the correct 3D facade entrance');
const westWindow={x:footprint.x-225*.44,y:footprint.y-161*.27+105*.16};
const portalWindow=toPixel(world.STORY_POSITIONS.window);
assert(Math.hypot(portalWindow.x-westWindow.x,portalWindow.y-westWindow.y)<32,
 'window target is physically located at the actual south-west 3D intro window');
assert.equal(world.darknessAt(5,'intro','morning_garden'),0);
assert(world.darknessAt(32,'defend','afternoon_meeting')>0);
assert(world.darknessAt(44,'disappearance','afternoon_meeting')>=.28);
assert(world.darknessAt(52,'ribbon','dusk_search')>.38);
assert(world.darknessAt(78,'door','night_neighborhood')>.68);
assert(world.darknessAt(78,'window','night_neighborhood')>
 world.darknessAt(56,'ribbon','dusk_search'),'night must be darker than dusk');
const arcade=fs.readFileSync('src/iso-game.ts','utf8'),pro=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
assert(arcade.includes('buildRescueOverworld(this,this.floor')&&arcade.includes('constrainRescue(candidate,this.storyMap)'),
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
