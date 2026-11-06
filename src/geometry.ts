import { CONFIG as C } from './config';
export type Direction = 'left'|'right'|'up'|'down';
export type Point = {x:number,y:number};
export type Layout = {width:number,height:number,left:number,right:number,top:number,bottom:number,cx:number,cy:number,zoom:number};
export const clamp = (v:number,a:number,b:number) => Math.max(a,Math.min(b,v));
export const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);
// Preserve playable AREA, adapt its aspect ratio, then fit the entire room uniformly.
// No CSS cover, stretched sprites, offscreen doors or following camera.
export function roomLayout(pixelWidth:number,pixelHeight:number):Layout {
 const aspect=Math.max(1,pixelWidth)/Math.max(1,pixelHeight),m=C.wallMargin;
 const height=(m*(aspect+1)+Math.sqrt(m*m*(aspect-1)**2+aspect*C.roomArea))/aspect;
 const width=height*aspect;
 return {width,height,left:m,right:width-m,top:m,bottom:height-m,cx:width/2,cy:height/2,zoom:pixelWidth/width};
}
export function confine(p:Point,l:Layout,r=0):Point {
 return {x:clamp(p.x,l.left+r,l.right-r),y:clamp(p.y,l.top+r,l.bottom-r)};
}
export function remap(p:Point,old:Layout,next:Layout):Point {
 return {x:next.left+(p.x-old.left)/(old.right-old.left)*(next.right-next.left),y:next.top+(p.y-old.top)/(old.bottom-old.top)*(next.bottom-next.top)};
}
export function doorPoint(d:Direction,l:Layout,inset=0):Point {
 return {x:d==='left'?l.left+inset:d==='right'?l.right-inset:l.cx,y:d==='up'?l.top+inset:d==='down'?l.bottom-inset:l.cy};
}
export function rayLength(p:Point,dx:number,dy:number,l:Layout) {
 const tx=dx>0?(l.right-p.x)/dx:dx<0?(l.left-p.x)/dx:Infinity;
 const ty=dy>0?(l.bottom-p.y)/dy:dy<0?(l.top-p.y)/dy:Infinity;
 return Math.max(0,Math.min(tx,ty));
}
