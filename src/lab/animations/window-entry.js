import {setJoint} from '../character-rig.js';
import {curve,ease,feet} from './pose-tools.js';
const clamp=t=>Math.max(0,Math.min(1,Number(t)||0));
// Normalized choreography shared by the body, camera and contact cues.
// Grip anchors remain stationary during the failed push and recovery.
export const WINDOW_BEATS=Object.freeze({
 approach:0,reach:.12,grip:.27,firstPush:.36,slip:.45,
 recovery:.53,secondPush:.61,straddle:.70,descent:.80,contact:.87,settle:1
});
export function windowEntryHands(progress){
 const t=clamp(progress);
 if(t<=.12||t>=.88)return null;
 const hand=(side,start,release)=>{
  if(t<=start||t>=release+.10)return null;
  const reach=ease((t-start)/.14),leave=ease((t-release)/.10);
  const strain=curve([[0,0],[.34,0],[.45,1],[.54,.35],[.65,.75],[.74,0],[1,0]],t);
  return {x:2.205+side*(.475-.045*leave),y:.76+.24*reach-.15*leave,
   z:12.3-.18*reach-.20*leave,curl:reach*(1-leave)*(.60+.35*strain),flex:.12*strain};
 };
 return [hand(-1,.12,.73),hand(1,.16,.78)];
}
// Pose offsets are in actor space, not gameplay coordinates. Author the
// weight transfer independently of the wrists so the limbs do not all
// start/stop in unison. No rig, mesh or collision changes.
const channel=(t,keys)=>curve([[0,0],...keys,[1,0]],t);
export function sampleWindowEntry(progress,out){
 out.fill(0);const t=clamp(progress);
 if(t===0||t===1)return out;
 const lift=channel(t,[[.25,0],[.32,-.045],[.39,.13],[.46,-.045],[.53,-.075],[.65,.34],[.73,.31],[.82,.15],[.87,-.065],[.92,-.035]]);
 const shift=channel(t,[[.24,-.025],[.39,-.055],[.46,.035],[.54,-.035],[.67,.055],[.77,.035],[.88,-.02],[.94,0]]);
 const advance=channel(t,[[.27,0],[.39,.025],[.46,-.04],[.53,-.025],[.67,.12],[.77,.14],[.87,0],[.94,0]]);
 const leftLift=channel(t,[[.29,0],[.37,.13],[.46,.015],[.54,.04],[.66,.22],[.76,.12],[.87,0],[.94,0]]);
 const rightLift=channel(t,[[.36,0],[.44,.07],[.50,.015],[.63,.06],[.71,.19],[.80,.10],[.88,0],[.94,0]]);
 const leftTravel=channel(t,[[.28,0],[.39,.12],[.46,-.045],[.53,0],[.67,.15],[.77,.12],[.87,0],[.94,0]]);
 const rightTravel=channel(t,[[.34,0],[.44,-.035],[.54,0],[.70,.12],[.81,.08],[.88,0],[.94,0]]);
 feet(out,{x:shift,y:lift,z:advance,
  left:[-.16,.11+Math.max(0,lift)+leftLift,.005+advance+leftTravel],
  right:[.16,.11+Math.max(0,lift)+rightLift,.005+advance+rightTravel],
  leftTilt:channel(t,[[.36,-.25],[.46,.25],[.67,-.30],[.87,.12],[.94,0]]),
  rightTilt:channel(t,[[.44,.28],[.70,-.25],[.88,.12],[.94,0]])});
 const grip=channel(t,[[.12,0],[.28,1],[.46,1],[.58,1],[.72,.90],[.81,.35],[.90,0]]);
 const rightGrip=channel(t,[[.16,0],[.31,1],[.47,.93],[.60,1],[.74,.90],[.83,.25],[.92,0]]);
 const strain=channel(t,[[.28,0],[.39,.65],[.46,.18],[.53,.35],[.64,1],[.74,.25],[.86,.5],[.94,0]]);
 const slip=channel(t,[[.39,0],[.45,1],[.54,0]]);
 const landing=channel(t,[[.80,0],[.87,1],[.95,0]]);
 setJoint(out,'body',-.16*strain+.12*slip+.24*landing,.16*shift,-.55*shift,0,-.025*strain,0);
 setJoint(out,'head',.14*strain-.16*slip-.10*landing,.045*slip,.055*slip);
 setJoint(out,'leftArm',-2.15*grip+.22*strain,0,-.11*grip);
 setJoint(out,'rightArm',.30*rightGrip-.30*strain,0,.10*rightGrip);
 setJoint(out,'leftForearm',-.26*grip-.34*strain);
 setJoint(out,'rightForearm',-.18*rightGrip-.30*strain);
 setJoint(out,'leftHand',.20*grip,0,.08*grip);
 setJoint(out,'rightHand',-.17*rightGrip,0,-.07*rightGrip);
 return out;
}
