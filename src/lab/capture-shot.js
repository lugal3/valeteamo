export const CAPTURE_REVEAL = 1.62;
export const CAPTURE_BITE = 2.18;
export const CAPTURE_SECONDS = 2.97;

const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (start, end, time) => {
 const t = clamp((time - start) / (end - start));
 return t * t * (3 - 2 * t);
};

export function captureFrame(from, actor, time, reduced) {
 const dx = from.x - actor.x, dz = from.z - actor.z;
 const distance = Math.hypot(dx, dz);
 const facing = distance > .05 ? Math.atan2(dx, dz) : actor.facing;
 const reach = ease(0, .35, time);
 const lift = ease(.12, .79, time);
 const approach = ease(.57, 1.57, time);
 const bite = ease(CAPTURE_BITE, 2.46, time);
 const opening = ease(1.12, 1.98, time);
 const radius = mix(Math.max(.67, distance), .58, approach);
 const turn = ease(0, .44, time);
 const turnDelta = Math.atan2(Math.sin(facing + Math.PI - from.yaw), Math.cos(facing + Math.PI - from.yaw));
 const x = mix(from.x, actor.x + Math.sin(facing) * radius, reach);
 const z = mix(from.z, actor.z + Math.cos(facing) * radius, reach);
 const y = mix(from.y, actor.y + 1.62, lift) + Math.sin(Math.PI * lift) * .13;
 const shake = reduced ? 0 : Math.sin(time * 43) * (.022 * Math.sin(Math.PI * reach) + .035 * Math.sin(Math.PI * bite));
 const pitch = Math.atan2(actor.y + 1.65 - y, Math.hypot(actor.x - x, actor.z - z));
 const openingEdge = 1 + opening * 68;
 const point = (offset, height) => `calc(50% + ${offset * openingEdge}%) ${height}%`;
 const seam = [
  point(-.64, 0), point(-.52, 13), point(-.86, 30), point(-.71, 43),
  point(-1, 62), point(-.81, 78), point(-.64, 100), point(.78, 100),
  point(.57, 80), point(.91, 60), point(.66, 42), point(1, 26), point(.68, 13), point(.81, 0)
 ].join(', ');
 return {
  camera: {x, y, z, yaw: from.yaw + turnDelta * turn + shake, pitch: mix(from.pitch, pitch, turn) + shake},
  actor: {...actor, facing, speed: 0, captureReach: reach, captureLift: lift},
  grip: ease(0, .3, time),
  face: ease(1.12, 1.32, time),
  seal: `polygon(${seam})`,
  zoom: reduced ? 1 : 1 + opening * .05 + bite * 1.10,
  jaw: reduced ? 0 : bite,
  dark: ease(2.34, 2.58, time)
 };
}
