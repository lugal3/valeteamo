const assert=require('node:assert/strict');
(async()=>{
 const {measurePCM,calibrationGain,spatialGain,outputGuardCurve,dbToGain,gainToDb,multiplierLabel}=await import('../src/lab/audio-mastering.js');
 const data=Float32Array.from({length:4800},(_,i)=>i<2400?.01*Math.sin(i*.1):0);
 const buffer={sampleRate:4800,length:data.length,duration:1,numberOfChannels:1,getChannelData:()=>data};
 const m=measurePCM(buffer);assert(m.peakDb<-39&&m.peakDb>-41);assert(m.rmsDb<m.activeDb);assert.equal(calibrationGain('light',m),4);
 assert.equal(calibrationGain('ambient',m),1);assert.equal(calibrationGain('light',{peakDb:-160,activeDb:-160}),1);
 const hot=calibrationGain('danger-alert',{peakDb:0,activeDb:-8});assert(hot<1&&hot>0);
 assert(spatialGain({distance:0})>spatialGain({distance:4}));assert(spatialGain({distance:4})>spatialGain({distance:4,occluded:true}));
 assert(spatialGain({distance:4,occluded:true,profile:'clear'})>spatialGain({distance:4,occluded:true,profile:'cinema'}));
 assert(Math.abs(gainToDb(2)-6.0206)<.001);assert.equal(multiplierLabel(2),'2.00× (+6.0 dB)');
 const curve=outputGuardCurve();assert(curve.every(x=>Math.abs(x)<.891));assert.equal(curve[2048],0);assert.equal(curve[3072],.5);
 console.log('PASS audio mastering: active RMS, silence, peak-aware gain, preserved spatial ordering and output guard');
})().catch(e=>{console.error(e);process.exitCode=1});
