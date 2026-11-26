// Deterministic first-person director for the final porch encounter.
// Uses the actual doorway and the existing Louis/Emy/pursuer rigs.
// Independent of DOM, input, puzzle flags and rendering.
const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const ease=n=>{const t=clamp(n);return t*t*t*(10+t*(-15+6*t));};
const mix=(a,b,t)=>a+(b-a)*t;
const turn=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
export const FINALE_BEATS=Object.freeze({noise:.28,turnStart:.36,turnEnd:1.32,grab:1.05,leap:1.45,release:2.36,lookOut:3.08,run:3.78,finish:7.78});
export function finaleStage(shot,enemy,reduced=false,emy=null){
 const t=Math.max(0,shot.elapsed),start=shot.kitty.from,origin=shot.camera;
 const b=FINALE_BEATS;
 const backing=ease(t/1.12),release=ease((t-b.release)/.68),run=ease((t-b.run)/(b.finish-b.run));
 // Stay on the exterior side of the south wall. Use the real initial
 // camera and take a step onto the path so both figures fit the frame.
 const stop={x:mix(start.x,5.72,.45),z:Math.max(14.65,start.z+2.13)};
 const exit={x:5.9,z:Math.max(16.65,stop.z+1.9)};
 const x=mix(mix(origin.x,stop.x,backing),exit.x,run);
 const z=mix(mix(origin.z,stop.z,backing),exit.z,run);
 const impact=ease((t-2.08)/.12)*(1-ease((t-2.20)/.48));
 const y=mix(origin.y,1.63,backing)-(reduced?0:.035*impact);
 const struggle=ease((t-b.grab)/.25)*(1-ease((t-b.release)/.28));
 const sway=reduced?0:Math.sin((t-b.grab)*12)*.045*struggle;
 const captive={x:mix(enemy.x-.05+sway,start.x-.25,release),
  z:mix(enemy.z+.44,start.z+1.4,release)};
 const louis={x:mix(captive.x,exit.x+.42,run),y:0,z:mix(captive.z,exit.z-.42,run),
  yaw:turn(-.28*struggle+.20*release*(1-run),0,run),crouch:.22*(1-release)*ease(t/.68)+.09*struggle,speed:run>0&&run<1?2.15:release>0&&release<1?.65*Math.sin(Math.PI*release):0,
  walk:shot.louisStride+release*.8+run*2.8,
  visualReaction:t<b.run?{type:'finale-captive',age:t,duration:b.run}:null};
 const target={x:(enemy.x+louis.x)*.5,y:1.32,z:(enemy.z+louis.z)*.5};
 // Let the framing acknowledge Emy's approach and leap without losing
 // the captive or rotating away from the real porch encounter.
 const witness=emy&&!emy.hidden ? .28*ease((t-1.02)/.35)*(1-ease((t-2.10)/.52)) : 0;
 if(witness>0){target.x=mix(target.x,emy.x,witness);target.y=mix(target.y,emy.y+.43,witness);target.z=mix(target.z,emy.z,witness);}
 const toward=Math.atan2(target.x-x,target.z-z),tilt=Math.atan2(target.y-y,Math.max(.1,Math.hypot(target.x-x,target.z-z)));
 const reveal=reduced?Number(t>=b.turnEnd):ease((t-b.turnStart)/(b.turnEnd-b.turnStart));
 const leave=reduced?Number(t>=b.run):ease((t-b.lookOut)/(b.run-b.lookOut));
 // Choose a continuous angular branch around the back of the porch, not
 // a different shortest arc on every frame. Crossing ±π otherwise flips
 // the interpolated view while Kitty is still turning toward the rescue.
 const back=turn(origin.yaw,Math.PI,1),targetYaw=turn(back,toward,1);
 const facing=mix(origin.yaw,targetYaw,reveal),outward=turn(origin.yaw,0,1);
 const view={x,y,z,yaw:mix(facing,outward,leave),pitch:mix(mix(origin.pitch,tilt,reveal),-.28,leave)+(reduced?0:.045*impact)};
 return {view,louis,stage:t<b.turnStart?'noise':t<b.turnEnd?'turn':t<b.leap?'grab':t<b.release?'intervention':t<b.run?'release':'run'};
}
export function finaleThreat(actor,elapsed,reduced=false){
 const morph=ease((elapsed-.90)/.76),recoil=ease((elapsed-2.08)/.15)*(1-ease((elapsed-2.30)/.82)),release=ease((elapsed-2.15)/.55);
 const reach=ease((elapsed-.38)/.63)*(1-release);
 const face=morph*(1-ease((elapsed-2.52)/.92));
 const relax=ease((elapsed-2.70)/.65);
 // Keep the capture mesh during the recoil/morph transition but drive a
 // dedicated skeletal impact rather than the previous perpetual grab.
 return {...actor,captureReach:reach,captureLift:.12*reach+(reduced?0:.025*Math.sin(elapsed*11)*reach),finaleImpact:recoil,finalePose:ease(elapsed/.35)*(1-relax),
  captureFace:{left:.44*face,right:.32*face,upper:.19*face,jaw:.34*face,bite:0,
   twitch:reduced?0:Math.sin(elapsed*17)*face*.35,glance:0,gaze:{x:0,y:1.73,z:.50},clamp:0,
   pressure:.18*face,strain:.28*face,blink:0,rupture:0},
  mode:actor.mode};
}

// Until the safe garden, Emy guides the escape. At sunrise she doubles back
// to a point just ahead and beside Kitty, within the existing exterior lane.
// The same navigator still controls the actual motion.
export function finaleEmyGoal(player){
 const rejoin=player.z>=17.7&&player.x>3.8&&player.x<8.0;
 return rejoin?{x:clamp(player.x+.55*Math.tanh((5.9-player.x)*2.4),4.1,7.7),z:clamp(player.z+.62,18.0,20.0),rejoin}
  :{x:5.38,z:Math.max(17.05,Math.min(20.0,player.z+2.4)),rejoin};
}

// Weather follows spatial escape progress, not a timeout that would let dawn
// finish while the player stands still. Pure input, no particle simulation.
// Lighting and lens use the same clock as the actions, never wall time.
// Existing shader uniforms only: no extra lights, passes or draw calls.
export function finaleLighting(elapsed,reduced=false,basis=null){
 const t=Math.max(0,elapsed||0),reveal=ease((t-.36)/.96),exit=ease((t-2.62)/1.16);
 const focus=t>=FINALE_BEATS.run?0:clamp(reveal*(1-exit));
 const base=.22*ease(t/.36),directed=[-.40,.80,.42];
 // Match the shader's default camera-relative key at both ends. No light
 // direction jump when the renderer stops using the cinematic override.
 const normal=basis?basis.forward.map((v,i)=>-.61*v-.40*basis.right[i]+.74*basis.up[i]):directed;
 const key=normal.map((v,i)=>mix(v,directed[i],focus));
 return {room:base+.11*focus,pursuer:base+.39*focus,
  projection:1-(reduced?0:.09*focus),key};
}
export function finaleWeather(shot,player){
 const dawn=shot?.playable?mix(.13,1,ease((player.z-14.65)/3.05)):.13*ease(((shot?.elapsed??0)-3.08)/.70);
 return {dawn,rain:.78*(1-dawn),sky:[mix(.018,.55,dawn),mix(.024,.48,dawn),mix(.046,.52,dawn)]};
}
