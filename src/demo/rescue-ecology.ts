import type {IsoPoint} from '../isometric';
import type {RescueMapId} from './rescue-overworld';

// No runtime dependency on Phaser. Every seed, animal and micro-event is
// deterministic; no world timers and no Math.random during gameplay.
export type AmbientKind='river'|'birdsong'|'breeze'|'insects'|'night-breeze'|'distant-engine';
export type WildlifeKind='butterfly'|'sparrow'|'rabbit'|'squirrel'|'moth'|'fox'|'owl'|'cat'|'crow';
export type FloraKind='blossom'|'wildflower'|'grass'|'ivy'|'willow'|'reed';
export type FloraSeed={id:number;p:IsoPoint;kind:FloraKind;phase:number;size:number};
export type WildlifeSeed={id:number;p:IsoPoint;kind:WildlifeKind;phase:number;size:number};
export type WildlifeState={alarm:number;heading:number};
export type WildlifeFrame={x:number;y:number;lift:number;wing:number;alert:number;flip:boolean};
export type FloraFrame={sway:number;lean:number;open:number;glow:number};
export type AmbientCue={kind:AmbientKind;pan:number;scene:RescueMapId};
export type MicroEvent={kind:'gust'|'flutter'|'ripples'|'glint'|'window';at:IsoPoint;id:number};
export const ECOLOGY_CAPS={
 flora:18,wildlife:8,particleMotes:40,pondRipples:12,glowWindows:6,
 minUpdateMs:30,minAmbientGapMs:5600
} as const;
const TAU=Math.PI*2;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export function ecologyHash(a:number,b:number,salt=0):number{
 let x=Math.imul(a+413,374761393)^Math.imul(b+719,668265263)^Math.imul(salt+103,1274126177);
 x=Math.imul(x^(x>>>13),1274126177);
 return ((x^(x>>>16))>>>0)/4294967296;
}
const choices:Record<RescueMapId,readonly WildlifeKind[]>={
 morning_garden:['butterfly','sparrow','butterfly','rabbit','sparrow','butterfly','butterfly'],
 afternoon_meeting:['butterfly','sparrow','squirrel','butterfly','sparrow','rabbit','butterfly'],
 dusk_search:['moth','rabbit','owl','moth','fox','moth','owl'],
 night_neighborhood:['cat','moth','crow','cat','moth','crow']
};
const floraChoice:Record<RescueMapId,readonly FloraKind[]>={
 morning_garden:['blossom','wildflower','grass','willow','reed','wildflower'],
 afternoon_meeting:['blossom','wildflower','blossom','grass','wildflower'],
 dusk_search:['reed','ivy','grass','willow','blossom'],
 night_neighborhood:['ivy','grass','wildflower','ivy']
};
const sceneSalt:Record<RescueMapId,number>={
 morning_garden:12,afternoon_meeting:24,dusk_search:36,night_neighborhood:48
};
export function ecologySeeds(
 map:RescueMapId,minU:number,maxU:number,
 center:(u:number)=>number
):{flora:FloraSeed[];wildlife:WildlifeSeed[]}{
 const width=maxU-minU,salt=sceneSalt[map];
 const flora:FloraSeed[]=Array.from({length:ECOLOGY_CAPS.flora},(_,i)=>{
  const u=minU+.85+(width-1.7)*(i+.25+ecologyHash(i,salt,3)*.5)/ECOLOGY_CAPS.flora;
  const side=i%2?-1:1;
  const v=center(u)+side*(1.8+ecologyHash(i,salt,7)*1.55);
  return {id:i,p:{u,v},kind:floraChoice[map][i%floraChoice[map].length],
   phase:ecologyHash(i,salt,8)*TAU,size:.7+ecologyHash(i,salt,9)*.65};
 });
 const wildlife:WildlifeSeed[]=choices[map].map((kind,i)=>{
  const u=minU+1.15+(width-2.3)*(i+.5)/choices[map].length;
  const side=i%2?-1:1,offset=kind==='cat'||kind==='crow'?1.05:
   1.5+ecologyHash(i,salt,13)*1.6;
  const v=map==='night_neighborhood'?4.85+((i%3)-1)*.35:
   center(u)+side*offset;
  return {id:i,p:{u,v},kind,phase:ecologyHash(i,salt,11)*TAU,
   size:.85+ecologyHash(i,salt,17)*.32};
 });
 return {flora,wildlife};
}
export function ecologyFloraFrame(seed:FloraSeed,elapsed:number,player:IsoPoint,
 reduced=false):FloraFrame{
 const distance=Math.hypot(seed.p.u-player.u,seed.p.v-player.v);
 const reaction=clamp((2.9-distance)/2.9,0,1);
 const direction=player.v>seed.p.v?-1:1;
 const t=reduced?seed.phase:elapsed/1000;
 const breeze=reduced?0:Math.sin(t*.96+seed.phase)*2.4+
  Math.sin(t*.38+seed.id*.82)*1.2;
 return {
  sway:reduced?0:breeze*seed.size,
  lean:reduced?0:reaction*reaction*direction*6.4,
  open:.72+Math.sin(t*.52+seed.phase)*.12,
  glow:clamp(.15+reaction*.38,0,.53)
 };
}
export function ecologyWildlifeStep(
 seed:WildlifeSeed,state:WildlifeState,elapsed:number,
 deltaMs:number,player:IsoPoint,reduced=false
):{state:WildlifeState;frame:WildlifeFrame}{
 const distance=Math.hypot(seed.p.u-player.u,seed.p.v-player.v);
 const active=clamp((2.65-distance)/1.55,0,1);
 const dt=clamp(deltaMs,0,70)/1000;
 const smooth=1-Math.exp(-dt/(active>.02?.18:1.05));
 const alarm=clamp(state.alarm+(active-state.alarm)*smooth,0,1);
 // Once startled, a small animal flees to one side and returns naturally.
 // No on/off visibility or instant teleport when Kitty approaches.
 const sign=seed.id%2===0?1:-1;
 const t=reduced?seed.phase:elapsed/1000;
 const kind=seed.kind,fly=kind==='butterfly'||kind==='sparrow'||
  kind==='moth'||kind==='owl'||kind==='crow';
 const wandering=reduced?0:Math.sin(t*(fly?.9:.32)+seed.phase)*8;
 const escape=alarm*(fly?34:22)*sign;
 const x=wandering+escape;
 const y=reduced?0:Math.cos(t*(fly?1.8:.48)+seed.phase)*(fly?5:1.4)-
  alarm*(fly?12:1.5);
 const bob=reduced?0:fly?Math.sin(t*3.7+seed.phase)*2.3:
  alarm>.18?Math.abs(Math.sin(t*5.5+seed.phase))*1.6:0;
 return {state:{alarm,heading:sign},frame:{
  x,y,lift:bob,wing:reduced?0:Math.sin(t*(kind==='butterfly'||kind==='moth'?15:8)+seed.phase),
  alert:alarm,flip:sign===-1
 }};
}
export function ecologyMicroEvent(
 map:RescueMapId,period:number,minU:number,maxU:number,
 center:(u:number)=>number
):MicroEvent{
 const salt=sceneSalt[map],type:MicroEvent['kind'][]=
  map==='morning_garden'?['flutter','ripples','gust']:
  map==='afternoon_meeting'?['flutter','gust','glint']:
  map==='dusk_search'?['gust','glint','ripples']:
  ['window','glint','gust'];
 const id=Math.max(0,Math.floor(period)),kind=type[(id+salt)%type.length];
 const u=minU+1+(maxU-minU-2)*ecologyHash(id,salt,33);
 return {kind,id,at:{u,v:center(u)+(ecologyHash(id,salt,39)>.5?1.7:-1.7)}};
}
export function ecologyAmbientCue(map:RescueMapId,
 elapsed:number,player:IsoPoint,
 minU:number,maxU:number,center:(u:number)=>number
):AmbientCue|null{
 if(elapsed<ECOLOGY_CAPS.minAmbientGapMs)return null;
 const tick=Math.floor(elapsed/ECOLOGY_CAPS.minAmbientGapMs);
 const salt=sceneSalt[map],pick=ecologyHash(tick,salt,40);
 let kind:AmbientKind;
 if(map==='morning_garden')kind=player.u>9.2&&player.u<16.8?'river':
  pick>.48?'birdsong':'breeze';
 else if(map==='afternoon_meeting')kind=pick>.34?'birdsong':'breeze';
 else if(map==='dusk_search')kind=pick>.30?'insects':'breeze';
 else kind=pick>.58?'distant-engine':pick>.2?'night-breeze':'insects';
 const x=minU+(maxU-minU)*ecologyHash(tick,salt,47);
 const aim={u:x,v:center(x)};
 return {kind,pan:clamp(((aim.u-aim.v)-(player.u-player.v))/9,-.85,.85),
  scene:map};
}
export function ecologyIsFrozen(phase:string):boolean{
 return phase==='paused'||phase==='transition'||phase==='destroyed';
}
