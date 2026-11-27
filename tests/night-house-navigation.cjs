const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');
function getModule(path){
 const src=fs.readFileSync(path,'utf8');
 const js=ts.transpileModule(src,{compilerOptions:{
  module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022
 }}).outputText;
 const ctx={exports:{}};vm.runInNewContext(js,ctx,{filename:path});return ctx.exports;
}
const house=getModule('src/demo/night-house-layout.ts'),layout=house.NIGHT_HOUSE;
const iso=fs.readFileSync('src/demo/rescue-overworld.ts','utf8'),scene=fs.readFileSync('src/iso-game.ts','utf8'),
 react=fs.readFileSync('src/demo/GardenPrologue.tsx','utf8');
const refs=fs.readFileSync('src/lab/house-layout.js','utf8');
for(const [key,text] of [['width','width:14'],['depth','depth:12'],['floorHeight','HEIGHT=3.15']])
 assert(refs.includes(text),'3D layout uses the expected architectural value for '+key);
assert.equal(house.HOUSE_3D_REFERENCE.frontDoorX,5.9);
assert.equal(house.HOUSE_3D_REFERENCE.openWindowX,2.2);
assert(refs.includes("door('entrada',5.9,0,12"),'door reference is at x=5.9,z=12');
assert(refs.includes("entry-window-sash',2.2,1.6,12"),'window reference is at x=2.2,z=12');
assert(refs.includes("add('front-path',5.9,-.005,16.25"),'paved entrance path from real 3D exists');
assert(refs.includes("add('pavement',8,0,20.5"),'sidewalk from real 3D exists');
assert(refs.includes("add('road',8,-.005,23"),'road from real 3D exists');
assert(house.nightWalkable(layout.door)&&house.nightWalkable(layout.window),
 'both quest targets must be ON traversable floor');
assert(!house.nightHouseBlocks(layout.door)&&!house.nightHouseBlocks(layout.window),
 'quest targets must be outside the facade hitbox');
assert(house.nightHouseBlocks(layout.center), 'house walls are solid and not traversable');
assert.equal(new Set(house.NIGHT_NEIGHBORS.map(h=>h.style)).size,3);
for(const neighbor of house.NIGHT_NEIGHBORS){
 assert(house.nightHouseBlocks(neighbor),'neighbor houses have physical footprints');
 assert(!house.nightWalkable(neighbor));
}
assert(house.nightWalkable(layout.yard)&&house.nightWalkable(layout.gate),
 'house entry path and garden gate must be traversable');
assert(house.nightNavigationDistance(layout.door,layout.window)>1.3,
 'door and window are distinct physically separated interactions');
assert(layout.window.u-layout.window.v>layout.door.u-layout.door.v,'from the street the window is right of the door');
assert(Math.abs(layout.window.u+layout.window.v-layout.door.u-layout.door.v)<1e-8,'shared front baseline');
const depth=p=>p.u+p.v;
assert(depth(layout.road)>depth(layout.sidewalk)&&depth(layout.sidewalk)>depth(layout.gate)&&depth(layout.gate)>depth(layout.door),'street, sidewalk, yard, porch and facade face the same direction');
assert.equal(house.nightStreetSurface(layout.road),'road');
assert.equal(house.nightStreetSurface(layout.sidewalk),'sidewalk');
assert.equal(house.nightStreetSurface(layout.door),'yard');
assert.equal(house.nightStreetSurface(house.NIGHT_VAN),'road');
assert(house.nightWalkable(house.NIGHT_VAN),'van sits on the accessible street');
for(const side of [-3,0,3]){const street=house.frontOfHouse(4,side);assert.equal(house.nightStreetSurface(street),'road');assert(house.nightWalkable(street),'street spans the entire front');}
assert.equal(house.nightStreetSurface(layout.center),'grass','no asphalt behind the facade');
function safeSegment(a,b,label){
 const steps=Math.max(1,Math.ceil(house.nightNavigationDistance(a,b)/.09));
 for(let i=0;i<=steps;i++){
  const t=i/steps,p={u:a.u+(b.u-a.u)*t,v:a.v+(b.v-a.v)*t};
  assert(house.nightWalkable(p),label+' path went through a wall / outside the level at '+JSON.stringify(p));
 }
}
safeSegment(layout.road,layout.door,'straight front approach');
safeSegment(layout.door,layout.window,'porch');
const starts=[
 layout.start,layout.road,layout.sidewalk,layout.gate,layout.yard,house.NIGHT_VAN,
 {u:73.5,v:4.45},{u:74.0,v:9.5},{u:77.3,v:10.8},{u:80.7,v:10.65},
 {u:78.6,v:11.2},layout.door,layout.window
];
for(const [i,start] of starts.entries()){
 assert(house.nightWalkable(start),'starting location '+i+' must be on walkable terrain');
 for(const dest of [layout.door,layout.window]){
  const route=house.nightAutoRoute(start,dest);
  assert(route.length>0,'missing path from '+i+' to '+JSON.stringify(dest));
  assert(route.length<=16,'A* path smoothing should prevent jerky, dozen-turn walks');
  let previous=start;
  for(const [n,p] of route.entries()){
   assert(house.nightWalkable(p),'waypoint '+i+' '+n+' outside accessible map');
   safeSegment(previous,p,'route '+i+' segment '+n);
   previous=p;
  }
  assert(house.nightNavigationDistance(route.at(-1),dest)<.001,'route reaches exact interaction target');
 }
}
assert.equal(house.nightAutoRoute(layout.center,layout.door).length,0,
 'guidance refuses to navigate from inside forbidden house walls');
assert.equal(house.NIGHT_INTERACTION_RADIUS>=1.5,true,
 'mobile NPC actions must have forgiving pickup distance');
for(const needle of [
 "NIGHT_HOUSE.door,window:NIGHT_HOUSE.window",
 "return nightRouteCenter(u)",
 "nightHouseBlocks(next)",
 "nightWalkable(alongU)",
 "nightWalkable(alongV)",
 "setDepth(y-(main?145:100))",
 "frontFacadeOffset(realX)",
 "'PUERTA'","'VENTANA'","'CASA ♡'"
])assert(iso.includes(needle),'night scene does not implement geometry/wayfinding: '+needle);
for(const needle of [
 "startHouseGuide(){",
 "nightAutoRoute(this.p,this.storyTarget)",
 "constrainRescue(candidate,this.storyMap,this.p)",
 "if(manualMove&&this.houseRoute.length)this.houseRoute=[]",
 "NIGHT_INTERACTION_RADIUS",
 "this.burst(this.storyTarget,0xffdfb5)"
])assert(scene.includes(needle),'runtime does not implement intuitive access: '+needle);
assert(react.includes('Guiarme caminando')&&react.includes('Detener guía')&&
 react.includes('prologue-house-nav')&&react.includes("heading:Math.atan2("),
 'real mobile/desktop user must have a visible, directional optional guide');
assert(!iso.includes('new Phaser.Game')&&!scene.includes('new Phaser.Game'),
 'must not fork Corazones arcade or instantiate a second renderer');
console.log('PASS: 3D-faithful entrance and neighborhood, 24 safe A* routes from 12 positions, no wall clipping, responsive guidance and original Corazones engine.');
