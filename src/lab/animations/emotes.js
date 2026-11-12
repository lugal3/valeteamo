import {setJoint} from '../character-rig.js';
import {arm,feet,curve,ease} from './pose-tools.js';
import {sampleWhatIsLove} from './what-is-love.js';

export const EMOTES=Object.freeze([
 {id:'six-seven',label:'6–7',key:'6',duration:7.5},
 {id:'gangnam',label:'Gangnam',key:'7',duration:7},
 {id:'wave',label:'Saludar',key:'8',duration:2.4},
 {id:'what-is-love',label:'What Is Love?',key:'9',duration:10}
]);

const palmAccents=[[0,-1],[.09,-1],[.38,1],[.47,1],[.76,-1]];
const sidestep=.76;
const sideHips=[[0,-.10],[.09,-.125],[.33,0],[.42,0],[.55,.055],[.69,.115],[.76,.10]];
const sideDip=[[0,-.04],[.10,-.06],[.30,-.129],[.39,-.13],[.51,-.105],[.66,-.038],[.76,-.04]];
const liftArc=progress=>Math.sin(Math.PI*Math.max(0,Math.min(1,progress)))**2;
const lerp=(a,b,t)=>a+(b-a)*t;

function sampleSixSeven(out,time,reduced){
 const t=Math.max(0,time-.30);
 const beat=reduced?0:curve(palmAccents,t%sidestep);
 const follow=reduced?0:curve(palmAccents,Math.max(0,t-.064)%sidestep);
 const direction=t%(2*sidestep)<sidestep?1:-1;
 if(reduced)feet(out,{y:-.028});
 else{
  const phase=t%sidestep;
  const lead=(phase-.045)/.295,trail=(phase-.39)/.28;
  // Each shoe stays in place until its own swing. Lower the hips in the wide stance.
  const leading=[direction*(.04+.20*ease(lead)),.11+.088*liftArc(lead),.005+.042*liftArc(lead)];
  const trailing=[direction*(-.24+.20*ease(trail)),.11+.066*liftArc(trail),.005-.025*liftArc(trail)];
  feet(out,{x:direction*curve(sideHips,phase),y:curve(sideDip,phase),
   left:direction>0?trailing:leading,right:direction>0?leading:trailing});
 }
 arm(out,'left',[-.402+follow*.03,.825+beat*.116,.235+beat*.035],[-.35-beat*.24,.12,-.24+beat*.14]);
 arm(out,'right',[.402+follow*.03,.825-beat*.116,.235-beat*.035],[-.35+beat*.24,-.12,.24+beat*.14]);
 setJoint(out,'body',.024+beat*.025,follow*.09,-follow*.084);
 setJoint(out,'head',-.025-beat*.035,-follow*.065,follow*.065);
}

const horseSteps=[[0,0],[.18,.67],[.36,0],[.48,0],[.66,1],[.91,0],[1,0]];
const supportShift=[[0,0],[.19,1],[.76,1],[1,0]];
const reinPump=[[0,0],[.42,1],[.76,.25],[1,0]];

function sampleGangnam(out,time,reduced){
 const t=Math.max(0,time-.32),halfPhrase=.91;
 const phase=(t%halfPhrase)/halfPhrase,direction=t%(2*halfPhrase)<halfPhrase?1:-1;
 const lift=reduced?0:curve(horseSteps,phase);
 const shift=reduced?0:direction*curve(supportShift,phase);
 const pump=reduced?0:curve(reinPump,(t%.455)/.455);
 const planted=[-direction*.16,.11,.005];
 const lifted=[direction*(.16+.075*lift),.11+.164*lift,.005+.16*lift];
 feet(out,{x:-shift*.105,y:-.027-.055*pump,z:.024*lift,
  left:direction>0?planted:lifted,right:direction>0?lifted:planted,
  leftTilt:direction<0?lift*.26:0,rightTilt:direction>0?lift*.26:0});

 // Cross the wrists like reins, with one hand above the other on the bounce.
 arm(out,'left',[.030,.823+.067*pump,.285-.044*pump],[.27+pump*.24,.12,-.42],1);
 const rein=[-.035,.970+.058*pump,.235-.025*pump];
 const flourish=reduced?0:ease((time-3.04)/.42)*ease((5.56-time)/.44);
 const circle=(time-3.04)*Math.PI*2/.455;
 const lasso=[.566+.063*Math.cos(circle),1.151+.046*Math.sin(circle),.187+.036*Math.sin(circle)];
 arm(out,'right',rein.map((value,i)=>lerp(value,lasso[i],flourish)),
  [lerp(.14+pump*.15,-.31,flourish),-.17+flourish*.48*Math.cos(circle),lerp(.43,.18+.58*Math.sin(circle),flourish)],1-flourish);
 setJoint(out,'body',.072+pump*.062,shift*.19,-shift*.098);
 setJoint(out,'head',-.058-pump*.034,-shift*.13,shift*.071);
}

export function sampleEmote(id,time,out,{reduced=false,envelope=true}={}){
 out.fill(0);const clip=EMOTES.find(emote=>emote.id===id);if(!clip)return out;
 const weight=envelope?ease(time/.30)*ease((clip.duration-time)/.38):1;
 if(!weight)return out;
 if(id==='six-seven')sampleSixSeven(out,time,reduced);
 else if(id==='gangnam')sampleGangnam(out,time,reduced);
 else if(id==='what-is-love')sampleWhatIsLove(out,time,reduced);
 else{
  const wave=reduced?0:curve([[0,-1],[.20,1],[.40,-1]],Math.max(0,time-.3)%.4);
  feet(out,{y:-.01});arm(out,'left',[-.37,.56,.08]);arm(out,'right',[.57,1.015,.10],[0,0,-.25+wave*.28]);setJoint(out,'head',-.015,0,-.045);
 }
 for(let i=0;i<out.length;i++)out[i]*=weight;
 return out;
}
