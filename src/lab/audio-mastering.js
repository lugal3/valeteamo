// PCM measurements in dBFS, not device SPL or LUFS. No asset is rewritten.
export const dbToGain=db=>10**(db/20);
export const gainToDb=gain=>20*Math.log10(Math.max(1e-8,gain));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const AUDIO_PROFILES=Object.freeze({
 balanced:{effects:1,ambient:1,music:1,wall:.55,floor:.7,distance:.095},
 cinema:{effects:.9,ambient:1.15,music:1.1,wall:.38,floor:.55,distance:.15},
 clear:{effects:1.35,ambient:.42,music:.48,wall:.72,floor:.82,distance:.065,presence:1.65}
});
export const audioProfile=id=>AUDIO_PROFILES[id]||AUDIO_PROFILES.balanced;
export function measurePCM(buffer,start=0,duration=buffer.duration-start){
 const first=clamp(Math.round(start*buffer.sampleRate),0,buffer.length);
 const last=clamp(first+Math.round(duration*buffer.sampleRate),first,buffer.length);
 const block=Math.max(1,Math.round(buffer.sampleRate*.04)),levels=[];
 let peak=0,energy=0,count=0;
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i));
 for(let at=first;at<last;at+=block){
  let sum=0,n=0;
  for(const data of channels)for(let i=at;i<Math.min(at+block,last);i++){
   const value=data[i];if(!Number.isFinite(value))continue;
   peak=Math.max(peak,Math.abs(value));sum+=value*value;n++;
  }
  if(n){levels.push(Math.sqrt(sum/n));energy+=sum;count+=n;}
 }
 // Ignore silence/tails when estimating the typical audible portion.
 const active=levels.filter(v=>v>Math.max(.0001,peak*dbToGain(-35))).sort((a,b)=>a-b);
 const typical=active.length?active[Math.floor((active.length-1)*.75)]:0;
 return {peakDb:gainToDb(peak),rmsDb:gainToDb(Math.sqrt(energy/Math.max(1,count))),activeDb:gainToDb(typical),seconds:(last-first)/buffer.sampleRate,activeFraction:active.length/Math.max(1,levels.length)};
}
export function calibrationGain(id,m){
 // Preserve quiet intentional sounds and dynamic music/piano. Bound both
 // amplification and peak; do not amplify silence or noise indefinitely.
 if(!m||m.peakDb<-65||m.activeDb<-65)return 1;
 if(/^(ambient|tension|emote-|upright-|piano|rc-motor|van-away)/.test(id))return 1;
 const target=/^(danger-alert|alert|power-cut|hatch-close)/.test(id)?-15:/purr|breath|creak|groan/.test(id)?-25:-19;
 return Math.min(dbToGain(-1-m.peakDb),clamp(dbToGain(target-m.activeDb),.25,4));
}
export function spatialGain({distance=0,otherFloor=false,occluded=false,level=1,profile='balanced'}={}){
 const p=audioProfile(profile);
 return .40*(p.presence??1)/(1+p.distance*Math.max(0,distance)**2)*(otherFloor?p.floor:1)*(occluded?p.wall:1)*clamp(level,0,1.5);
}
export function outputGuardCurve(){
 const a=new Float32Array(4097);
 // Transparent below -3 dBFS; smooth safety ceiling around -1 dBFS.
 for(let i=0;i<a.length;i++){const x=2*i/(a.length-1)-1,v=Math.abs(x);a[i]=Math.sign(x)*(v<=.70?v:.70+.19*Math.tanh((v-.70)/.19));}
 return a;
}
export function meterPCM(data){
 let peak=0,sum=0;for(const x of data){peak=Math.max(peak,Math.abs(x));sum+=x*x;}
 return {peakDb:gainToDb(peak),rmsDb:gainToDb(Math.sqrt(sum/Math.max(1,data.length)))};
}
export function multiplierLabel(value){return Number(value).toFixed(2)+'× ('+(value===0?'−∞':(gainToDb(value)>=0?'+':'')+gainToDb(value).toFixed(1))+' dB)';}
