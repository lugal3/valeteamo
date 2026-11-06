import Phaser from 'phaser';
import { Layout, Direction, doorPoint } from './geometry';
export function drawGarden(g:Phaser.GameObjects.Graphics,l:Layout,kind:string){
 g.clear();g.fillStyle(0xf6e4d4);g.fillRect(0,0,l.width,l.height);
 g.fillStyle(0xacc096);g.fillRoundedRect(4,4,l.width-8,l.height-8,10);
 g.fillStyle(0x789777);g.fillRoundedRect(l.left-6,l.top-6,l.right-l.left+12,l.bottom-l.top+12,8);
 g.fillStyle(kind==='boss'?0xdce4c6:0xe5ebc9);g.fillRect(l.left,l.top,l.right-l.left,l.bottom-l.top);
 // Broad paths and small stone islands, rather than the old empty grid.
 g.fillStyle(0xf2e7c7,.85);g.fillRect(l.left,l.cy-21,l.right-l.left,42);g.fillRect(l.cx-25,l.top,50,l.bottom-l.top);
 for(let x=l.left+10;x<l.right-10;x+=26)for(let y=l.top+12;y<l.bottom-8;y+=25){
  if(Math.abs(x-l.cx)<30||Math.abs(y-l.cy)<25)continue;
  g.fillStyle((Math.round(x+y)%3)?0xcfdcaa:0xf7edcd,.35);g.fillRect(x,y,3,2);g.fillRect(x+4,y-2,2,3);
 }
 for(let i=0;i<8;i++){const y=l.top+9+(l.bottom-l.top-18)*i/7;g.fillStyle(0xd9d7b9,.65);g.fillRoundedRect(l.cx-14+(i%2)*12,y,12,6,2);}
 // Picket fence, flower beds and stepping stones occupy the wall, not hitboxes.
 for(let x=12;x<l.width-9;x+=13){for(const y of [5,l.height-11]){g.fillStyle(0xfff0d8);g.fillRect(x,y,5,7);g.fillStyle(0xdca2ad);g.fillRect(x,y,5,2);}}
 for(let y=20;y<l.height-17;y+=20)for(const x of [7,l.width-11]){g.fillStyle(0xfff0d8);g.fillRect(x,y,4,10);}
 for(let i=0;i<12;i++){
  const x=l.left+30+(l.right-l.left-60)*(i%6)/5,y=i<6?l.top+10:l.bottom-10;
  if(Math.abs(x-l.cx)<42)continue;
  g.fillStyle(0x91ab7c);g.fillRoundedRect(x-14,y-6,28,12,4);
  for(let j=0;j<3;j++){const px=x-8+j*8,py=y+(j%2)*3-3;
   g.fillStyle([0xe69eb3,0xf8d68a,0xfff9e5][(i+j)%3]);g.fillRect(px-4,py-1,9,3);g.fillRect(px-1,py-4,3,9);g.fillStyle(0xd6a458);g.fillRect(px,py,2,2);
  }
 }
}
export function drawDoor(g:Phaser.GameObjects.Graphics,d:Direction,l:Layout,locked:boolean,treasure=false){
 const p=doorPoint(d,l),vertical=d==='left'||d==='right',w=vertical?22:48,h=vertical?48:22;
 g.fillStyle(treasure?0xc79c66:0xa2788b);g.fillRoundedRect(p.x-w/2,p.y-h/2,w,h,5);
 g.fillStyle(0xffedcc);g.fillRoundedRect(p.x-w/2+4,p.y-h/2+4,w-8,h-8,3);
 g.lineStyle(2,0xcd9d9e);g.strokeRoundedRect(p.x-w/2+2,p.y-h/2+2,w-4,h-4,3);
 if(locked){g.lineStyle(3,0xb97292);if(vertical)for(let y=-12;y<=12;y+=12)g.lineBetween(p.x-6,p.y+y,p.x+6,p.y+y);else for(let x=-12;x<=12;x+=12)g.lineBetween(p.x+x,p.y-6,p.x+x,p.y+6);}
 else {g.fillStyle(treasure?0xd6ab56:0xd49aa9);g.fillRect(p.x-2,p.y-2,4,4);}
}
