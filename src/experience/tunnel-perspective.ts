/** Shared directional geometry for the birthday star fly-through.
 *
 * Each particle belongs to one of 28 slender, slightly curved streams aimed
 * at the same vanishing point. The advancing camera moves through the streams
 * while their aperture slowly contracts, as in the supplied short video.
 * After the approach the SAME particles blend into their galactic 3D slots.
 */
export const TUNNEL_STREAMS=28;
const TAU=Math.PI*2;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};

export interface TunnelPoint{
 x:number;y:number;angle:number;radius:number;aperture:number;depth:number;
}

/** Shrinks the field of visible streams as the lens approaches the nucleus. */
export function tunnelAperture(approach:number):number{
 return 1-.47*smooth(approach);
}

export function tunnelStreamPoint(
 lane:number,
 seed:number,
 depth:number,
 spin:number,
 approach:number,
 width:number,
 height:number
):TunnelPoint{
 const d=Math.max(0,Math.min(.99999,depth));
 const aperture=tunnelAperture(approach);
 const index=((lane%TUNNEL_STREAMS)+TUNNEL_STREAMS)%TUNNEL_STREAMS;
 const lanePhase=(index/TUNNEL_STREAMS)*TAU;
 // Shared lane heading makes stars draw coherent perspective ribbons.
 // A tiny deterministic angular variation prevents hard artificial spokes.
 const gentleTwist=.25*d + .075*Math.sin(d*5.4+index*.38);
 const variation=(seed-.5)*(.020+.055*d);
 const angle=lanePhase + spin*.21 + gentleTwist + variation;
 const depthScale=Math.pow(d,1.88);
 const radius=Math.max(width,height)*.78*(.004+depthScale*.93)*aperture;
 return {
  x:width*.5+Math.cos(angle)*radius,
  y:height*.505+Math.sin(angle)*radius*.90,
  angle,radius,aperture,depth:d
 };
}
