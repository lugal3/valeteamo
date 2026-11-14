const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const compiled=ts.transpileModule(fs.readFileSync('src/experience/tunnel-perspective.ts','utf8'),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={};
vm.runInNewContext(compiled,{exports:mod,Math});
assert.equal(mod.TUNNEL_STREAMS,28);
assert.equal(mod.tunnelAperture(0),1);
assert(mod.tunnelAperture(1)<.6,'tunnel field contracts during approach');
let prev=Infinity;
for(let t=0;t<=10;t++){
 const aperture=mod.tunnelAperture(t/10);
 assert(aperture<=prev+1e-10,'approach contracts the tunnel monotonically');
 prev=aperture;
}
for(let lane=0;lane<mod.TUNNEL_STREAMS;lane++){
 const near=mod.tunnelStreamPoint(lane,.5,.1,.3,.1,390,844);
 const far=mod.tunnelStreamPoint(lane,.5,.85,.3,.1,390,844);
 assert(far.radius>near.radius*15,'one directional lane converges to a shared vanishing point');
 assert(near.radius<25,'far-away stars cluster near tunnel axis');
 const narrower=mod.tunnelStreamPoint(lane,.5,.85,.3,1,390,844);
 assert(narrower.radius<far.radius*.65,'same lane tightens when camera advances');
 for(let d=.05;d<.96;d+=.07){
  const a=mod.tunnelStreamPoint(lane,.2,d,.4,.5,390,844);
  const b=mod.tunnelStreamPoint(lane,.8,d,.4,.5,390,844);
  assert(Math.abs(a.angle-b.angle)<.06,'individual stars align into a narrow perspective stream');
  assert(Number.isFinite(a.x)&&Number.isFinite(a.y));
 }
}
console.log('PASS: 28 coherent radial star streams, shrinking aperture, perspective and deterministic geometry.');
