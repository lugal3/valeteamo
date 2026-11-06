import Phaser from 'phaser';
import { Layout, remap } from './geometry';
type Petal={x:number,y:number,vx:number,vy:number,life:number,max:number,color:number,size:number};
type Ring={x:number,y:number,life:number,max:number,radius:number,color:number};
export class Effects {
 petals:Petal[]=[];rings:Ring[]=[];beam?:{x:number,y:number,dx:number,dy:number,length:number,life:number};
 clear(){this.petals=[];this.rings=[];this.beam=undefined;}
 burst(x:number,y:number,color=0xe18bab,count=7){
  for(let i=0;i<count;i++){const a=i*Math.PI*2/count+Math.random()*.4,s=20+Math.random()*35;this.petals.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:320,max:320,color:i%3===0?0xfff5cf:color,size:i%2?3:2});}
  if(this.petals.length>180)this.petals.splice(0,this.petals.length-180);
 }
 ring(x:number,y:number,radius:number,color:number){this.rings.push({x,y,radius,color,life:450,max:450});}
 dust(x:number,y:number){for(let i=0;i<2;i++)this.petals.push({x:x+(i?5:-5),y,vx:(i?1:-1)*8,vy:-6,life:230,max:230,color:0xf8efd2,size:2});}
 resize(old:Layout,next:Layout){for(const p of [...this.petals,...this.rings])Object.assign(p,remap(p,old,next));this.beam=undefined;}
 update(dt:number){for(const p of this.petals){p.life-=dt;p.x+=p.vx*dt/1000;p.y+=p.vy*dt/1000;p.vy+=18*dt/1000;}this.petals=this.petals.filter(p=>p.life>0);for(const r of this.rings)r.life-=dt;this.rings=this.rings.filter(r=>r.life>0);if(this.beam){this.beam.life-=dt;if(this.beam.life<=0)this.beam=undefined;}}
 draw(g:Phaser.GameObjects.Graphics){
  if(this.beam){const b=this.beam;g.lineStyle(17,0xf8b7cf,b.life/240);g.lineBetween(b.x,b.y,b.x+b.dx*b.length,b.y+b.dy*b.length);g.lineStyle(6,0xfff0da,b.life/240);g.lineBetween(b.x,b.y,b.x+b.dx*b.length,b.y+b.dy*b.length);}
  for(const r of this.rings){g.lineStyle(2,r.color,r.life/r.max);g.strokeCircle(r.x,r.y,r.radius*(1.1-r.life/r.max*.7));}
  for(const p of this.petals){g.fillStyle(p.color,p.life/p.max);g.fillRect(Math.round(p.x),Math.round(p.y),p.size,p.size);}
 }
}
