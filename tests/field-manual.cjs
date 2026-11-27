const assert=require('node:assert/strict');
(async()=>{
 const {createHouse,blocked,HEIGHT,groundHeight}=await import('../src/lab/world.js');
 const {HouseEvents}=await import('../src/lab/story-events.js');
 const {arrivalPose,safeBedroomHide,poseArrivingPursuer,finishArrivingPursuer}=await import('../src/lab/field-arrival.js');
 const {TUTORIALS,tutorialCardHTML,sanitizeTutorials,manualListHTML}=await import('../src/lab/field-manual.js');
 const {Pursuer}=await import('../src/lab/pursuer.js');
 const world=createHouse();
 // Validate the whole scripted walk using the actual house, collisions and stair height.
 let prev=null;
 for(let i=0;i<=1000;i++){
  const p=arrivalPose(10-i/100);
  assert(Number.isFinite(p.y),'Finite walk pose');
  assert(!blocked(world.boxes,p.x,p.y,p.z,.155,1.72),'Opening path collision at '+i+' '+JSON.stringify(p));
  if(prev)assert(Math.hypot(p.x-prev.x,p.y-prev.y,p.z-prev.z)<.04,'No teleport or stair jump');
  prev=p;
 }
 assert.equal(arrivalPose(10).y,0);
 assert.equal(arrivalPose(0).y,HEIGHT);
 assert(arrivalPose(8).y<HEIGHT);assert(arrivalPose(0).x<5.1,'Arrive at the actual bedroom threshold by zero');
 const actor=new Pursuer(world);poseArrivingPursuer(actor,5);assert(actor.active);
 finishArrivingPursuer(actor);assert.equal(actor.y,HEIGHT);assert.equal(actor.mode,'search');assert.equal(actor.route,2);
 for(const [hidden,transition,expected] of [[null,null,'failed'],[{objectId:'wardrobe'},null,'patrol'],[{objectId:'underbed'},null,'patrol'],[{objectId:'hide-shower'},null,'failed'],[{objectId:'wardrobe'},{entering:true},'failed']]){
  const events=new HouseEvents({pursuit:true,twoActs:true});events.phase='hide';events.remaining=10;
  const safe=safeBedroomHide(hidden,transition);
  assert.deepEqual(events.advance(9.99,safe),[]);
  assert.deepEqual(events.advance(.011,safe),[expected]);
  assert.equal(events.phase,expected);
  assert.equal(events.remaining,0);
 }
 const wake=new HouseEvents({pursuit:true,twoActs:true});wake.phase='sleep';wake.time=1;
 assert.deepEqual(wake.advance(.1,false,{leftBedroom:true}),['wake-message']);
 assert.deepEqual(wake.advance(.99,false),[],'Phone notification precedes the wake-up cutaway');
 assert.deepEqual(wake.advance(.011,false),['wake']);
 assert.deepEqual(wake.advance(.5,false),[],'Wake cue fires only once');
 assert.equal(TUTORIALS.length,10);
 assert.equal(new Set(TUTORIALS.map(t=>t.id)).size,10);
 for(const t of TUTORIALS){for(const touch of [false,true]){const html=tutorialCardHTML(t.id,touch);assert(html.includes('data-field-close')&&html.includes('JUEGO PAUSADO')&&html.includes('viewBox='));}}
 assert.notEqual(tutorialCardHTML('movement',true),tutorialCardHTML('movement',false));
 assert.deepEqual(sanitizeTutorials(['hide','movement','hide','unknown']),['movement','hide']);
 assert(!manualListHTML(['movement']).includes('data-manual="hide"'));
 assert(manualListHTML(['movement']).includes('data-manual="movement"'));
 for(const id of ['stealth','lives','throw','collectibles']){assert(TUTORIALS.some(t=>t.id===id));assert(!tutorialCardHTML(id).includes('undefined'));assert(manualListHTML([id]).includes('data-manual="'+id+'"'));}
 console.log('PASS field manual: ten adaptive illustrated cards, discovered-only history, strict deadline and collision-safe stairs');
})().catch(e=>{console.error(e);process.exitCode=1});
