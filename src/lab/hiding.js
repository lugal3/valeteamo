export const HIDE_SECONDS=1.45;
const smooth=t=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
function mix(a,b,t){const f=smooth(t),angle=Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw));return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f,yaw:a.yaw+angle*f,pitch:a.pitch+(b.pitch-a.pitch)*f};}
export function hidingFrame({from,inside,outside,progress,entering=true,wardrobe=true}){
 const t=Math.max(0,Math.min(1,progress));
 if(!wardrobe)return {camera:mix(from,entering?inside:outside,t),doorAmount:0};
 if(entering){
  const approach={...outside,yaw:inside.yaw+Math.PI,pitch:0},backward={...inside,yaw:inside.yaw+Math.PI};
  if(t<.22)return {camera:mix(from,approach,t/.22),doorAmount:smooth(t/.22)};
  if(t<.64)return {camera:mix(approach,backward,(t-.22)/.42),doorAmount:1};
  if(t<.82)return {camera:mix(backward,inside,(t-.64)/.18),doorAmount:1};
  return {camera:{...inside},doorAmount:1-smooth((t-.82)/.18)*.965};
 }
 if(t<.22)return {camera:{...from},doorAmount:.035+smooth(t/.22)*.965};
 const forward={...outside,yaw:inside.yaw,pitch:0};
 if(t<.72)return {camera:mix(from,forward,(t-.22)/.5),doorAmount:1};
 return {camera:mix(forward,outside,(t-.72)/.28),doorAmount:1-smooth((t-.72)/.28)};
}
