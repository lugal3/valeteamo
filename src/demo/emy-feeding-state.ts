// Coordinates are relative to the fixed cat stage, independent of viewport size.
export const EMY_MOUTH={x:.49,y:.375};
export const EMY_FEED_SECONDS=7.5;
export function churuInReach(x:number,y:number){
 return Number.isFinite(x)&&Number.isFinite(y)&&Math.hypot((x-EMY_MOUTH.x)*1.15,y-EMY_MOUTH.y)<.075;
}
export function advanceEmyFeeding(progress:number,seconds:number,holding:boolean,x:number,y:number){
 const safe=Number.isFinite(progress)?Math.max(0,Math.min(100,progress)):0;
 return Math.min(100,safe+(holding&&churuInReach(x,y)&&Number.isFinite(seconds)?
  Math.max(0,Math.min(.1,seconds))*100/EMY_FEED_SECONDS:0));
}
