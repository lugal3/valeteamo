const assert=require('node:assert/strict');

module.exports=async()=>{
 const {captureLoss,checkpointLives,lifeSlots}=await import('../src/lab/capture-lives.js');
 const {openRescueHouseSave,RESCUE_SAVE_KEY}=await import('../src/demo/progression.js');
 const rescue={version:2,heart:true,abducted:true,trail:true,house:true,rescued:false};
 const data=new Map([[RESCUE_SAVE_KEY,JSON.stringify(rescue)]]);
 const previous=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
  getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)
 }});
 try{
  let save=openRescueHouseSave();
  // Legacy checkpoint from before lives existed.
  save.save({version:2,stage:'encounter',picked:['key'],hide:'wardrobe'});
  for(const expected of [2,1,0]){
   save=openRescueHouseSave();
   const before=save.checkpoint;
   const loss=captureLoss(checkpointLives(before.lives),before,'wardrobe');
   assert.equal(loss.lives,expected);
   save.save(loss.checkpoint);
   const reloaded=openRescueHouseSave().checkpoint;
   if(expected){
    assert.equal(reloaded.lives,expected);
    assert.equal(reloaded.stage,'encounter');assert.deepEqual(reloaded.picked,['key']);
    assert.equal(reloaded.hide,undefined);
   }else assert.equal(reloaded,undefined);
   const slots=lifeSlots(expected);
   assert.equal(slots.match(/kitty-life /g).length,3);
   assert.equal((slots.match(/kitty-life full/g)||[]).length,expected);
   assert.equal(slots.match(/kitty-life lost/g).length,1);
  }
  assert.deepEqual(JSON.parse(data.get(RESCUE_SAVE_KEY)),rescue);
  assert.equal(checkpointLives(openRescueHouseSave().checkpoint?.lives),3);
 }finally{
  if(previous)Object.defineProperty(globalThis,'localStorage',previous);
  else delete globalThis.localStorage;
 }
 console.log('PASS three capture losses, checkpoint reload, Kitty slots and fresh house run');
};
if(require.main===module)module.exports().catch(error=>{console.error(error);process.exitCode=1;});
