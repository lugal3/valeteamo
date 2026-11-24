// Material response for the existing throwable-prop system.
// Pure/finite functions: audio/AI use one collision event, never a looping emitter.
export const THROWABLE_MATERIALS=Object.freeze({
 glass:Object.freeze({mass:.52,noise:1.27,restitution:.16}),
 ceramic:Object.freeze({mass:.82,noise:1.13,restitution:.09}),
 metal:Object.freeze({mass:1.18,noise:1.37,restitution:.22}),
 wood:Object.freeze({mass:.94,noise:.74,restitution:.12})
});
export function propMaterial(form){
 return form==='glass'?'glass':form==='plate'||form==='cup'?'ceramic':
  Object.hasOwn(THROWABLE_MATERIALS,form)?form:'wood';
}
export function surfaceMaterial(mat=''){
 if(['carpet','velvet','cloth','rug'].includes(mat))return 'soft';
 if(['metal','brass','dark','torchmetal'].includes(mat))return 'metal';
 if(['wood','plaster','wallpaper'].includes(mat))return 'wood';
 if(['tile','stone','ceramica','cream','glass'].includes(mat))return 'hard';
 return 'hard';
}
const SURFACE_DAMP=Object.freeze({soft:.25,wood:.72,metal:1.16,hard:1});
export function impactResponse(form,surface='hard',speed=0){
 const material=propMaterial(form),profile=THROWABLE_MATERIALS[material];
 const velocity=Math.max(0,Math.min(16,Number.isFinite(speed)?speed:0));
 const damp=SURFACE_DAMP[surface]??1;
 return {material,surface,level:Math.max(.9,Math.min(1.5,(.8+velocity*.055)*profile.noise*damp)),
  alert:Math.max(.18,Math.min(1.7,(.45+velocity*.07)*profile.noise*damp))};
}
export function throwSpeed(power=1){
 const strength=Number.isFinite(power)?Math.max(.45,Math.min(1.1,power)):1;
 return 7*strength;
}
