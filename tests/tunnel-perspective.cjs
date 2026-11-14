const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const source=fs.readFileSync('src/experience/tunnel-perspective.ts','utf8');
const output=ts.transpileModule(source,{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const mod={};
vm.runInNewContext(output,{exports:mod,Math});
assert.equal(mod.TUNNEL_STREAMS,16,'restore organic tunnel with soft streams, not 28 rigid spokes');
assert.equal(mod.tunnelAperture(0),1);
assert(mod.tunnelAperture(1)>.79,'the tunnel must retain volume during the fly-through');
assert(mod.tunnelAperture(1)<.85,'the camera should still contract toward the nucleus');
let previous=Infinity;
for(let i=0;i<=100;i++){
 const width=mod.tunnelAperture(i/100);
 assert(width<=previous+1e-10,'tunnel narrows smoothly and monotonically');
 previous=width;
}
const lane=2*Math.PI/mod.TUNNEL_STREAMS;
function distanceToStream(a){
 const nearest=Math.round(a/lane)*lane;
 return Math.abs(a-nearest);
}
let originalDistance=0,guidedDistance=0,dustDistance=0;
for(let i=0;i<1000;i++){
 const angle=i*.3615;
 originalDistance+=distanceToStream(angle);
 guidedDistance+=distanceToStream(mod.softFilamentAngle(angle,.7,1));
 dustDistance+=distanceToStream(mod.softFilamentAngle(angle,.10,1));
}
assert(guidedDistance<originalDistance*.42,
 'most stars should form visible but not rigid converging currents');
assert(dustDistance>originalDistance*.75,
 'some free stars must remain dispersed to preserve the attractive earlier version');
for(let i=0;i<1000;i++){
 const a=i*.0718;
 const p=mod.softFilamentAngle(a,.7,i/1000);
 assert(Number.isFinite(p),'angle must stay finite for every stage');
 assert(Math.abs(p-a)<.35,'alignment cannot cause abrupt jumps across the canvas');
}
const canvasSource=fs.readFileSync('src/experience/VideoGalaxyCanvas.tsx','utf8');
assert(canvasSource.includes('softFilamentAngle(originalAngle,star.color,arrival.tunnel)'),
 'the rendering must use gentle alignment');
assert(canvasSource.includes('i*2.399963229728653+star.seed*1.23'),
 'restore the visually preferred original organic star distribution');
assert(!canvasSource.includes('const streamPresence='),
 'do not use the rigid 28-lane ray renderer from the regressed commit');
console.log('PASS: PR9 organic tunnel restored; soft lanes, gradual approach, freely drifting dust.');
