import type Phaser from 'phaser';
import type {CharacterId} from './characters';

// Reframe the supplied-reference sprite sheet at runtime; retain the original PNG untouched.
// Cells are arranged front, side, back, blink / two steps, attack, hurt.
export function installReferenceCharacter(scene:Phaser.Scene,id:CharacterId){
 const key=`${id}-reference-source`,walkKey=`${id}-walk-source`;if(!scene.textures.exists(key)){if(scene.textures.exists(walkKey))scene.textures.remove(walkKey);return false;}
 const source=scene.textures.get(key).getSourceImage() as HTMLImageElement;
 if(source.width!==1774||source.height!==887){console.warn(`Unexpected ${id} reference sheet size; using the procedural sprite.`);scene.textures.remove(key);if(scene.textures.exists(walkKey))scene.textures.remove(walkKey);return false;}
 const walk=scene.textures.exists(walkKey)?scene.textures.get(walkKey).getSourceImage() as HTMLImageElement:undefined;
 const walkValid=!!walk&&walk.width===1774&&walk.height===887;
 function texture(name:string,cell:number,image:HTMLImageElement=source){
  const col=cell%4,row=Math.floor(cell/4),x=Math.floor(col*image.width/4),y=Math.floor(row*image.height/2);
  const w=Math.floor((col+1)*image.width/4)-x,h=Math.floor((row+1)*image.height/2)-y;
  const cv=document.createElement('canvas');cv.width=32;cv.height=40;const context=cv.getContext('2d')!;context.imageSmoothingEnabled=false;
  const left=id==='kitty'?.113:.08,top=id==='kitty'?.1:.06,width=id==='kitty'?.77:.84,height=id==='kitty'?.83:.87;
  context.drawImage(image,x+w*left,y+h*top,w*width,h*height,0,0,32,40);
  if(scene.textures.exists(name))scene.textures.remove(name);scene.textures.addCanvas(name,cv);
 }
 for(const direction of ['down','up','right'])for(let frame=0;frame<6;frame++)for(const shooting of [false,true]){
  const cell=direction==='up'?2:direction==='right'?1:shooting?6:frame===5?3:frame===0?0:frame%2?4:5;
  const sideOrBack=direction!=='down'&&frame>0&&frame<5&&walkValid;
  texture(`chibi-${id}-${direction}-${frame}${shooting?'-shoot':''}`,sideOrBack?(direction==='up'?4:0)+frame-1:cell,sideOrBack?walk:source);
 }
 texture(`chibi-${id}-hurt`,7);texture(`chibi-${id}-dead`,7);
 // The small 32×40 frames now own their pixels; release large Phaser textures.
 scene.textures.remove(key);if(walk)scene.textures.remove(walkKey);return true;
}
