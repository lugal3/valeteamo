/**
 * FRAME-STUDIED CINEMATIC ARRIVAL
 * Based on the 131 frame / 30 fps / 4.3667s user-supplied reference clip.
 * The actual animated example occupies the upper segment of that video;
 * subtitles, watermark, editor and platform chrome are NOT part of the effect.
 *
 * 0.00–0.23  Fade: first distant light points appear.
 * 0.23–1.32  Camera accelerates into a rotating, radial particle vortex.
 * 1.32–1.72  The vanishing point brightens; the lens approaches rapidly.
 * 1.72–2.28  The camera pitches across the nucleus; tunnel becomes spiral.
 * 2.28–3.21  A fountain of existing stardust rises as a tall heart.
 * 3.21–4.55  Camera eases out to reveal galaxy; phrases emerge gradually.
 *
 * This is a choreography, not a sequence of disconnected scene swaps.
 * It leaves the resulting interactive galaxy, colors and Phaser bridge intact.
 */
export const GALAXY_ARRIVAL_SECONDS=4.55;
export type GalaxyArrivalStage=
 | 'descent'|'star-tunnel'|'approach'|'unfold'|'heart-rise'|'camera-reveal'|'explore';
export interface GalaxyArrivalFrame {
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
 tunnelLens:number;
 travel:number;
 cinematicRoll:number;
 completed:boolean;
}
export function galaxyEase(x:number):number{
 const t=Math.max(0,Math.min(1,x));
 return t*t*(3-2*t);
}
export function galaxyEaseOut(x:number):number{
 const t=Math.max(0,Math.min(1,x));
 return 1-(1-t)*(1-t)*(1-t);
}
function ramp(t:number,start:number,duration:number):number{
 return galaxyEase((t-start)/duration);
}
function blend(a:number,b:number,f:number):number{return a+(b-a)*f;}

/** Absolute-time choreography; all parameters are deterministic and continuous. */
export function galaxyArrivalAt(seconds:number,reduceMotion=false):GalaxyArrivalFrame{
 const t=reduceMotion?GALAXY_ARRIVAL_SECONDS:Math.max(0,seconds);
 const descent=ramp(t,.03,.55);
 const tunnel=ramp(t,.10,.92);
 const approach=ramp(t,.83,.92);
 const unfold=ramp(t,1.40,.88);
 const heart=ramp(t,2.20,.99);
 const phrases=ramp(t,3.15,.95);
 const reveal=ramp(t,2.54,1.66);
 const worldBlend=ramp(t,1.33,1.03);

 // Strong, short dolly-in at the reference vortex climax, then smoothly
 // pull back to show the galaxy. Non-monotonic zoom is intentional.
 const dolly=ramp(t,.18,1.38);
 const settle=ramp(t,1.49,.94);
 const zoom=blend(blend(.45,1.56,dolly),1.15,settle)+.15*reveal;
 const yaw=-1.15+.31*ramp(t,.24,1.16)+.36*ramp(t,1.38,.97)+.29*ramp(t,2.3,1.34);
 const pitch=.17+.51*ramp(t,.20,.98)+.57*ramp(t,1.28,.62)-.72*ramp(t,1.85,.70);
 const focusY=.22+.32*ramp(t,.24,.93)-.13*ramp(t,1.48,.85)+.13*reveal;

 // Zooming THROUGH the tunnel makes radial particles open up. Immediately
 // after the close pass the tunnel narrows and collapses into the disk.
 const tunnelLens=blend(blend(.43,1.21,ramp(t,.13,1.21)),.74,ramp(t,1.31,.74));
 const travel=.16*t+.28*t*t/(1+.42*t);
 const spin=1.45*t+2.30*ramp(t,.23,1.25)+.25*ramp(t,1.35,1.1);
 const cinematicRoll=.16*Math.sin(t*2.1)*Math.pow(1-worldBlend,2);

 const stage:GalaxyArrivalStage=
  t<.23?'descent':
  t<1.32?'star-tunnel':
  t<1.72?'approach':
  t<2.28?'unfold':
  t<3.21?'heart-rise':
  t<GALAXY_ARRIVAL_SECONDS?'camera-reveal':'explore';
 return {
  stage,descent,tunnel,approach,unfold,heart,phrases,reveal,worldBlend,
  yaw,pitch,zoom,focusY,spin,tunnelLens,travel,cinematicRoll,
  completed:t>=GALAXY_ARRIVAL_SECONDS
 };
}
export function galaxyPinchZoom(initialZoom:number,initialDistance:number,newDistance:number):number{
 const ratio=Math.max(1,newDistance)/Math.max(1,initialDistance);
 return Math.max(.50,Math.min(2.65,initialZoom*ratio));
}
