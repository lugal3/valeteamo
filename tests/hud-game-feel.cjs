// ValeTeAmo V2 phase 11: contextual control instructions and visual safety.
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {rcControlHint,throwableHint,threatAccessibility}=await import('../src/lab/hud-context.js');
 assert(rcControlHint(false).includes('W/S')&&rcControlHint(false).includes('Q:'));
 assert(rcControlHint(true).includes('Joystick')&&!rcControlHint(true).includes('W/S'));
 assert(rcControlHint(false,5).includes('Señuelo activo'));
 assert(rcControlHint(true,0,true).includes('Cerrar escotilla'));
 assert(rcControlHint(false,0,true).includes('Pulsa T'));
 assert(throwableHint(true).includes('Toca'));
 assert(throwableHint(false).includes('G:')&&throwableHint(false).includes('V:'));
 assert(threatAccessibility('chase').includes('Peligro'));
 assert(threatAccessibility('watch').includes('investigando'));
 assert(threatAccessibility('search').includes('Sin persecución'));
 const house=fs.readFileSync('src/lab/house.js','utf8');
 const css=fs.readFileSync('src/lab/house.css','utf8');
 for(const name of ['house-rc-hint','house-noise-hint'])assert(house.includes('id="'+name+'"'));
 assert(house.includes("rcControlHint(!desktop.matches,rc.noise,canTrapPursuer("));
 assert(house.includes("throwableHint(!desktop.matches)"));
 assert(house.includes("danger.setAttribute('aria-label',threatAccessibility("));
 assert(css.includes('.house-rc-hud[hidden]')&&css.includes('.house-noise-controls[hidden]'));
 assert(css.includes('env(safe-area-inset-right)')&&css.includes('env(safe-area-inset-bottom)'));
 assert(css.includes('min-height:48px')&&css.includes('focus-visible'));
 assert(css.includes('prefers-reduced-motion:reduce'));
 console.log('PASS V2 phase 11: responsive mobile/PC hints, safe-area hit targets, alert labels, hidden overlays');
})().catch(err=>{console.error(err);process.exitCode=1;});
