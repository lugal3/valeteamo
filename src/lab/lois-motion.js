// Visual state is independent of quest phase, so existing checkpoints and
// event timing remain compatible. Gait phase is measured in metres, not frames.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number.isFinite(n)?n:a));
const mix=(a,b,t)=>a+(b-a)*t;
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const smooth=(a,b,dt,response)=>mix(a,b,1-Math.exp(-Math.max(0,dt)*response));
export function advanceLoisMotion(actor,dt,before,kitty){
 const distance=Math.hypot(actor.x-before.x,actor.z-before.z);
 const raw=clamp(actor.speed,0,4),phase=actor.phase;
 const previous=actor.visualMotion;
 const speed=smooth(previous?.speed??0,Math.min(4,distance/Math.max(dt,.0001)),dt,distance>.001?10:7);
 const slope=smooth(previous?.slope??0,distance>.002?clamp((actor.y-before.y)/distance,-.8,.8):0,dt,8);
 const close=kitty&&Math.abs(kitty.y-actor.y)<.7&&Math.hypot(kitty.x-actor.x,kitty.z-actor.z)<3.2;
 const d=close?Math.max(.3,Math.hypot(kitty.x-actor.x,kitty.z-actor.z)):1;
 const desiredYaw=close&&phase==='follow'?-clamp(angle(actor.yaw,Math.atan2(kitty.x-actor.x,kitty.z-actor.z)),-.66,.66):0;
 const desiredPitch=close&&phase==='follow'?-clamp(Math.atan2(kitty.y+.96-actor.y-1.65,d),-.32,.32):0;
 actor.visualMotion={phase,rawSpeed:raw,speed,slope,lookYaw:smooth(previous?.lookYaw??0,desiredYaw,dt,5),
  lookPitch:smooth(previous?.lookPitch??0,desiredPitch,dt,5),attention:close&&phase==='follow'};
 return actor.visualMotion;
}
export function sampleLoisMotion(actor={},reduced=false){
 const phase=actor.phase||'follow',age=clamp(actor.age,0,1e6),raw=clamp(actor.speed,0,4);
 const live=actor.visualMotion?.phase===phase&&Math.abs(actor.visualMotion.rawSpeed-raw)<.001?actor.visualMotion:null;
 const speed=clamp(live?.speed??raw,0,4),slope=clamp(live?.slope??0,-.8,.8);
 const crouch=clamp(actor.crouch,0,1),mobile=phase==='climb'||phase==='follow';
 const weight=mobile?clamp(speed/1.65,0,1)*(reduced?.62:1)*(1-.7*crouch):0;
 const cycle=clamp(actor.walk,0,1e9)*(Math.PI*2/1.30),swing=Math.sin(cycle),stride=Math.cos(cycle)*weight;
 const leftLift=Math.max(0,-swing)*weight,rightLift=Math.max(0,swing)*weight;
 const speaking=actor.visualReaction?.type==='speak';
 const state=phase==='untying'?'restrained':phase==='hide'?'lowering':phase==='hidden'?'concealed':
  speaking?'speaking':phase==='climb'&&slope>.13?'ascending':crouch>.1?'rising':weight>.08?(speed>2.35?'hurried':'walking'):'watchful';
 const scan=reduced?0:(Math.sin(age*.93)+.28*Math.sin(age*1.91+.8))*.23;
 const focus=live?.attention?(actor.dialogueEngaged?1:.75):0;
 return {state,speed,slope,weight,stride,leftLift,rightLift,cycle,
  lookYaw:clamp((live?.lookYaw??0)*focus+scan*(1-focus)*(1-.65*weight),-.70,.70),
  lookPitch:clamp((live?.lookPitch??0)*focus+slope*.12,-.35,.35),
  sway:reduced?0:swing*.019*weight,
  counterTwist:swing*.10*weight,
  bob:reduced?0:(Math.abs(swing)*-.018+.011)*weight};
}
