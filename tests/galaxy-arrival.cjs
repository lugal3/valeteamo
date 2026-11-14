const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=fs.readFileSync('src/experience/galaxy-arrival.ts','utf8');
const output=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={};vm.runInNewContext(output,{exports:mod,Math});
const at=mod.galaxyArrivalAt,T=mod.GALAXY_ARRIVAL_SECONDS;
assert.equal(T,4.55,'reference lasts 4.367s; allow a soft .18s interactive settle');
const stages=[
 [0,'descent'],[.45,'star-tunnel'],[1.45,'approach'],
 [1.94,'unfold'],[2.64,'heart-rise'],[3.70,'camera-reveal'],[4.55,'explore']
];
for(const [t,expected] of stages)assert.equal(at(t).stage,expected,'at '+t+'s');
const EPS=1e-8;
for(let i=0;i<=455;i++){
 const t=i/100,a=at(t),b=at(t+.01);
 for(const key of ['descent','tunnel','approach','unfold','heart','phrases','reveal','worldBlend']){
  assert(a[key]>=0&&a[key]<=1,key+' range at '+t);
  assert(a[key]<=b[key]+EPS,key+' phase must be smooth and monotonic at '+t);
 }
 for(const key of ['zoom','focusY','yaw','pitch','tunnelLens','spin','travel','cinematicRoll'])
  assert(Number.isFinite(a[key]),key+' must be finite');
 const frame=at(t+1/30);
 assert(Math.abs(frame.zoom-a.zoom)<.07,'camera cannot snap between frames at '+t);
 assert(Math.abs(frame.pitch-a.pitch)<.07,'pitch cannot snap between frames at '+t);
 assert(Math.abs(frame.yaw-a.yaw)<.05,'yaw cannot snap between frames at '+t);
}
assert(at(0).focusY<at(.95).focusY,'camera descends into approaching tunnel');
assert(at(.3).zoom<at(1.58).zoom,'camera dollies toward vanishing point');
assert(at(1.58).zoom>at(2.45).zoom+.15,'camera settles back as spiral emerges');
assert(at(.65).tunnelLens<at(1.35).tunnelLens,'ribbons open during fast approach');
assert(at(1.4).tunnelLens>at(2.15).tunnelLens,'lens breathes inward after close pass');
assert(at(.75).travel<at(1.50).travel,'optical flow accelerates naturally');
assert(at(1.64).unfold<at(2.27).unfold,'the spiral unfurls after vortex');
assert.equal(at(1.45).heart,0,'heart must not preempt tunnel');
assert(at(2.67).heart>0&&at(2.67).heart<1,'heart rises from galactic core');
assert.equal(at(2.95).phrases,0,'orbiting text emerges after the heart');
assert(at(4.2).phrases>.85,'memories appear near final shot');
assert.equal(at(4.55).completed,true);
assert.equal(at(0,true).completed,true,'reduced-motion shows final scene');
assert.equal(mod.galaxyPinchZoom(1,100,200),2);
assert.equal(mod.galaxyPinchZoom(1,100,50),.5);
assert.equal(mod.galaxyPinchZoom(2,100,1000),2.65);
const particleCode=fs.readFileSync('src/experience/VideoGalaxyCanvas.tsx','utf8');
assert(particleCode.includes('arrival.tunnelLens'),'the optical tunnel must use camera lens choreography');
assert(particleCode.includes('arrival.travel'),'particles must accelerate with the camera');
assert(!particleCode.includes('const streamPresence='),'do not restore rigid line tunnel regression');
console.log('PASS: 131-frame reference timing, non-linear dolly, soft galaxy reveal, rising heart, continuity and touch zoom.');
