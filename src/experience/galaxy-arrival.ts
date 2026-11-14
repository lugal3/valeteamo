/**
 * A scripted, deterministic camera arrival reconstructed from the supplied
 * 23-second reference video (roughly 2.65–7.2s).
 *
 * 0–.7s    Dark star field; first particles fall past the descending camera.
 * .7–2.4s  Rapid travel through a rotating radial particle tunnel.
 * 2.4–3.1s Final approach to the tiny luminous galaxy nucleus.
 * 3.1–4.1s The same particles spiral outward to reveal the full galaxy.
 * 4.1–5.3s Particles rise from the core and form the tall pink heart.
 * 5.3–6.1s The reveal settles and the galaxy becomes explorable.
 * >6.1s   Pinch, drag, wheel and interactive heart available.
 */
export const GALAXY_ARRIVAL_SECONDS=6.1;

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
 const descent=ramp(t,0,1.15);
 const tunnel=ramp(t,.13,1.55);
 const approach=ramp(t,1.38,1.67);
 const unfold=ramp(t,2.53,1.62);
 const heart=ramp(t,3.90,1.30);
 const phrases=ramp(t,5.05,.85);
 const reveal=ramp(t,4.45,1.55);
 const worldBlend=ramp(t,2.26,1.85);
 const stage:GalaxyArrivalStage=
  t<.70?'descent':
  t<2.4?'star-tunnel':
  t<3.10?'approach':
  t<4.12?'unfold':
  t<5.30?'heart-rise':
  t<GALAXY_ARRIVAL_SECONDS?'camera-reveal':'explore';
 return {
  stage,descent,tunnel,approach,unfold,heart,phrases,reveal,worldBlend,
  yaw:-1.15+.62*ramp(t,.32,2.5)+.34*ramp(t,3.2,1.9),
  // Descend through the tunnel, level off over the newly formed disk.
  pitch:.17+.85*descent-.49*ramp(t,2.8,1.6),
  zoom:.45+.18*descent+.48*approach+.19*reveal,
  focusY:.22+.19*descent+.13*approach,
  spin:t*(2.7-.78*approach),
  completed:t>=GALAXY_ARRIVAL_SECONDS
 };
}

/** The same camera zoom limits are used for mouse wheels and finger pinches. */
export function galaxyPinchZoom(initialZoom:number,initialDistance:number,newDistance:number):number {
 const ratio=Math.max(1,newDistance)/Math.max(1,initialDistance);
 return Math.max(.50,Math.min(2.65,initialZoom*ratio));
}
