// Cheap articulated caster for the existing depth atlas. The visual actor,
// its rig, collision and detection are not replaced. No extra visible mesh.
export function pursuerShadowPieces(){
 const pieces=[],add=(id,joint,x,y,z,w,h,d,round=false)=>pieces.push({id:'shadow-'+id,joint,x,y,z,w,h,d,mat:'dark',solid:false,...(round?{shape:'round',segments:8,rings:5}:{})});
 add('torso','chest',0,1.21,0,.625,.62,.36);
 add('hips','hips',0,.94,0,.48,.21,.31);
 add('head','head',0,1.69,0,.36,.45,.34,true);
 for(const side of [-1,1]){
  add('arm'+side,'arm'+side,side*.321,1.26,0,.18,.35,.20);
  add('forearm'+side,'forearm'+side,side*.321,.98,0,.16,.33,.18);
  add('hand'+side,'forearm'+side,side*.321,.762,.025,.13,.14,.14,true);
  add('thigh'+side,'thigh'+side,side*.136,.674,0,.21,.43,.23);
  add('shin'+side,'shin'+side,side*.136,.275,0,.18,.43,.18);
  add('foot'+side,'foot'+side,side*.136,.071,.06,.18,.14,.33);
 }
 return pieces;
}
export function shadowRelevant(light,actor){
 if(!actor||!Number.isFinite(actor.y))return false;
 const drop=light.y-actor.y;
 return drop>.75&&drop<3.8&&Math.hypot(light.x-actor.x,light.z-actor.z)<Math.min(8.5,drop*3.2+1);
}
export function shadowNeedsUpdate(old,actor,time,low=false){
 if(!actor?.active)return !!old;
 if(!old)return true;
 const movement=Math.hypot(actor.x-old.x,actor.y-old.y,actor.z-old.z);
 const angle=Math.abs(Math.atan2(Math.sin((actor.facing??actor.yaw)-old.yaw),Math.cos((actor.facing??actor.yaw)-old.yaw)));
 return actor.mode!==old.mode||movement>1.2||(time-old.time>=(low?.22:.12)&&(movement>.035||angle>.08||Math.abs((actor.walk||0)-old.walk)>.11||Math.abs((actor.bedTime||0)-old.bedTime)>.1));
}
