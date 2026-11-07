import type Phaser from 'phaser';

// Reframe the supplied-reference sprite sheet at runtime; retain the original PNG untouched.
// Cells are arranged front, side, back, blink / two steps, attack, hurt.
export function installReferenceKitty(scene:Phaser.Scene){
 const key='kitty-reference-source';if(!scene.textures.exists(key))return false;
 const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
 if(source.width!==1774||source.height!==887){console.warn('Unexpected Kitty reference sheet size; using the procedural sprite.');return false;}
 function texture(name:string,cell:number){
  const col=cell%4,row=Math.floor(cell/4),x=Math.floor(col*source.width/4),y=Math.floor(row*source.height/2);
  const w=Math.floor((col+1)*source.width/4)-x,h=Math.floor((row+1)*source.height/2)-y;
  const cv=document.createElement('canvas');cv.width=32;cv.height=40;const context=cv.getContext('2d')!;context.imageSmoothingEnabled=false;
  context.drawImage(source,x+w*.113,y+h*.1,w*.77,h*.83,0,0,32,40);
  if(scene.textures.exists(name))scene.textures.remove(name);scene.textures.addCanvas(name,cv);
 }
 for(const direction of ['down','up','right'])for(let frame=0;frame<6;frame++)for(const shooting of [false,true]){
  const cell=direction==='up'?2:direction==='right'?1:shooting?6:frame===5?3:frame===0?0:frame%2?4:5;
  texture(`chibi-kitty-${direction}-${frame}${shooting?'-shoot':''}`,cell);
 }
 texture('chibi-kitty-hurt',7);texture('chibi-kitty-dead',7);return true;
}
