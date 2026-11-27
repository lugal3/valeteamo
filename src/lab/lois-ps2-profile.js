// Lois (Louis in legacy engine identifiers): PS2 Option B visual CONTRACT.
// No texture downloads, renderer writes or DOM dependency. Phase 1 is deliberately
// non-rendering; the current model/poses stay active until the visual replacement passes QA.
const freezeDeep=value=>{
 if(value&&typeof value==='object'&&!Object.isFrozen(value)){
  for(const entry of Object.values(value))freezeDeep(entry);
  Object.freeze(value);
 }
 return value;
};
const clamp=(n,min,max)=>Math.min(max,Math.max(min,Number.isFinite(n)?n:min));
export const LOIS_VISUAL_ID='lois-ps2-b-v1';
export const LOIS_PS2_PROFILE=freezeDeep({
 id:LOIS_VISUAL_ID,
 actorKind:'louis-companion', // Existing save/cutscene key. Never rename during visual work.
 displayName:'Lois',
 reference:'Option A — approved photographic face and hair, low-poly rigged body',
 palette:{
  blazer:[.14,.16,.20],tshirt:[.85,.84,.82],trousers:[.17,.18,.22],
  shoes:[.11,.12,.14],hair:[.23,.15,.11],eyes:[.31,.51,.66],skin:[.85,.68,.57]
 },
 silhouette:{
  heightM:1.80,shoulderWidthM:.43,headWidthM:.34,
  description:'Slim adult, tousled swept chestnut fringe, blue eyes, light stubble, dark blazer'
 },
 atlas:{
  face:{mobile:512,desktop:1024,channels:4,uvSpace:'face-front-with-side-projection'},
  clothes:{mobile:256,desktop:512,channels:4,uvSpace:'body-clothing'},
  // UV maps and genuine photo textures will be created in later phases.
  colorSpace:'sRGB',gpuFormat:'RGBA8',mipmaps:false,wrap:'CLAMP_TO_EDGE'
 },
 meshLimits:{
  mobileTriangles:3500,desktopTriangles:6500,drawCalls:4,
  targetAnimationFps:60,
  note:'Only the approved Photo-A mesh; never instantiate a duplicate actor or renderer'
 },
 expressiveChannels:['blink','gazeYaw','gazePitch','jawOpen','browLift','fear','relief'],
 preservedPhases:['untying','climb','hide','hidden','follow']
});
// Parent-before-child, local pivots in metres above ground. The final skin will
// bind to this independent humanoid rig, not Kitty's head/proportion constants.
export const LOIS_RIG=freezeDeep([
 ['root',null,[0,0,0]],['pelvis','root',[0,.9,0]],
 ['spine','pelvis',[0,1.09,0]],['chest','spine',[0,1.39,0]],
 ['neck','chest',[0,1.58,0]],['head','neck',[0,1.66,0]],
 ['jaw','head',[0,1.55,.12]],['leftEyelid','head',[-.073,1.705,.16]],
 ['rightEyelid','head',[.073,1.705,.16]],
 ['leftShoulder','chest',[-.236,1.315,-.012]],['leftElbow','leftShoulder',[-.286,1.055,.005]],
 ['leftWrist','leftElbow',[-.308,.825,.045]],
 ['rightShoulder','chest',[.236,1.315,-.012]],['rightElbow','rightShoulder',[.286,1.055,.005]],
 ['rightWrist','rightElbow',[.308,.825,.045]],
 ['leftHip','pelvis',[-.115,.86,0]],['leftKnee','leftHip',[-.115,.47,.025]],
 ['leftAnkle','leftKnee',[-.115,.08,.045]],
 ['rightHip','pelvis',[.115,.86,0]],['rightKnee','rightHip',[.115,.47,.025]],
 ['rightAnkle','rightKnee',[.115,.08,.045]]
 ].map(([name,parent,pivot])=>({name,parent,pivot})));
const STAGES=new Set(LOIS_PS2_PROFILE.preservedPhases);
// Pure, deterministic adapter for the *existing* rescue state machine.
// Future bone animators sample this, instead of duplicating game events.
export function sampleLoisVisual(source={},reduced=false){
 const phase=STAGES.has(source.phase)?source.phase:'follow';
 const age=clamp(source.age,0,1e6),walk=clamp(source.walk,0,1e6);
 const speed=clamp(source.speed,0,4),crouch=clamp(source.crouch,0,1);
 const moving=(phase==='climb'||phase==='follow')&&speed>.05;
 const stride=moving?Math.sin(walk*7.2)*clamp(speed/1.75,0,1):0;
 const hiding=phase==='hide'||phase==='hidden';
 const fear=phase==='untying'?1:phase==='climb'?.72:hiding?.82:.20;
 const relief=phase==='follow'?.88:0;
 const blink=clamp(source.blink,0,1);
 return {
  id:LOIS_VISUAL_ID,phase,elapsed:age,
  root:{x:0,y:-.35*crouch,z:0,yaw:Number.isFinite(source.yaw)?source.yaw:0},
  chest:{breath:reduced?0:Math.sin(age*2.1)*.008,lean:phase==='climb'?.09:hiding?.18:0},
  head:{yaw:hiding&&!reduced?Math.sin(age*.83)*.16:0,pitch:phase==='untying'?-.15:0},
  limbs:{
   leftLeg:moving?stride*.32:0,rightLeg:moving?-stride*.32:0,
   leftArm:phase==='untying'?- .50:hiding?-.68:-stride*.28,
   rightArm:phase==='untying'?- .50:hiding?-.68:stride*.28
  },
  face:{blink,gazeYaw:0,gazePitch:0,jawOpen:0,browLift:fear*.16,fear,relief},
  posture:hiding?'concealed':phase==='untying'?'restrained':moving?'moving':'idle',
  reducedMotion:!!reduced
 };
}
