import type {IsoPoint} from '../isometric';

// Single grounded spatial contract for the isometric FINAL scene.
// 3D canonical source: src/lab/house-layout.js:
// HOUSE.width=14, depth=12, HEIGHT=3.15;
// front door x=5.9,z=12 and open entrance window x=2.2,z=12;
// front-path x=5.9,z=16.25; pavement z=20.5; street z=23.
// The isometric ground coordinates are an artistic projection of these objects,
// NOT metric 3D-to-2D collision conversion.
export const HOUSE_3D_REFERENCE={
 width:14,depth:12,floorHeight:3.15,
 frontDoorX:5.9,openWindowX:2.2,frontWallZ:12,
 frontPathX:5.9,frontPathZ:16.25,pavementZ:20.5,roadZ:23
} as const;
// A viewer standing on z>12 and facing the front has yaw PI: increasing
// world X appears LEFT, not right. Project the same street-facing elevation.
export const FRONT_FACADE_WIDTH=340;
export const frontFacadeOffset=(x:number)=>(HOUSE_3D_REFERENCE.frontDoorX-x)*FRONT_FACADE_WIDTH/HOUSE_3D_REFERENCE.width;
const DOOR={u:77.6,v:7.9};
const windowShift=frontFacadeOffset(HOUSE_3D_REFERENCE.openWindowX)/82;
const frontSum=DOOR.u+DOOR.v,frontLeft=DOOR.u-DOOR.v+frontFacadeOffset(HOUSE_3D_REFERENCE.width)/41;
// The road, sidewalk and front path must be on the SAME outward normal.
// Iso screen Y increases with u+v: larger sums are in front of the facade.
// Street runs across the whole facade, then bends to the forest portal on
// the left. These are real walkable centerlines, shared with the ground art.
export const frontOfHouse=(depth:number,side=0):IsoPoint=>({u:DOOR.u+depth/2+side/2,v:DOOR.v+depth/2-side/2});
export const NIGHT_STREET:readonly IsoPoint[]=[
 {u:65.7,v:4.45},{u:71.5,v:8.4},{u:74.2,v:10.7},{u:76.9,v:12.6},{u:81.3,v:8.2}
];
export const NIGHT_LAMPS:readonly IsoPoint[]=[
 {u:67.4,v:4.75},{u:71.5,v:9.55},frontOfHouse(2.5,-3),frontOfHouse(2.5,3)
];
export const NIGHT_VAN:IsoPoint={u:76.25,v:12.14};
export const NIGHT_ROAD_HALF=.86,NIGHT_PAVEMENT_HALF=1.48;
export function nightStreetDistance(p:IsoPoint):number{
 let best=Infinity;
 for(let i=1;i<NIGHT_STREET.length;i++){
  const a=NIGHT_STREET[i-1],b=NIGHT_STREET[i],du=b.u-a.u,dv=b.v-a.v;
  const t=Math.max(0,Math.min(1,((p.u-a.u)*du+(p.v-a.v)*dv)/(du*du+dv*dv)));
  best=Math.min(best,Math.hypot(p.u-a.u-t*du,p.v-a.v-t*dv));
 }
 return best;
}
export function nightStreetSurface(p:IsoPoint):'road'|'sidewalk'|'yard'|'grass'{
 const distance=nightStreetDistance(p);
 if(distance<=NIGHT_ROAD_HALF)return 'road';
 if(distance<=NIGHT_PAVEMENT_HALF)return 'sidewalk';
 if(p.u+p.v>=frontSum-.1&&p.u+p.v<=frontSum+2.5&&p.u-p.v>=frontLeft&&p.u-p.v<=frontLeft+FRONT_FACADE_WIDTH/41)return 'yard';
 return 'grass';
}
export const NIGHT_HOUSE={
 center:{u:77.2,v:5.7},
 door:DOOR,
 window:{u:DOOR.u+windowShift,v:DOOR.v-windowShift},
 gate:frontOfHouse(2.0),
 yard:frontOfHouse(1.4),
 porch:frontOfHouse(.65),
 sidewalk:frontOfHouse(2.65),
 road:frontOfHouse(4),
 start:{u:65.7,v:4.45}
} as const;
// Neighbors have distinct silhouettes/colors and ground footprints, shared
// by rendering and both manual/assisted navigation.
export const NIGHT_NEIGHBORS=[
 {u:68.2,v:2.9,style:'sage',halfU:.85,halfV:.62},
 {u:72.1,v:2.5,style:'rose',halfU:.85,halfV:.62},
 {u:81,v:3.7,style:'blue',halfU:.85,halfV:.62}
] as const;
export type NightDestination='door'|'window';
export const NIGHT_INTERACTION_RADIUS=1.75;
export const NIGHT_WINDOW_INTERACTION_RADIUS=1.35;
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export function nightRouteCenter(u:number):number{
 if(u<=70)return 4.45+Math.sin(u*.4)*.35;
 const t=clamp((u-70)/8,0,1);
 return mix(4.45,7.85,t*t*(3-2*t));
}
export function nightRouteLimits(u:number):{min:number;max:number}{
 const center=nightRouteCenter(u);
 // Broad paved street at the entrance, generous lateral forecourt at the house.
 const half=u<71?3.35:u<75?3.9:4.1;
 // Keep the full street and its curb inside the walkable terrain, even
 // where the approach curves toward the front of the house.
 let streetV=center;
 for(let i=1;i<NIGHT_STREET.length;i++){
  const a=NIGHT_STREET[i-1],b=NIGHT_STREET[i];
  if(u>=a.u&&u<=b.u)streetV=mix(a.v,b.v,(u-a.u)/(b.u-a.u));
 }
 return {min:center-half,max:Math.max(center+half,streetV+2.25)};
}
export function nightHouseBlocks(p:IsoPoint):boolean{
 // Building footprint is above the walkable porch. A soft solid facade makes
 // Kitty slide along the side of the house instead of disappearing into a wall.
 const depth=p.u+p.v,across=p.u-p.v;
 return (depth>=frontSum-5&&depth<=frontSum-.55&&across>=frontLeft&&across<=frontLeft+FRONT_FACADE_WIDTH/41)||
  NIGHT_NEIGHBORS.some(h=>Math.abs(p.u-h.u)<=h.halfU&&Math.abs(p.v-h.v)<=h.halfV);
}
export function nightWalkable(p:IsoPoint):boolean{
 if(p.u<65.35||p.u>81.50)return false;
 const lim=nightRouteLimits(p.u);
 return p.v>=lim.min+.16&&p.v<=lim.max-.16&&!nightHouseBlocks(p);
}
export function nightTarget(stage:string):IsoPoint{
 return stage==='window'?NIGHT_HOUSE.window:NIGHT_HOUSE.door;
}
export function nightNavigationDistance(a:IsoPoint,b:IsoPoint):number{
 return Math.hypot(a.u-b.u,a.v-b.v);
}
// Exact segment/rectangle intersection catches even a sub-frame corner
// crossing that point samples can miss. Use the same transformed footprint
// as nightHouseBlocks, rather than changing the collision or street.
function hitsRectangle(ax:number,ay:number,bx:number,by:number,x0:number,x1:number,y0:number,y1:number):boolean{
 let enter=0,leave=1;
 for(const [start,end,low,high] of [[ax,bx,x0,x1],[ay,by,y0,y1]]){
  const delta=end-start;
  if(Math.abs(delta)<1e-10){if(start<low||start>high)return false;continue;}
  const t0=(low-start)/delta,t1=(high-start)/delta;
  enter=Math.max(enter,Math.min(t0,t1));leave=Math.min(leave,Math.max(t0,t1));
  if(enter>leave)return false;
 }
 return true;
}
export function nightSegmentClear(a:IsoPoint,b:IsoPoint):boolean{
 if(!nightWalkable(a)||!nightWalkable(b))return false;
 if(hitsRectangle(a.u+a.v,a.u-a.v,b.u+b.v,b.u-b.v,frontSum-5,frontSum-.55,frontLeft,frontLeft+FRONT_FACADE_WIDTH/41))return false;
 for(const h of NIGHT_NEIGHBORS)if(hitsRectangle(a.u,a.v,b.u,b.v,h.u-h.halfU,h.u+h.halfU,h.v-h.halfV,h.v+h.halfV))return false;
 const length=nightNavigationDistance(a,b),steps=Math.max(1,Math.ceil(length/.035));
 for(let j=0;j<=steps;j++){
  const t=j/steps;
  if(!nightWalkable({u:mix(a.u,b.u,t),v:mix(a.v,b.v,t)}))return false;
 }
 return true;
}
const lineClear=nightSegmentClear;
export function nightAutoRoute(from:IsoPoint,to:IsoPoint):IsoPoint[]{
 // A* on the compact 0.5-unit isometric forecourt grid, then LOS smoothing.
 // A click works from ANY valid exterior point, including after the door clue.
 if(!nightWalkable(from)||!nightWalkable(to))return [];
 if(lineClear(from,to))return [{...to}];
 const step=.5,gridU=65,gridV=-1,columns=35,rows=35;
 const key=(x:number,y:number)=>y*columns+x;
 const node=(x:number,y:number):IsoPoint=>({u:gridU+x*step,v:gridV+y*step});
 const nearest=(p:IsoPoint):[number,number]|null=>{
  let best:null|[number,number]=null,dist=Infinity;
  for(let x=0;x<columns;x++)for(let y=0;y<rows;y++){
   const n=node(x,y),d=nightNavigationDistance(n,p);
   if(d>=dist||!nightWalkable(n)||!lineClear(p,n))continue;
   best=[x,y];dist=d;
  }
  return best;
 };
 const start=nearest(from),end=nearest(to);
 if(!start||!end)return [];
 const total=columns*rows,score=new Float64Array(total).fill(Infinity);
 const fromKey=key(...start),goalKey=key(...end);
 const prev=new Int32Array(total).fill(-1),open=new Set<number>([fromKey]);
 score[fromKey]=0;
 const neigh=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
 for(let iter=0;iter<total*2&&open.size;iter++){
  let current=-1,best=Infinity;
  for(const k of open){
   const x=k%columns,y=Math.floor(k/columns);
   const h=nightNavigationDistance(node(x,y),to);
   const f=score[k]+h;
   if(f<best){best=f;current=k;}
  }
  if(current===goalKey)break;
  open.delete(current);
  const cx=current%columns,cy=Math.floor(current/columns);
  for(const [dx,dy] of neigh){
   const x=cx+dx,y=cy+dy;
   if(x<0||y<0||x>=columns||y>=rows)continue;
   const n=node(x,y),k=key(x,y);
   if(!nightWalkable(n)||!lineClear(node(cx,cy),n))continue;
   const g=score[current]+Math.hypot(dx,dy)*step;
   if(g<score[k]){score[k]=g;prev[k]=current;open.add(k);}
  }
 }
 if(fromKey!==goalKey&&prev[goalKey]===-1)return [];
 const raw:IsoPoint[]=[{...to}];let current=goalKey;
 for(let n=0;n<total&&current!==fromKey;n++){
  raw.unshift(node(current%columns,Math.floor(current/columns)));
  current=prev[current];if(current<0)return [];
 }
 raw.unshift(node(start[0],start[1]));
 raw.unshift({...from});
 // Reduce staircase-like A* to a small number of smooth, safe curve points.
 const smooth:IsoPoint[]=[];
 for(let i=0;i<raw.length-1;){
  let last=i+1;
  for(let j=raw.length-1;j>i+1;j--)if(lineClear(raw[i],raw[j])){last=j;break;}
  if(!lineClear(raw[i],raw[last]))return [];
  smooth.push(raw[last]);i=last;
 }
 return smooth;
}
