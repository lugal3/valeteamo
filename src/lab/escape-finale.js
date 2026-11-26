// Deterministic first-person director for the final porch encounter.
// Uses the actual doorway and the existing Louis/Emy/pursuer rigs.
// Independent of DOM, input, puzzle flags and rendering.
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const ease=n=>{const t=clamp(n);return t*t*t*(10+t*(-15+6*t));};
const mix=(a,b,t)=>a+(b-a)*t;
const turn=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export const FINALE_BEATS=Object.freeze({noise:.28,turnStart:.36,turnEnd:1.32,grab:1.05,leap:1.45,release:2.36,lookOut:3.08,run:3.78,finish:7.78});
export function finaleStage(shot,enemy,reduced=false){
 const t=Math.max(0,shot.elapsed),start=shot.kitty.from,origin=shot.camera;
 const b=FINALE_BEATS;
 const backing=ease(t/1.12),release=ease((t-b.release)/.68),run=ease((t-b.run)/(b.finish-b.run));
 // Stay on the exterior side of the south wall. Use the real initial
 // camera and take a step onto the path so both figures fit the frame.
 const stop={x:mix(start.x,5.72,.45),z:Math.max(14.65,start.z+2.13)};
 const exit={x:5.9,z:Math.max(16.65,stop.z+1.9)};
 const x=mix(mix(origin.x,stop.x,backing),exit.x,run);
 const z=mix(mix(origin.z,stop.z,backing),exit.z,run);
 const y=mix(origin.y,1.63,backing);
 const struggle=ease((t-b.grab)/.25)*(1-ease((t-b.release)/.28));
 const sway=reduced?0:Math.sin((t-b.grab)*12)*.045*struggle;
 const captive={x:mix(enemy.x-.05+sway,start.x-.25,release),
  z:mix(enemy.z+.44,start.z+1.4,release)};
 const louis={x:mix(captive.x,exit.x+.42,run),y:0,z:mix(captive.z,exit.z-.42,run),
  yaw:turn(0,0,run),crouch:.28*(1-release)+.09*struggle,speed:run>0&&run<1?2.15:release>0&&release<1?.65:0,
  walk:shot.louisStride+release*.8+run*2.8,
  visualReaction:t>=.68&&t<2.75?{type:'startle',age:t-.68,duration:2.07}:null};
 const target={x:(enemy.x+louis.x)*.5,y:1.32,z:(enemy.z+louis.z)*.5};
 const toward=Math.atan2(target.x-x,target.z-z),tilt=Math.atan2(target.y-y,Math.max(.1,Math.hypot(target.x-x,target.z-z)));
 const reveal=reduced?Number(t>=b.turnEnd):ease((t-b.turnStart)/(b.turnEnd-b.turnStart));
 const leave=reduced?Number(t>=b.run):ease((t-b.lookOut)/(b.run-b.lookOut));
 const facing=turn(origin.yaw,toward,reveal);
 const view={x,y,z,yaw:turn(facing,0,leave),pitch:mix(mix(origin.pitch,tilt,reveal),-.28,leave)};
 return {view,louis,stage:t<b.turnStart?'noise':t<b.turnEnd?'turn':t<b.leap?'grab':t<b.release?'intervention':t<b.run?'release':'run'};
}
export function finaleThreat(actor,elapsed,reduced=false){
 const morph=ease((elapsed-.90)/.76),recoil=ease((elapsed-2.08)/.42),release=ease((elapsed-2.15)/.55);
 const reach=ease((elapsed-.38)/.63)*(1-release);
 const face=morph*(1-ease((elapsed-2.52)/.92));
 return {...actor,captureReach:Math.max(.001,reach),captureLift:.12*reach+(reduced?0:.025*Math.sin(elapsed*11)*reach),
  captureFace:{left:.44*face,right:.32*face,upper:.19*face,jaw:.34*face,bite:0,
   twitch:reduced?0:Math.sin(elapsed*17)*face*.35,glance:0,gaze:0,clamp:0,
   pressure:.18*face,strain:.28*face,blink:0,rupture:0},
  mode:recoil>.5?'stunned':actor.mode};
}

// Weather follows spatial escape progress, not a timeout that would let dawn
// finish while the player stands still. Pure input, no particle simulation.
export function finaleWeather(shot,player){
 const dawn=shot?.playable?mix(.13,1,ease((player.z-14.65)/3.05)):0;
 return {dawn,rain:.78*(1-dawn),sky:[mix(.018,.55,dawn),mix(.024,.48,dawn),mix(.046,.52,dawn)]};
}
