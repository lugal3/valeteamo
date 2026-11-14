const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const code=fs.readFileSync('src/experience/galaxy-arrival.ts','utf8');
const output=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={};
vm.runInNewContext(output,{exports:mod,Math});
const at=mod.galaxyArrivalAt,seconds=mod.GALAXY_ARRIVAL_SECONDS;
assert.equal(seconds,6.1);
const stages=[[0,'descent'],[1.2,'star-tunnel'],[2.7,'approach'],[3.55,'unfold'],[4.5,'heart-rise'],[5.7,'camera-reveal'],[6.1,'explore']];
for(const [t,expected] of stages)assert.equal(at(t).stage,expected,'at '+t+'s');
assert(at(0).focusY<at(1.5).focusY,'the camera must visibly descend');
assert(at(1.75).spin>at(.3).spin,'star tunnel rotates over time');
assert(at(0).zoom<at(2.5).zoom,'camera moves towards nucleus');
assert(at(3.0).unfold<at(4.2).unfold,'spiral opens gradually');
assert.equal(at(3.7).heart,0,'heart does not materialize before galaxy opens');
assert(at(4.55).heart>0&&at(4.55).heart<1,'heart rises progressively');
assert.equal(at(4.9).phrases,0,'orbital text waits for the reveal');
assert(at(5.7).zoom>at(4.55).zoom,'camera performs a second final push');
assert.equal(at(6.1).completed,true);
assert.equal(at(0,true).completed,true,'reduced-motion shows final view immediately');
assert.equal(mod.galaxyPinchZoom(1,100,200),2);
assert.equal(mod.galaxyPinchZoom(1,100,50),.5);
assert.equal(mod.galaxyPinchZoom(2,100,1000),2.65);
for(let i=0;i<=100;i++){
 const a=at(i*.1),b=at((i+1)*.1);
 for(const k of ['descent','tunnel','approach','unfold','heart','phrases','reveal','worldBlend'])
  assert(a[k]>=0&&a[k]<=1&&a[k]<=b[k]+1e-9,k+' needs continuous nondecreasing progress');
}
console.log('PASS: video arrival — camera descent, orbital stars, fly-in, spiral unfolding, rising heart, reveal and reduced motion.');
