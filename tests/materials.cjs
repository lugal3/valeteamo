// Unit test suite for Phase 3 materials, dual-resolution atlas, per-room palettes and decals.
const assert=require('node:assert/strict');

(async()=>{
 const {
  materialPixels,materialStyle,surfaceFrame,
  ATLAS_SIZE,TILE_SIZE,GUTTER,INNER,
  ATLAS_SIZE_MED,TILE_SIZE_MED,GUTTER_MED,INNER_MED,
  MATERIAL_NAMES
 }=await import('../src/lab/materials.js');

 // 1. Constants and dual-resolution geometry
 assert.equal(ATLAS_SIZE,256,'Low-quality atlas width is 256');
 assert.equal(TILE_SIZE,64,'Low-quality tile size is 64');
 assert.equal(GUTTER,2,'Low-quality gutter is 2');
 assert.equal(INNER,60,'Low-quality inner size is 60');

 assert.equal(ATLAS_SIZE_MED,512,'Medium-quality atlas width is 512');
 assert.equal(TILE_SIZE_MED,128,'Medium-quality tile size is 128');
 assert.equal(GUTTER_MED,4,'Medium-quality gutter is 4');
 assert.equal(INNER_MED,120,'Medium-quality inner size is 120');

 // Mathematical continuity check between low and med UV ratios
 assert.equal(TILE_SIZE/ATLAS_SIZE,TILE_SIZE_MED/ATLAS_SIZE_MED,'Tile-to-atlas ratio matches exactly');
 assert.equal(GUTTER/ATLAS_SIZE,GUTTER_MED/ATLAS_SIZE_MED,'Gutter-to-atlas ratio matches exactly');
 assert.equal(INNER/ATLAS_SIZE,INNER_MED/ATLAS_SIZE_MED,'Inner-to-atlas ratio matches exactly');

 // 2. Separate caches and buffer dimensions
 const low=materialPixels('low');
 assert.equal(low.color.length,256*256*4,'Low atlas color size');
 assert.equal(low.normal.length,256*256*4,'Low atlas normal size');
 assert.equal(materialPixels('low'),low,'Low atlas returns cached object');
 assert.equal(materialPixels(),low,'Default call returns low atlas for backward compat');

 const med=materialPixels('medium');
 assert.equal(med.color.length,512*512*4,'Medium atlas color size');
 assert.equal(med.normal.length,512*512*4,'Medium atlas normal size');
 assert.equal(materialPixels('medium'),med,'Medium atlas returns cached object');
 assert.notEqual(low,med,'Low and medium caches are separate');

 // 3. Style names count
 assert.equal(MATERIAL_NAMES.length,16,'Exactly 16 material styles in 4x4 atlas');

 // 4. Per-room style mappings
 assert.equal(materialStyle({mat:'wall_salon'}),0,'Salon wallpaper uses style 0');
 assert.equal(materialStyle({mat:'wall_bedroom'}),0,'Bedroom wallpaper uses style 0');
 assert.equal(materialStyle({mat:'wall_kitchen'}),4,'Kitchen wall uses tile style 4');
 assert.equal(materialStyle({mat:'wall_bath'}),4,'Bathroom wall uses tile style 4');
 assert.equal(materialStyle({mat:'wall_study'}),1,'Study wall uses plaster style 1');
 assert.equal(materialStyle({mat:'wall_stairs'}),1,'Stairs wall uses plaster style 1');
 assert.equal(materialStyle({mat:'stain'}),15,'Stain decals use style 15');
 assert.equal(materialStyle({mat:'cobweb'}),12,'Cobweb decals use style 12');

 // Backward compatibility mappings
 assert.equal(materialStyle({mat:'grass'}),8);
 assert.equal(materialStyle({mat:'wood'}),2);
 assert.equal(materialStyle({mat:'floor'}),3);
 assert.equal(materialStyle({mat:'tile'}),4);

 // 5. Per-room MATERIAL colors in world.js
 const {MATERIAL,createHouse,blocked}=await import('../src/lab/world.js');
 assert(Array.isArray(MATERIAL.wall_salon)&&MATERIAL.wall_salon.length===3);
 assert(Array.isArray(MATERIAL.wall_kitchen)&&MATERIAL.wall_kitchen.length===3);
 assert(Array.isArray(MATERIAL.wall_bath)&&MATERIAL.wall_bath.length===3);
 assert(Array.isArray(MATERIAL.wall_bedroom)&&MATERIAL.wall_bedroom.length===3);
 assert(Array.isArray(MATERIAL.wall_study)&&MATERIAL.wall_study.length===3);
 assert(Array.isArray(MATERIAL.stain)&&MATERIAL.stain.length===3);
 assert(Array.isArray(MATERIAL.cobweb)&&MATERIAL.cobweb.length===3);

 // 6. House decals verification
 const house=createHouse('ground');
 const decals=house.boxes.filter(b=>b.id.startsWith('decal-'));
 assert(decals.length>=10,'At least 10 thin decal geometry boxes created');
 assert(decals.every(b=>!b.solid),'All decals are solid:false (no collision)');
 assert(!blocked(house.boxes,5.95,0,10.65),'Player spawn is not blocked by decals');

 // 7. Upgraded artwork with legibility check
 const {ART_COUNT,ART_TITLES}=await import('../src/lab/artwork.js');
 assert.equal(ART_COUNT,12,'10 posters plus the altar portrait and register');
 assert.equal(ART_TITLES.length,ART_COUNT,'Every artwork has a title');
 assert.equal(ART_TITLES[house.boxes.find(b=>b.id==='louis-altar-portrait').art],'LOUIS TOMLINSON');

 console.log('PASS materials.cjs: dual-resolution atlas, per-room palettes, decals, and artwork upgraded.');
})().catch(e=>{
 console.error(e);
 process.exitCode=1;
});

