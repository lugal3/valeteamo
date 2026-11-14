/** Gentle, non-uniform star currents for the tunnel.
 * The attractive PR #9 scattered radial fly-through is retained. Only
 * a majority of the existing particles are subtly pulled toward curved,
 * moving directions; the remaining dust stays free and organic.
 * No drawn spoke lines, no new particle system and no change to galaxy/heart.
 */
export const TUNNEL_STREAMS=16;
const TAU=Math.PI*2;
const smooth=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};

/** Subtle narrowing as the camera approaches: never collapse the tunnel. */
export function tunnelAperture(approach:number):number{
 return 1-.19*smooth(approach);
}

/** Snap a portion of the original angles toward soft perspective streams.
 * Math.round chooses the nearest lane for any angle, even angles >2π.
 * Star-specific jitter and the untouched background dust keep it natural.
 */
export function softFilamentAngle(
 originalAngle:number,
 seed:number,
 progress:number
):number{
 const sector=TAU/TUNNEL_STREAMS;
 const nearest=Math.round(originalAngle/sector)*sector;
 const alignment=seed>.18?.67:.04; // 82% faint directional currents + 18% free stars
 const current=smooth(progress);
 const offset=(nearest-originalAngle)*alignment*(.30+.70*current);
 const shimmer=.025*Math.sin(seed*21+current*2.8);
 return originalAngle+offset+shimmer;
}
