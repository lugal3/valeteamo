export type IsoPoint={u:number,v:number};
export const ISO={originX:400,originY:68,tileW:82,tileH:40,size:8};
export function toScreen(p:IsoPoint){return {x:ISO.originX+(p.u-p.v)*ISO.tileW/2,y:ISO.originY+(p.u+p.v)*ISO.tileH/2};}
export function screenVector(dx:number,dy:number):IsoPoint{
 const u=dx/ISO.tileW+dy/ISO.tileH,v=dy/ISO.tileH-dx/ISO.tileW,n=Math.hypot(u,v);
 return n?{u:u/n,v:v/n}:{u:0,v:0};
}
export function constrain(p:IsoPoint,margin=.18):IsoPoint{return {u:Math.min(ISO.size-1+margin,Math.max(-margin,p.u)),v:Math.min(ISO.size-1+margin,Math.max(-margin,p.v))};}
export function isoDistance(a:IsoPoint,b:IsoPoint){return Math.hypot(a.u-b.u,a.v-b.v);}
