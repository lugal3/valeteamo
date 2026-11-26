// Kawaii holiday decoration in the north-east corner of the upstairs hall. All meshes use the existing
// world batch; no texture, point light, per-frame geometry or external asset.
// Option A: outside the music room, between the bedroom and music partitions.
// Local +Z faces diagonally southwest, out into the open corridor.
export const HOLIDAY_TREE=Object.freeze({x:6.75,z:.875,yaw:Math.PI/4,radius:.53,height:2.30});
export const HOLIDAY_GIFT_OFFSET=Object.freeze({x:-.25,z:.65});
export const HOLIDAY_SWITCH_OFFSET=Object.freeze({x:.15,z:.83});
export function holidayTreePoint(dx,dz){
 const {x,z,yaw}=HOLIDAY_TREE,c=Math.cos(yaw),s=Math.sin(yaw);
 return {x:x+dx*c-dz*s,z:z+dx*s+dz*c};
}
const greens=[[.32,.56,.42],[.40,.65,.48],[.49,.71,.54]];
const colors=[[.95,.50,.68],[.98,.82,.63],[.93,.84,.88],[.83,.30,.42]];
const TAU=Math.PI*2;
export function installHolidayTree(add,floor,holiday=null){
 const {x,z,yaw}=HOLIDAY_TREE;
 const piece=(id,px,y,pz,w,h,d,mat,solid=false,extra={})=>{
  const at=holidayTreePoint(px,pz);
  // The conical tiers retain axis-aligned collision bounds. Their geometry
  // is symmetric and the ring vertices themselves are already rotated.
  return add('holiday-'+id,at.x,floor+y,at.z,w,h,d,mat,solid,{yaw:id.startsWith('tier-')?0:yaw,...extra});
 };
 piece('pot',0,.15,0,.43,.30,.43,'wood',true,{shape:'round',smooth:true,segments:8,rings:3,color:[.64,.39,.39]});
 // Three low-poly flared tiers. Their bounding collision is confined to the tree.
 for(let i=0;i<3;i++){
  const bottom=.30+i*.47,top=bottom+.86,r=.53-i*.125,triangles=[];
  const ring=(n,h,rad)=>[x+Math.cos(n*TAU/8+yaw)*rad,floor+h,z+Math.sin(n*TAU/8+yaw)*rad];
  for(let n=0;n<8;n++){
   const a=ring(n,bottom,r*.94),b=ring(n+1,bottom,r*.94),c=ring(n,bottom+.10,r),d=ring(n+1,bottom+.10,r);
   const peak=[x,floor+top,z],base=[x,floor+bottom,z];
   triangles.push([a,c,b],[c,d,b],[c,peak,d],[base,a,b]);
  }
  piece('tier-'+i,0,(bottom+top)/2,0,r*2,top-bottom,r*2,'foliage',true,{triangles,color:greens[i],facetTint:.09});
  for(let n=0;n<5;n++){
   const a=TAU*(n/5+i*.12),rad=r*.83;
   piece('bauble-'+i+'-'+n,Math.cos(a)*rad,bottom+.25,Math.sin(a)*rad,.102,.102,.102,'pink',false,{shape:'round',smooth:true,segments:6,rings:3,color:colors[(n+i)%colors.length]});
  }
  // Two subtle strings of gold ribbon and little pastel emissive bulbs.
  if(i<2)piece('garland-'+i,0,bottom+.15,0,r*1.92,.035,r*1.92,'brass',false,{shape:'torus',majorRadius:r*.96,tubeRadius:.014,segments:10,tubeSegments:3,color:[.91,.72,.39]});
  for(let n=0;n<4;n++){
   const a=TAU*(n/4+i*.19+.1),rad=r*.97;
   piece('bulb-'+i+'-'+n,Math.cos(a)*rad,bottom+.16,Math.sin(a)*rad,.049,.049,.049,'torchglass',false,{holidayBulb:true,dynamic:false,holidayPower:holiday?.tree,color:colors[(n+2*i)%4]});
  }
 }
 // A small extruded star, readable from either side.
 const starY=2.12,pts=Array.from({length:10},(_,i)=>{const a=Math.PI/2+i*Math.PI/5,r=i%2?.075:.18;return [x+Math.cos(a)*r,floor+starY+Math.sin(a)*r];});
 const tris=[];
 for(const side of [-1,1]){
  const c=[x,floor+starY,z+side*.025];
  for(let i=0;i<10;i++){const a=[...pts[i],c[2]],b=[...pts[(i+1)%10],c[2]];tris.push(side===1?[c,a,b]:[c,b,a]);}
 }
 for(let i=0;i<10;i++){const a=pts[i],b=pts[(i+1)%10];tris.push([[...a,z-.025],[...b,z-.025],[...a,z+.025]],[[...a,z+.025],[...b,z-.025],[...b,z+.025]]);}
 piece('star',0,starY,0,.36,.36,.05,'brass',false,{triangles:tris,holidayBulb:true,dynamic:false,holidayPower:holiday?.tree,color:[1,.79,.36]});
 // A few hand-wrapped gifts, all tucked under the foliage rather than in the path.
 for(const [i,dx,dz,w,h,d] of [[0,HOLIDAY_GIFT_OFFSET.x,HOLIDAY_GIFT_OFFSET.z,.27,.22,.24],[1,.28,.25,.25,.28,.21],[2,.05,-.30,.29,.18,.24]]){
  const color=colors[i],ribbon=colors[(i+1)%4];
  piece('gift-'+i,dx,h/2,dz,w,h,d,'paper',false,{color});
  const lid=piece('gift-lid-'+i,dx,h+.012,dz,w+.014,.034,d+.014,'paper',false,{color,dynamic:i===0&&!!holiday,castShadow:false});
  if(i===0&&holiday)holiday.gift.parts.push({box:lid,x:lid.x,y:lid.y,z:lid.z,roll:lid.roll||0});
  const lidPart=(id,x,y,z,w,h,d,extra={})=>{const b=piece(id,x,y,z,w,h,d,'pink',false,{color:ribbon,dynamic:i===0&&!!holiday,castShadow:false,...extra});if(i===0&&holiday)holiday.gift.parts.push({box:b,x:b.x,y:b.y,z:b.z,roll:b.roll||0});};
  lidPart('gift-ribbon-x-'+i,dx,h+.034,dz,w+.008,.014,.042);
  lidPart('gift-ribbon-z-'+i,dx,h+.036,dz,.042,.014,d+.008);
  for(const side of [-1,1])lidPart('gift-bow-'+i+'-'+side,dx+side*.052,h+.073,dz,.10,.057,.062,{shape:'round',smooth:true,segments:5,rings:3,roll:side*.35});
 }
}
