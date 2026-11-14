/**
 * A scripted, deterministic camera arrival reconstructed from the supplied
 * 23-second reference video (roughly 2.65–7.2s).
 *
 * 0–1.1s  Stars fall into the lens while the camera descends.
 * 1.1–2.2s  They twist into a rotating tunnel; camera approaches the center.
 * 2.2–3.45s  A tiny hot-pink ring opens into the spiral galaxy.
 * 3.1–4.85s  Stars climb out of the center and form a tall heart.
 * 4.7–6.65s  Camera flies closer; orbiting phrases fade in.
 * >6.65s  Camera becomes interactive, with no scene/renderer restart.
 */
export const GALAXY_ARRIVAL_SECONDS=6.65;

export type GalaxyArrivalStage=
 | 'descent'|'star-tunnel'|'approach'|'unfold'|'heart-rise'|'camera-reveal'|'explore';

export interface GalaxyArrivalFrame{
 stage:GalaxyArrivalStage;
 descent:number;
 tunnel:number;
 approach:number;
 unfold:number;
 heart:number;
 phrases:number;
 reveal:number;
 worldBlend:number;
 yaw:number;
 pitch:number;
 zoom:number;
 focusY:number;
 spin:number;
 completed:boolean;
}

export function galaxyEase(x:number):number {
 const t=Math.max(0,Math.min(1,x));
 return t*t*(3-2*t);
}
function ramp(seconds:number,start:number,duration:number):number {
 return galaxyEase((seconds-start)/duration);
}

/** Absolute time → scene state; no React renders required for animation. */
export function galaxyArrivalAt(seconds:number,reduceMotion=false):GalaxyArrivalFrame{
 const t=reduceMotion?GALAXY_ARRIVAL_SECONDS:Math.max(0,seconds);
 const descent=ramp(t,0,1.28);
 const tunnel=ramp(t,.34,1.58);
 const approach=ramp(t,1.03,2.23);
 const unfold=ramp(t,2.00,1.46);
 const heart=ramp(t,3.02,1.70);
 const phrases=ramp(t,4.60,1.25);
 const reveal=ramp(t,4.36,2.18);
 const worldBlend=ramp(t,1.43,1.78);
 const stage:GalaxyArrivalStage=
  t<1.10?'descent':
  t<2.05?'star-tunnel':
  t<2.85?'approach':
  t<3.70?'unfold':
  t<4.85?'heart-rise':
  t<GALAXY_ARRIVAL_SECONDS?'camera-reveal':'explore';
 return {
  stage,descent,tunnel,approach,unfold,heart,phrases,reveal,worldBlend,
  yaw:-.88+.45*ramp(t,.1,2.35)+.26*ramp(t,2.3,2.1),
  // Tilts down into the disk, then lowers for the reveal.
  pitch:.22+.82*descent-.51*ramp(t,2.0,2.4),
  zoom:.52+.19*descent+.36*approach+.27*reveal,
  focusY:.19+.18*descent+.19*approach,
  spin:t*(1.85-.52*approach),
  completed:t>=GALAXY_ARRIVAL_SECONDS
 };
}
