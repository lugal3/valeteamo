import fs from 'node:fs';
import assert from 'node:assert/strict';
const dir=process.argv[2]||'artifacts/audio-output';
const old=JSON.parse(fs.readFileSync(dir+'/legacy/report.json')).results;
const next=JSON.parse(fs.readFileSync(dir+'/current/report.json')).results;
const results=[];
for(const row of next){
 const before=old.find(x=>x.id===row.id);assert(before);
 const delta=row.activeDb-before.activeDb;
 const comparison={id:row.id,profile:row.profile,beforeActiveDb:before.activeDb,afterActiveDb:row.activeDb,improvementDb:delta,beforeLUFS:before.lufs,afterLUFS:row.lufs,peakDb:row.peakDb,truePeak:row.truePeak,reference:row.reference};
 results.push(comparison);console.log('OUTPUT_COMPARISON '+JSON.stringify(comparison));
}
const clear=results.filter(r=>r.profile==='clear');
const targets=clear.map(r=>({id:r.id,criteria:['capture','danger'].includes(r.id)?'active band contrast >= 0 dB at -14 LUFS':'active band contrast >= -6 dB at -14 LUFS (wall exempt)',pass:r.id==='door-wall'||r.reference[-14].bandRmsContrast>=(['capture','danger'].includes(r.id)?0:-6)}));
const report={results,targets,allTargetsMet:targets.every(x=>x.pass),note:'Candidate engineering targets; windowed band RMS includes natural silence. Not equivalent to a listening test.'};
fs.writeFileSync(dir+'/comparison.json',JSON.stringify(report,null,2));console.log('AUDIBILITY_TARGETS '+JSON.stringify(targets));
// A miss remains visible in the report. It is not a false pass of the design.
if(!report.allTargetsMet)process.exitCode=1;
