// Kawaii holiday decoration for the music/altar room. All meshes use the existing
// world batch; no texture, point light, per-frame geometry or external asset.
export const HOLIDAY_TREE=Object.freeze({x:11.28,z:2.28,radius:.53,height:2.24});
const greens=[[.32,.56,.42],[.40,.65,.48],[.49,.71,.54]];
const colors=[[.95,.50,.68],[.98,.82,.63],[.93,.84,.88],[.83,.30,.42]];
const TAU=Math.PI*2;
export function installHolidayTree(add,floor){
 const {x,z}=HOLIDAY_TREE;
 const piece=(id,px,y,pz,w,h,d,mat,solid=false,extra={})=>add('holiday-'+id,x+px,floor+y,z+pz,w,h,d,mat,solid,extra);
 piece('pot',0,.15,0,.43,.30,.43,'wood',true,{shape:'round',segments:8,rings:3,color:[.64,.39,.39]});
 // Three low-poly flared tiers. Their bounding collision is confined to the tree.
 for(let i=0;i<3;i++){
  const bottom=.30+i*.47,top=bottom+.86,r=.53-i*.125,triangles=[];
  const ring=(n,h,rad)=>[x+Math.cos(n*TAU/8)*rad,floor+h,z+Math.sin(n*TAU/8)*rad];
  for(let n=0;n<8;n++){
   const a=ring(n,bottom,r*.94),b=ring(n+1,bottom,r*.94),c=ring(n,bottom+.10,r),d=ring(n+1,bottom+.10,r);
   const peak=[x,floor+top,z],base=[x,floor+bottom,z];
   triangles.push([a,c,b],[c,d,b],[c,peak,d],[base,a,b]);
  }
  piece('tier-'+i,0,(bottom+top)/2,0,r*2,top-bottom,r*2,'foliage',true,{triangles,color:greens[i],facetTint:.09});
  for(let n=0;n<5;n++){
   const a=TAU*(n/5+i*.12),rad=r*.83;
   piece('bauble-'+i+'-'+n,Math.cos(a)*rad,bottom+.25,Math.sin(a)*rad,.102,.102,.102,'pink',false,{shape:'round',segments:6,rings:3,color:colors[(n+i)%colors.length]});
  }
  // Two subtle strings of gold ribbon and little pastel emissive bulbs.
  if(i<2)piece('garland-'+i,0,bottom+.15,0,r*1.76,.035,r*1.76,'brass',false,{shape:'torus',majorRadius:r*.88,tubeRadius:.014,segments:10,tubeSegments:3,color:[.91,.72,.39]});
  for(let n=0;n<4;n++){
   const a=TAU*(n/4+i*.19+.1),rad=r*.91;
   piece('bulb-'+i+'-'+n,Math.cos(a)*rad,bottom+.16,Math.sin(a)*rad,.049,.049,.049,'torchglass',false,{holidayBulb:true,color:colors[(n+2*i)%4]});
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
 piece('star',0,starY,0,.36,.36,.05,'brass',false,{triangles:tris,glow:true,color:[1,.79,.36]});
 // A few hand-wrapped gifts, all tucked under the foliage rather than in the path.
 for(const [i,dx,dz,w,h,d] of [[0,-.30,.26,.27,.22,.24],[1,.28,.25,.25,.28,.21],[2,.05,-.30,.29,.18,.24]]){
  const color=colors[i],ribbon=colors[(i+1)%4];
  piece('gift-'+i,dx,h/2,dz,w,h,d,'paper',false,{color});
  piece('gift-ribbon-x-'+i,dx,h+.005,dz,w+.008,.014,.042,'pink',false,{color:ribbon});
  piece('gift-ribbon-z-'+i,dx,h+.007,dz,.042,.014,d+.008,'pink',false,{color:ribbon});
  for(const side of [-1,1])piece('gift-bow-'+i+'-'+side,dx+side*.052,h+.045,dz,.10,.057,.062,'pink',false,{shape:'round',segments:5,rings:3,color:ribbon,roll:side*.35});
 }
}
