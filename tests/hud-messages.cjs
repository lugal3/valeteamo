const assert=require('node:assert/strict');
module.exports=async()=>{
 const {HouseMessages,messageLayout}=await import('../src/lab/hud-messages.js'),{hudRect}=await import('../src/lab/hud-layout.js');
 const nodes=Object.fromEntries(['#house-messages','#lab-objective','#lab-toast','.house-danger','.phone-notice'].map(id=>[id,{textContent:'',hidden:false,style:{}}])),root={clientWidth:844,clientHeight:390,dataset:{},querySelector:id=>nodes[id]},oldDocument=global.document,oldStyle=global.getComputedStyle;
 global.document={activeElement:null};global.getComputedStyle=()=>({getPropertyValue:()=> '0px'});
 try{
  const hud=new HouseMessages(root),update=state=>hud.update({dt:.1,...state}),visible=()=>['#lab-toast','.house-danger','.phone-notice'].filter(id=>!nodes[id].hidden);
  hud.say('Llave obtenida');update();assert.deepEqual(visible(),['#lab-toast']);assert(!nodes['#lab-objective'].hidden);
  update({unread:true,messageCount:1});assert.deepEqual(visible(),['.phone-notice'],'A notification replaces the transient message');
  update({danger:'Escóndete · 10 s',unread:true,messageCount:1});assert.deepEqual(visible(),['.house-danger']);assert(nodes['#lab-objective'].hidden,'The danger instruction takes over the objective');
  const remaining=hud.noticeRemaining;update({blocked:true,unread:true,messageCount:1});assert(nodes['#house-messages'].hidden);assert.equal(hud.noticeRemaining,remaining,'Menus do not consume notification reading time');
  for(let i=0;i<90;i++)update({danger:'Está buscando',unread:true,messageCount:1});assert.equal(hud.pending,null,'Stale feedback does not reappear after the danger');
  for(let i=0;i<60;i++)update({unread:true,messageCount:1});assert(nodes['.phone-notice'].hidden,'The banner retires even while the message is unread');update({unread:true,messageCount:1});assert(nodes['.phone-notice'].hidden,'An unchanged unread badge does not retrigger the banner');
  update({unread:true,messageCount:2});assert(!nodes['.phone-notice'].hidden);update({unread:false,messageCount:2});assert(nodes['.phone-notice'].hidden);
  hud.say('No cabe la puerta',1);update({phoneOpen:true});assert.equal(visible().length,0);assert(nodes['#lab-objective'].hidden);update({phoneOpen:true,danger:'Escóndete'});assert.deepEqual(visible(),['.house-danger']);
  hud.reset();update({unread:true,messageCount:1});assert(!nodes['.phone-notice'].hidden,'A new session can notify again');
 }finally{if(oldDocument===undefined)delete global.document;else global.document=oldDocument;if(oldStyle===undefined)delete global.getComputedStyle;else global.getComputedStyle=oldStyle;}
 const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 for(const [width,height]of [[568,320],[844,390],[1280,720]])for(const anchor of ['left','right','top','bottom'])for(const size of [40,64])for(const x of [-180,0,180])for(const y of [-120,0,120]){
  const dock=hudRect({anchor,size,x,y},width,height),r=messageLayout(width,height,dock);assert(r.x>=0&&r.y>=0&&r.x+r.w<=width&&r.y+r.h<=height);assert(!intersects(r,dock),'The message area clears custom dock placements');
  const p=messageLayout(width,height,dock,{phoneOpen:true}),phoneWidth=Math.min(760,height-28)*9/18.5;assert(p.x+p.w<(width-phoneWidth)/2,'Danger stays outside the physical phone');
 }
 console.log('PASS HUD messages: exclusive priority, paused reading time, finite notice, unread persistence, stale feedback, reset and safe custom-dock/phone layouts');
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1;});
