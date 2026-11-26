// V2 phase 05 — decorations must be visual-only and share the existing batch.
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const {createHouse,HEIGHT}=await import('../src/lab/world.js');
 const {ENVIRONMENT_DECOR_IDS}=await import('../src/lab/house-ambient-details.js');
 const world=createHouse();
 assert.equal(ENVIRONMENT_DECOR_IDS.length,13,'bounded decorative budget');
 const unique=new Set(ENVIRONMENT_DECOR_IDS);
 assert.equal(unique.size,ENVIRONMENT_DECOR_IDS.length);
 const details=ENVIRONMENT_DECOR_IDS.map(id=>{
  const box=world.boxes.find(part=>part.id===id);
  assert(box,'missing room detail '+id);assert.equal(box.solid,false,'non-blocking '+id);
  assert.equal(box.castShadow,false,'no shadow updates for '+id);
  assert(!world.objects.some(o=>o.id===id),'cannot become a puzzle/interaction '+id);
  return box;
 });
 assert.equal(details.filter(b=>b.dynamic).length,0,'stay within saturated WebGL1 dynamic vertex budget');
 assert.equal(details.filter(b=>b.ambient==='curtain-sway').length,4);
 assert.equal(details.filter(b=>b.ambient==='floating-dust').length,3);
 assert(details.some(b=>b.y>HEIGHT),'details on upper floor');
 assert(details.some(b=>b.y<HEIGHT),'details on ground floor');
 for(const box of details)assert(box.x>=0&&box.x<=14&&box.z>=0&&box.z<=12,'inside home '+box.id);
 const {HOLIDAY_TREE}=await import('../src/lab/holiday-tree.js');
 const {geometry}=await import('../src/lab/renderer.js');
 const {roomAt,blocked,setDrawer}=await import('../src/lab/world.js');
 const tree=world.boxes.filter(b=>b.id.startsWith('holiday-'));
 assert(tree.length>=35&&tree.length<80,'Rich but bounded holiday decoration');
 assert(tree.filter(b=>b.dynamic).every(b=>b.holidayPower||b.id.startsWith('holiday-gift-')),'Only lamps and interactive gift lid may update');
 assert.equal(roomAt(HOLIDAY_TREE.x,HOLIDAY_TREE.z,HEIGHT),'Sala de música');
 assert.equal(tree.filter(b=>b.holidayBulb).length,13,'Twelve lights and switchable star');
 assert(tree.some(b=>b.id==='holiday-star')&&tree.some(b=>b.id==='holiday-gift-0'));
 assert(blocked(world.boxes,HOLIDAY_TREE.x,HEIGHT,HOLIDAY_TREE.z,.20,1.64),'Solid tree core');
 assert(!blocked(world.boxes,11.5,HEIGHT,2.1,.32,1.64),'Keep original music-room route anchor clear');
 const {pickupGeometry}=await import('../src/lab/pickup-models.js');
 const {holidayPowered,beginGift,advanceGift,collectPlush,restoreHoliday,collectedPlushes}=await import('../src/lab/holiday-collectibles.js');
 const {interactionTarget}=await import('../src/lab/interactions.js');
 assert(holidayPowered(world.holiday));
 world.lights.power.on=false;assert(!holidayPowered(world.holiday));
 world.lights.power.on=true;world.holiday.tree.on=false;assert(!holidayPowered(world.holiday));
 world.holiday.tree.on=true;
 const ids=world.holiday.plushes.map(p=>p.id);assert.deepEqual(ids,['plush-gift','plush-stairs','plush-altar']);
 // Search genuine walkable player poses near each new interaction, using
 // exactly the same LOS and aiming evaluator as the live game.
 for(const item of [...world.holiday.plushes,world.objects.find(o=>o.id==='holiday-tree-switch')]){
  const floor=item.y>HEIGHT?HEIGHT:0;let reachable=false;
  for(const eye of [1.48,.85])for(let d=.5;d<=1.9&&!reachable;d+=.2)for(let i=0;i<24&&!reachable;i++){
   const a=i*Math.PI/12,x=item.x+d*Math.sin(a),z=item.z+d*Math.cos(a);
   if(blocked(world.boxes,x,floor,z,.2,eye+.10))continue;
   const y=floor+eye,camera={x,y,z,yaw:Math.atan2(item.x-x,item.z-z),pitch:Math.atan2(item.y-y,d)};
   if(interactionTarget(world,camera)?.id===item.id)reachable=true;
  }
  assert(reachable,'Reachable optional interaction '+item.id);
 }
 const lid=world.holiday.gift.parts[0].box,original=lid.y;
 assert(beginGift(world.holiday));assert(!beginGift(world.holiday));
 assert.equal(advanceGift(world.holiday,.3),null);assert(lid.y>original);
 assert.equal(advanceGift(world.holiday,.5).id,ids[0]);assert(!beginGift(world.holiday));
 for(const item of world.holiday.plushes.slice(1)){assert(collectPlush(world.holiday,item));assert(!collectPlush(world.holiday,item));}
 assert.deepEqual(collectedPlushes(world.holiday),ids);
 const restored=createHouse();restoreHoliday(restored.holiday,{plushes:ids,treeLights:false});
 assert.deepEqual(collectedPlushes(restored.holiday),ids);assert(restored.holiday.gift.opened);assert(!holidayPowered(restored.holiday));
 const fresh=createHouse();restoreHoliday(fresh.holiday,{});assert.equal(collectedPlushes(fresh.holiday).length,0);assert(holidayPowered(fresh.holiday));
 const added=world.boxes.filter(b=>b.id.startsWith('v3-')||b.id.startsWith('tunnel-pipe-')||b.id.startsWith('plush-'));
 assert(added.length>40&&added.every(b=>!b.solid&&!b.castShadow),'Optional details cannot block AI or change routes');
 const dynamicMesh=geometry([...world.boxes.filter(b=>b.dynamic&&!b.hiddenGeometry),...pickupGeometry(world.objects).filter(b=>b.dynamic)]);
 assert(dynamicMesh.vertices.length/16<=65530,'Dynamic WebGL1 budget: '+dynamicMesh.vertices.length/16);
 const staticMesh=geometry(world.boxes.filter(b=>!b.dynamic&&!b.hiddenGeometry));
 const treeMesh=geometry(tree);
 assert(staticMesh.vertices.length/16<=65530,'Existing WebGL1 world batch remains within 16-bit indices: '+staticMesh.vertices.length/16);
 assert(treeMesh.vertices.length/16<2000,'Bounded holiday mesh');
 const cabinet=world.objects.find(o=>o.id==='landing-cabinet'),torch=world.objects.find(o=>o.id==='media-flashlight');
 assert.equal(torch.x,cabinet.origin.x,'Torch follows the relocated cabinet');
 assert(Math.abs(torch.z-cabinet.origin.z)<.31,'Torch rests on top of cabinet');
 assert(!blocked(world.boxes,5.9,HEIGHT,4.1,.32,1.64),'Central corridor remains clear');
 const drawer=world.objects.find(o=>o.id==='drawer'),tool=world.studyVent.tool;
 assert.equal(tool.x,drawer.origin.x,'Screwdriver centered horizontally');
 assert(Math.abs(tool.z-(drawer.origin.z+.245))<.001,'Screwdriver centered along drawer depth');
 drawer.contents=[{object:tool,origin:{x:tool.x,z:tool.z}}];const closedZ=tool.z;
 setDrawer(drawer,true);
 assert(tool.interactable&&!tool.concealed,'Centered screwdriver remains collectible');
 assert(Math.abs(tool.z-closedZ-drawer.slideDistance)<.001,'Screwdriver moves with drawer tray');
 const renderer=fs.readFileSync('src/lab/renderer.js','utf8');
 assert(renderer.includes("box.ambient==='curtain-sway'"));
 assert(renderer.includes("box.ambient==='floating-dust'"));
 assert(renderer.includes('reduced?0:'),'future decorative motion respects reduced motion');
 assert(renderer.includes('this.dynamicBoxes=boxes.filter(b=>b.dynamic)'),'shared existing dynamic batch');
 console.log('PASS house ambience: optional reachable collectibles, supply switch, gift animation, legacy restore, collision-safe decor and 16-bit geometry budgets');
})().catch(e=>{console.error(e);process.exitCode=1});
