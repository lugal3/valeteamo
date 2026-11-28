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
for(const color of ['#282526','#ffe5bd','#554b43','#8db755','#57504a'])
 assert(palette.has(color),'approved card palette: '+color);
let masterHash=2166136261;
for(const color of front.pixels.flat())for(const ch of color+'|')masterHash=Math.imul(masterHash^ch.charCodeAt(0),16777619)>>>0;
assert.equal(masterHash,3568717657,'approved neutral frontal pixels are immutable');
for(let y=0;y<64;y++)for(let x=0;x<48;x++)if(front.pixels[y][x]==='#554b43')
 assert.equal(blink.pixels[y][x],front.pixels[y][x],'blink preserves glasses frame');
assert.notEqual(signature(art.paintLuisChibi('down','walk',0)),signature(art.paintLuisChibi('down','walk',2)),'second footfall is a distinct pose');
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
assert.equal(textures.size,71,'45 Luis frames, 24 Louis NPC frames and 2 portraits');
for(const facing of art.LUIS_FACINGS){
 const frames=Array.from({length:6},(_,i)=>art.paintStoryLouis(facing,i));
 assert(frames.every(frame=>frame.width===32&&frame.height===40));
 assert(new Set(frames.map(signature)).size>=4,'Louis directional movement needs distinct frames');
 for(let frame=0;frame<8;frame++)assert.equal(signature(textures.get('chibi-louis-'+facing+'-'+frame)),signature(art.paintStoryLouis(facing,frame)));
}
assert.notEqual(signature(art.paintStoryLouis('down')),signature(art.paintStoryLouis('right')));
assert.notEqual(signature(art.paintStoryLouis('down')),signature(art.paintStoryLouis('up')));
assert.equal(signature(textures.get('story-person-louis')),signature(textures.get('chibi-louis-down-0')),'same actual sprite for dialogue');
for(const color of ['#4b302b','#5d91b3','#344965','#a54551'])assert(art.paintStoryLouis().pixels.flat().includes(color),'recognizable Louis palette '+color);
// Vale's new artwork must keep the existing runtime keys and frame counts.
const intro=fs.readFileSync('src/demo/rescue-intro-art.ts','utf8');
const introCode=ts.transpileModule(intro,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const introContext={exports:{}};vm.runInNewContext(introCode,introContext);
const vals=new Map();
introContext.exports.installRescueIntroArt({textures:{
 exists:key=>vals.has(key),createCanvas(key,w,h){const pixels=Array.from({length:h},()=>Array(w).fill(''));
 const ctx={fillStyle:'',fillRect(x,y,ww,hh){for(let yy=Math.max(0,y);yy<Math.min(h,y+hh);yy++)for(let xx=Math.max(0,x);xx<Math.min(w,x+ww);xx++)pixels[yy][xx]=this.fillStyle;}};
 vals.set(key,{w,h,pixels});return {getContext:()=>ctx,refresh(){}};
 }}});
for(const facing of ['down','right','up'])for(const walking of [false,true]){
 const frames=Array.from({length:4},(_,i)=>vals.get(introContext.exports.valeTexture(walking,i,facing)));
 assert(frames.every(frame=>frame.w===43&&frame.h===58));
 assert.equal(new Set(frames.map(signature)).size,4,'Vale has four distinct animated frames');
 const palette=new Set(frames[0].pixels.flat());
 for(const color of ['#202126','#b93d51','#ddd6d0'])assert(palette.has(color),'Vale card hair, red shirt, shoe soles');
}
assert.notEqual(signature(art.paintStoryLouis('down',6)),signature(art.paintStoryLouis('down',7)),'Louis has separate mouth poses');
assert.notEqual(signature(art.paintStoryLouis('down',0)),signature(art.paintStoryLouis('down',6)),'intermediate speaking mouth differs from neutral');
for(const facing of ['down','right','up']){
 const talkFrames=Array.from({length:3},(_,i)=>vals.get(introContext.exports.valeTalkTexture(i,facing)));
 assert.equal(new Set(talkFrames.map(signature)).size,3,'Vale has three distinct speaking poses: '+facing);
}
const opaqueHeight=frame=>{const ys=frame.pixels.map((row,i)=>row.some(Boolean)?i:-1).filter(i=>i>=0);return Math.max(...ys)-Math.min(...ys)+1;};
const valeIdle=vals.get(introContext.exports.valeTexture(false,0));
const ratio=opaqueHeight(valeIdle)*art.VALE_WORLD_SCALE/(opaqueHeight(front)*art.LUIS_WORLD_SCALE);
assert(Math.abs(ratio-.70)<.015,'Visible Vale height should be 70% of Luis: '+ratio);
const arcade=fs.readFileSync('src/iso-game.ts','utf8');
assert(arcade.includes('.setScale(VALE_WORLD_SCALE)')&&arcade.includes("kind==='luis'?LUIS_WORLD_SCALE:VALE_WORLD_SCALE"),'Prologue and epilogue use same scale');
assert(arcade.includes('this.animateStoryLuis();')&&
 arcade.includes("this.story.speaker?.()==='Luis'&&(this.story.speaking?.()??true)")&&
 arcade.includes("npc.setFlipX(facing==='right'&&dx<0)")&&
 arcade.includes('const frame=luisAnimationFrame(clock,pose,this.reducedMotion);'),
 'runtime changes Luis expressions, direction and frames inside original Corazones engine');
assert(arcade.includes('this.story.locked()||luisMotionIsBlocking(this.storyLuisMotion)')&&
 arcade.includes('this.updateLuisCinematic(dt);'),
 'dialogue and arrival/departure both lock input while NPC animations continue');
assert(src.includes('return person===\'luis\'?paintLuisChibi')&&
 arcade.includes("'chibi-louis-down-0'"),
 'Luis and Louis stay distinct and the story uses the established NPC keys');
assert(arcade.includes("if(this.story){\n   if(!CHARACTERS.louis.chibiSpriteSheet)installReferenceCharacter(this,'louis');\n   installProloguePeople(this);"),'new Louis frames only install for story');
console.log('PASS: 45 Luis frames, 24 Louis frames, 11 Vale frames, actual portrait parity and classic protected.');
