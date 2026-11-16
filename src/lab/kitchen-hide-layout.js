// Ground-floor kitchen: entry is at west wall (x=7.5,z=2.5).
// Turn the breakfast bar perpendicular to that entrance so its FRONT
// faces Kitty when she walks east. Louis must go around the NORTH end,
// then squat on the far/east side rather than clipping through the front.
export const KITCHEN_BAR=Object.freeze({
 x:11.03,z:2.55,depth:.76,length:2.56,top:1.10,
 frontX:10.65,backX:11.41,
 northEnd:1.27,southEnd:3.83
});
export const KITCHEN_HIDE_SPOT=Object.freeze({x:12.08,y:0,z:2.53,yaw:-Math.PI/2});
// Smooth, fully above-floor corridor on the north side of the bar. The
// kitchen divider is at z=4.4, so routing south is a dead end.
export const KITCHEN_HIDE_APPROACH=Object.freeze([
 {x:9.48,z:2.18},
 {x:9.86,z:1.50},
 {x:10.12,z:.90},
 {x:11.04,z:.80},
 {x:11.89,z:.82},
 {x:12.08,z:1.40},
 {x:12.08,z:2.00},
 {x:KITCHEN_HIDE_SPOT.x,z:KITCHEN_HIDE_SPOT.z}
].map(p=>Object.freeze(p)));
