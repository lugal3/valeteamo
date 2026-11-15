import type {IsoPoint} from '../isometric';
import type {IsoStoryStage} from '../iso-game';
import type {AbductionPhase} from './abduction-van';

// Animation direction, non-blocking reaction bubbles and camera framing are
// pure and fully deterministic. The existing Phaser scene owns the sprites.
export type RescueEmotion='notice'|'affection'|'uneasy'|'fear'|'discover'|'farewell';
export type ReactionBubble={text:string;emotion:RescueEmotion;color:string;life:number};
export type ScreenPoint={x:number;y:number};
export const ACTING_LIMITS={
 maxBubbles:3,bubbleLifetimeMs:1200,
 focusMaxX:83,focusMaxY:45,
 lookSmoothingMs:300,focusReleaseMs:510,
 blinkPeriodMs:3580,blinkLengthMs:145
} as const;
const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
const ease=(v:number)=>{const t=clamp(v,0,1);return t*t*(3-2*t);};
export function storyBubble(kind:RescueEmotion):ReactionBubble{
 const data:Record<RescueEmotion,{text:string;color:string}>={
  notice:{text:'?',color:'#fff0da'},
  affection:{text:'♡',color:'#ffe0ed'},
  uneasy:{text:'…',color:'#e8d4f1'},
  fear:{text:'!',color:'#ffd1c6'},
  discover:{text:'✧',color:'#fff0b7'},
  farewell:{text:'♡',color:'#ffe0ed'}
 };
 return {...data[kind],emotion:kind,life:ACTING_LIMITS.bubbleLifetimeMs};
}
export function storyboardBeat(
 stage:IsoStoryStage,elapsed:number
):RescueEmotion|null{
 // One understated, non-blocking beat per dramatic moment. Dialogue is never
 // generated here and no story state advances as a consequence of an emote.
 if(elapsed<0)return null;
 if(stage==='talk-louis'&&elapsed>1200&&elapsed<1320)return 'uneasy';
 if(stage==='talk-luis'&&elapsed>1750&&elapsed<1880)return 'affection';
 if(stage==='walk-together'&&elapsed>2800&&elapsed<2920)return 'affection';
 if(stage==='ribbon'&&elapsed>400&&elapsed<520)return 'discover';
 if(stage==='petals'&&elapsed>550&&elapsed<670)return 'discover';
 if(stage==='wheel'&&elapsed>700&&elapsed<820)return 'uneasy';
 if(stage==='door'&&elapsed>500&&elapsed<620)return 'uneasy';
 if(stage==='window'&&elapsed>380&&elapsed<500)return 'discover';
 return null;
}
export function kidnappingReaction(
 phase:AbductionPhase,previous:AbductionPhase
):RescueEmotion|null{
 if(phase===previous)return null;
 if(phase==='doors')return 'notice';
 if(phase==='struggle')return 'fear';
 if(phase==='load')return 'fear';
 if(phase==='escape')return 'uneasy';
 return null;
}
export function storyActorFacing(dx:number,dy:number,
 previous:'up'|'down'|'left'|'right'='down'){
 if(Math.hypot(dx,dy)<2)return previous;
 return Math.abs(dx)>Math.abs(dy)*1.3?
  (dx<0?'left':'right'):(dy<0?'up':'down');
}
export function storyActorIdle(
 clock:number,reduced=false
):{frame:number;lean:number;breath:number}{
 if(reduced)return {frame:0,lean:0,breath:0};
 const phase=clock%ACTING_LIMITS.blinkPeriodMs;
 return {frame:phase>ACTING_LIMITS.blinkPeriodMs-ACTING_LIMITS.blinkLengthMs?5:0,
  lean:Math.sin(clock/990)*.65,
  breath:Math.sin(clock/610)*.003};
}
export function kidnappingFrameFocus(
 stage:IsoStoryStage,phase:AbductionPhase|undefined,
 elapsed:number,kitty:ScreenPoint,target:ScreenPoint,
 reduced=false
):ScreenPoint{
 if(reduced||stage!=='disappearance'||!phase||phase==='done')
  return {x:0,y:0};
 // Only a restrained camera drift. Never center on the distant street
 // and never drift during player-controlled exploration.
 const factor=phase==='arrival'?ease(elapsed/1400)*.38:
  phase==='doors'?.48:phase==='disembark'?.65:
  phase==='approach'?.77:phase==='struggle'?.94:
  phase==='load'?1:phase==='board'?.81:
  phase==='close'?.61:phase==='escape'?.4:0;
 return {
  x:clamp((target.x-kitty.x)*factor,-ACTING_LIMITS.focusMaxX,ACTING_LIMITS.focusMaxX),
  y:clamp((target.y-kitty.y)*factor,-ACTING_LIMITS.focusMaxY,ACTING_LIMITS.focusMaxY)
 };
}
export function smoothCinematicFocus(
 previous:ScreenPoint,target:ScreenPoint,dtMs:number,
 released=false
):ScreenPoint{
 const tau=released?ACTING_LIMITS.focusReleaseMs:ACTING_LIMITS.lookSmoothingMs;
 const a=1-Math.exp(-clamp(dtMs,0,70)/tau);
 const x=previous.x+(target.x-previous.x)*a,
  y=previous.y+(target.y-previous.y)*a;
 return Math.hypot(x,y)<.035&&Math.hypot(target.x,target.y)<.001?
  {x:0,y:0}:{x,y};
}
export function cinematicCuePosition(
 p:IsoPoint,offset:number
):IsoPoint{return {u:p.u,v:p.v+offset};}
