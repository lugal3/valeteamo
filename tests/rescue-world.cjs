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
assert.equal(world.rescueArea(3),'sendero');
assert.equal(world.rescueArea(15),'puente');
assert.equal(world.rescueArea(28),'jardin');
assert.equal(world.rescueArea(45),'bosque');
assert.equal(world.rescueArea(58),'vecindario');
assert.equal(world.rescueArea(73),'casa');
assert(world.routeLimits(15).max-world.routeLimits(15).min<world.routeLimits(29).max-world.routeLimits(29).min,
 'narrow bridge expands into a broad garden, rather than another visible square');
for(const u of [0,4,12,15,19,20,29,39,48,59,71,79]){
 const candidate=world.constrainRescue({u,v:100});
 const limit=world.routeLimits(candidate.u);
 assert(candidate.v<=limit.max&&candidate.v>=limit.min,'playable path stays on land at u='+u);
}
const stages=['intro','defend','talk-louis','talk-luis','walk-together','disappearance','ribbon','petals','wheel','door','window'];
for(let i=1;i<stages.length;i++){
 assert(world.STORY_POSITIONS[stages[i]].u>world.STORY_POSITIONS[stages[i-1]].u,
  'each story event must be spatially further along the real interconnected route');
}
assert(world.darknessAt(4,'intro')===0,'solo beginning must be sunny');
assert(world.darknessAt(43,'walk-together')>0,'the forest approaches dusk');
assert(world.darknessAt(44,'disappearance')>=.45,'the kidnapping darkens the whole world');
assert(world.darknessAt(77,'window')>.65,'the neighborhood is dark by the final entry');
const arcade=fs.readFileSync('src/iso-game.ts','utf8'),pro=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
assert(arcade.includes('buildRescueOverworld(this,this.floor')&&arcade.includes('constrainRescue(candidate)'),
 'expanded world must be mounted on the original arcade Phaser scene and movement');
assert(arcade.includes('camera.startFollow(this.player')&&arcade.includes('Math.min(width/800,height/450)*1.08'),
 'camera follows Kitty with the original Corazones zoom formula');
assert(!arcade.includes('storyVeil')&&pro.includes('className="prologue-night"'),
 'no screen-space Phaser overlay that shrinks or scrolls into a grey square');
assert(src.includes('drawBridge(scene)')&&src.includes('wave.clear()')&&src.includes('drawHouse(scene,75.5,9.1,true)'),
 'animated river bridge and main large two-storey house should all render inside scene');
assert(!src.includes('new Phaser.Game'),'must not create another mini-game');
const house=fs.readFileSync('src/lab/house.js','utf8'),css=fs.readFileSync('src/lab/house.css','utf8');
assert(house.includes("if(opening)releaseMouse()")&&house.includes("setAttribute('aria-expanded'")&&
 css.includes('.house-emotes[hidden]{display:none!important'),
 '3D desktop emotes must unlock the cursor and not block clicks while hidden');
console.log('PASS: six continuous Corazones biomes, bridge water, camera, increasing stages, sunset, home and desktop emote click regression.');
