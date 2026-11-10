const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
module.exports=async()=>{
 const {createHouse,blocked,setDoor}=await import('../src/lab/world.js'),{Pursuer}=await import('../src/lab/pursuer.js'),{animateFurniture,updateFurniture}=await import('../src/lab/furniture-motion.js'),{HouseEvents}=await import('../src/lab/story-events.js');
 const world=createHouse(),p=new Pursuer(world);setDoor(world.objects.find(o=>o.id==='entrada'),true);p.start();let highest=0;const hidden={x:2.2,y:3.15,z:3.8,hidden:true};
 for(let i=0;i<700;i++){updateFurniture(world.objects,.05,hidden);p.update(.05,hidden,d=>{if(!d.motion)animateFurniture(d,true,{player:hidden});});highest=Math.max(highest,p.y);assert(!blocked(world.boxes,p.x,p.y,p.z,.15,1.7),'NPC cannot cross walls');if(p.visited>=3)break;}
 assert(highest>3,'NPC actually climbs stairs');assert(p.visited>=3,'Search reaches the bedroom');assert(!p.caught,'Unseen hiding is safe');
 p.reset();p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2});const visible={x:5.4,y:3.15,z:2.8,hidden:false};assert(p.canSee(visible));assert(p.update(.05,visible).includes('caught'));
 p.reset();p.mode='search';Object.assign(p,{x:6,y:3.15,z:2.8,yaw:-Math.PI/2});assert(!p.canSee({...visible,x:3,z:4.3}),'Walls occlude perception');
 p.update(.1,{...visible,x:4.8,entering:true,hideId:'wardrobe'});assert.equal(p.witnessed,'wardrobe');assert(p.update(.1,{...visible,hidden:true,hideId:'wardrobe'}).includes('caught'),'Observed hiding is not invisibility');
 p.reset();assert.equal(p.witnessed,null);assert.equal(p.caught,false);
 const s=new HouseEvents({pursuit:true});s.observe({key:true,symbol:true});s.read();s.advance(1,false);s.observe({key:true,symbol:true,door:true});s.advance(4,false);assert.equal(s.phase,'hide');s.advance(10,true);assert.equal(s.phase,'hunt');s.advance(30,true,{clear:true,visited:0});assert.equal(s.phase,'hunt','No completion before NPC visits upstairs');s.advance(.1,true,{clear:true,visited:2});assert.equal(s.phase,'evaded');assert(s.complete());assert.equal(s.phase,'safe');assert.equal(s.messages.length,3);
 s.retry();s.advance(4,false);s.advance(10,false);s.advance(.1,false,{caught:true});assert.equal(s.phase,'failed');assert(!s.complete());
 const manifest=JSON.parse(fs.readFileSync('src/lab/audio/manifest.json'));assert.equal(manifest.length,16);let total=0;
 for(const clip of manifest){const bytes=fs.readFileSync('src/lab/audio/'+clip.id+'.wav');assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256);assert(clip.peak<=.8);assert(clip.end>clip.start);total+=bytes.length;}
 assert(total<3000000);const open=manifest.find(c=>c.id==='door-open'),close=manifest.find(c=>c.id==='door-close');assert.equal(open.source,close.source);assert(open.end<close.start,'Opening and closing are distinct actions, not the same sound');
 console.log('PASS pursuit: physical stair/door navigation, LOS, witnessed/unseen hiding, retry/completion, 16 bounded separate audio cuts and hashes');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
