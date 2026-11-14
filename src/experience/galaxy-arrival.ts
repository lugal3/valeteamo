/**
 * A scripted, deterministic camera arrival reconstructed from the supplied
 * 23-second reference video (roughly 2.65–7.2s).
 *
 * 0–1.2s  First stars fall while the camera descends into the dark.
 * 1.2–3.3s  A full vortex of rotating, approaching lights surrounds the viewer.
 * 3.3–4.25s Camera advances through the tunnel into its pink nucleus.
 * 4.25–5.75s The tunnel particles UNFOLD into a galactic spiral (same particles).
 * 5.75–7.4s Rising stardust forms a heart above the nucleus.
 * 7.4–9.1s Camera reveals the whole galaxy; orbiting memories appear.
 * >9.1s  Interactive continuous canvas; pinch, drag and wheel available.
 */
export const GALAXY_ARRIVAL_SECONDS=9.1;

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
 const descent=ramp(t,0,2.0);
 const tunnel=ramp(t,.32,2.5);
 const approach=ramp(t,2.45,2.1);
 const unfold=ramp(t,3.95,1.85);
 const heart=ramp(t,5.55,1.8);
 const phrases=ramp(t,7.35,1.25);
 const reveal=ramp(t,7.0,2.0);
 const worldBlend=ramp(t,3.28,2.40);
 const stage:GalaxyArrivalStage=
  t<1.20?'descent':
  t<3.30?'star-tunnel':
  t<4.25?'approach':
  t<5.75?'unfold':
  t<7.40?'heart-rise':
  t<GALAXY_ARRIVAL_SECONDS?'camera-reveal':'explore';
 return {
  stage,descent,tunnel,approach,unfold,heart,phrases,reveal,worldBlend,
  yaw:-1.00+.52*ramp(t,.55,3.2)+.31*ramp(t,4.1,2.3),
  // Camera drops through the spiral tunnel, then levels above the galaxy.
  pitch:.16+.84*descent-.47*ramp(t,4.2,2.25),
  zoom:.44+.17*descent+.48*approach+.17*reveal,
  focusY:.18+.24*descent+.12*approach,
  spin:t*(2.0-.62*approach),
  completed:t>=GALAXY_ARRIVAL_SECONDS
 };
}

/** The same camera zoom limits are used for mouse wheels and finger pinches. */
export function galaxyPinchZoom(initialZoom:number,initialDistance:number,newDistance:number):number {
 const ratio=Math.max(1,newDistance)/Math.max(1,initialDistance);
 return Math.max(.50,Math.min(2.65,initialZoom*ratio));
}
