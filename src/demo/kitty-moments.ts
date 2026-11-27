import type Phaser from 'phaser';
export const kittySeatKey=(step:number)=>'rescue-kitty-seat-'+step;
export const KITTY_POSTCARD='rescue-kitty-postcard';
// Reuse the original 32×40 front sprite: head unscaled, body lowered,
// with clearly separate forward feet. No new external art or classic keys.
export function installKittyMoments(scene:Phaser.Scene){
 const source=scene.textures.get('chibi-kitty-down-0').getSourceImage() as CanvasImageSource;
 const make=(key:string,paint:(ctx:CanvasRenderingContext2D)=>void)=>{
  if(scene.textures.exists(key))return;
  const texture=scene.textures.createCanvas(key,32,40);if(!texture)return;
  const c=texture.getContext();c.imageSmoothingEnabled=false;paint(c);texture.refresh();
 };
 for(let step=0;step<3;step++)make(kittySeatKey(step),c=>{
  const drop=step+1;
  c.drawImage(source,0,0,32,28,0,drop,32,28);
  c.drawImage(source,0,28,32,12,0,28+drop,32,12-drop);
  if(step===2){
   c.fillStyle='#bd7599';c.fillRect(8,34,7,4);c.fillRect(17,34,7,4);
   c.fillStyle='#fff8e9';c.fillRect(7,35,7,3);c.fillRect(18,35,7,3);
   c.fillStyle='#e9cddd';c.fillRect(8,37,6,1);c.fillRect(18,37,6,1);
  }
 });
 make(KITTY_POSTCARD,c=>{
  c.drawImage(source,0,0,32,40);
  // One raised little paw on the outside of the face, leaving eyes/bow intact.
  c.fillStyle='#ae8d9d';c.fillRect(26,24,5,8);
  c.fillStyle='#fff8e9';c.fillRect(27,24,3,7);c.fillRect(26,23,4,4);
  c.fillStyle='#e8d4d9';c.fillRect(27,30,3,1);
 });
}
