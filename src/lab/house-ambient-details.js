// Phase 05 — sparse, room-specific environmental storytelling.
// Visual-only additions: no colliders, triggers, puzzle ownership or new textures.
// Tiny dynamic accents share the existing WebGL1 batch; no extra draw calls.
export const ENVIRONMENT_DECOR_IDS=Object.freeze([
 'v2-curtain-living-left','v2-curtain-living-right',
 'v2-curtain-reading-left','v2-curtain-reading-right',
 'v2-bedroom-letter','v2-bedroom-ribbon',
 'v2-study-binder','v2-kitchen-towel','v2-bath-towel','v2-music-program'
]);
export function installLivingHouseDetails(add,height){
 const visual=(id,x,y,z,w,h,d,mat,extra={})=>add(id,x,y,z,w,h,d,mat,false,{castShadow:false,...extra});
 // Curtains are wall-side, intentionally away from the intro window and its latch.
 for(const [id,x,y,z] of [
  ['v2-curtain-living-left',.22,1.73,8.02],
  ['v2-curtain-living-right',.22,1.73,8.80],
  ['v2-curtain-reading-left',.22,height+1.73,7.83],
  ['v2-curtain-reading-right',.22,height+1.73,8.62]
 ])visual(id,x,y,z,.055,1.22,.37,'velvet',
  {dynamic:false,ambient:'curtain-sway',ambientPhase:z*1.7,ambientAmplitude:.022});
 // Still-life details remain on existing furniture or against walls.
 visual('v2-bedroom-letter',4.04,height+.978,1.36,.18,.008,.25,'paper',{yaw:.11});
 visual('v2-bedroom-ribbon',4.12,height+.992,1.39,.07,.012,.03,'bow',{yaw:-.2});
 visual('v2-study-binder',2.91,.955,4.18,.19,.025,.26,'paper',{yaw:.2});
 visual('v2-kitchen-towel',10.05,1.013,.84,.25,.018,.16,'velvet',{color:[.62,.46,.41]});
 visual('v2-bath-towel',9.76,1.10,4.46,.28,.36,.028,'cream');
 visual('v2-music-program',9.62,height+1.036,.79,.17,.008,.26,'paper',{yaw:-.13});
 return ENVIRONMENT_DECOR_IDS;
}
