const assert=require('node:assert/strict');
const fs=require('node:fs'),ts=require('typescript'),vm=require('node:vm');

const src=fs.readFileSync('src/demo/prologue-art.ts','utf8');
const compiled=ts.transpileModule(src,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
function fakeCanvas(){
 const width=48,height=64,pixels=Array.from({length:height},()=>Array(width).fill(''));
 const ctx={
  fillStyle:'',imageSmoothingEnabled:true,
  fillRect(x,y,w,h){
   for(let yy=Math.max(0,Math.floor(y));yy<Math.min(height,y+h);yy++)
    for(let xx=Math.max(0,Math.floor(x));xx<Math.min(width,x+w);xx++)
     pixels[yy][xx]=this.fillStyle;
  }
 };
 return {
  width:0,height:0,pixels,getContext:()=>ctx,
  toDataURL:()=> 'data:image/png;base64,preview'
 };
}
const context={exports:{},document:{createElement(kind){
 assert.equal(kind,'canvas');return fakeCanvas();
}}};
vm.runInNewContext(compiled,context,{filename:'prologue-art.ts'});
const art=context.exports;
assert.deepEqual(Array.from(art.LUIS_FACINGS),['down','right','up']);
assert.deepEqual(Object.keys(art.LUIS_FRAME_COUNTS),['idle','walk','talk','wave']);
assert.equal(art.LUIS_SPRITE_WIDTH,48);
assert.equal(art.LUIS_SPRITE_HEIGHT,64);
assert.equal(art.luisTextureKey('down','idle',0),'story-person-luis-down-idle-0');
assert.equal(art.luisTextureKey('up','walk',-1),'story-person-luis-up-walk-3');
assert.equal(art.luisAnimationFrame(4220,'idle'),3,'idle blinking should recur');
assert.equal(art.luisAnimationFrame(200,'walk'),1,'walk should advance every few frames');
assert.equal(art.luisAnimationFrame(490,'talk'),2,'talk should visibly animate its mouth');
assert.equal(art.luisAnimationFrame(200,'wave'),1,'farewell wave frames are prebuilt for phase 3');
assert.equal(art.luisAnimationFrame(99999,'walk',true),0,
 'animation must honor accessibility motion preferences');
function signature(p){
 return p.pixels.flat().join(',');
}
for(const pose of Object.keys(art.LUIS_FRAME_COUNTS)){
 const count=art.LUIS_FRAME_COUNTS[pose];
 for(const facing of art.LUIS_FACINGS){
  const frames=Array.from({length:count},(_,i)=>art.paintLuisChibi(facing,pose,i));
  for(const frame of frames){
   assert.equal(frame.width,48);assert.equal(frame.height,64);
   const drawn=frame.pixels.flat().filter(Boolean).length;
   assert(drawn>480&&drawn<2400,'Luis must have an intentional chibi silhouette');
  }
  assert(new Set(frames.map(signature)).size>=Math.min(count,3),
   facing+' '+pose+' must have multiple real hand-drawn frames, not one static duplicated sprite');
 }
}
const front=art.paintLuisChibi('down','idle',0),back=art.paintLuisChibi('up','idle',0),
 side=art.paintLuisChibi('right','idle',0),talk=art.paintLuisChibi('down','talk',1),
 blink=art.paintLuisChibi('down','idle',3),wave=art.paintLuisChibi('down','wave',1);
assert.notEqual(signature(front),signature(back),'back needs a real separate hairstyle and clothes view');
assert.notEqual(signature(front),signature(side),'side profile needs real glasses and haircut variation');
assert.notEqual(signature(talk),signature(blink),'speech mouth and blink are different facial poses');
assert.notEqual(signature(front),signature(wave),'friendly wave must have raised tattooed hand');
const palette=new Set(front.pixels.flat());
for(const color of ['#202126','#fbd4af','#22253a','#659c48','#46465d'])
 assert(palette.has(color),'front art must include hair shine, skin, glasses, top, tattoo: '+color);
// Registration should preserve the existing 48x64 portrait key used by the RPG
// dialog and all of Louis's own sprites; avoid unrelated sprite regressions.
const textures=new Map();
const scene={textures:{
 exists:key=>textures.has(key),remove:key=>textures.delete(key),addCanvas(key,canvas){textures.set(key,canvas);}
}};
const portraits=art.installProloguePeople(scene);
assert.equal(portraits.luis.startsWith('data:image/png'),true);
assert.equal(portraits.louis.startsWith('data:image/png'),true);
assert(textures.has('story-person-luis')&&textures.has('story-person-louis'));
for(const facing of art.LUIS_FACINGS)
 for(const pose of Object.keys(art.LUIS_FRAME_COUNTS))
  for(let frame=0;frame<art.LUIS_FRAME_COUNTS[pose];frame++)
   assert(textures.has(art.luisTextureKey(facing,pose,frame)),
    'each pre-rendered sprite is loaded into the original Phaser texture manager');
assert.equal(textures.size,47,'45 animation frames + 2 existing portraits; no extra engine');
const arcade=fs.readFileSync('src/iso-game.ts','utf8');
assert(arcade.includes('this.animateStoryLuis();')&&
 arcade.includes("if(this.story.locked())pose='talk'")&&
 arcade.includes("npc.setFlipX(facing==='right'&&dx<0)")&&
 arcade.includes('const frame=luisAnimationFrame(clock,pose,this.reducedMotion);'),
 'runtime changes Luis expressions, direction and frames inside original Corazones engine');
assert(arcade.includes('this.story.locked()||luisMotionIsBlocking(this.storyLuisMotion)')&&
 arcade.includes('this.updateLuisCinematic(dt);'),
 'dialogue and arrival/departure both lock input while NPC animations continue');
assert(src.includes('return person===\'luis\'?paintLuisChibi')&&
 arcade.includes("'chibi-louis-down-0'"),
 'Luis/ Louis identities remain distinct and old Louis sprite stays in use');
console.log('PASS: 45 chibi Luis directional pose frames, glasses/tattoo, facial expressions, blinks, animation during dialogue and unchanged Corazones/Louis integration.');
