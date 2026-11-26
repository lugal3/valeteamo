import {setJoint} from '../character-rig.js';
import {feet,arm,curve,ease} from './pose-tools.js';
import {HOP_DURATION,HOP_COOLDOWN,hopOffset} from '../hud-context.js';

// Render-only pose. The physics capsule and the world position never move.
// Compress before takeoff, tuck both feet in the air, extend for contact,
// then absorb the landing without introducing a second bounce.
export function hopPose(age,reduced=false){
 const t=Math.max(0,Math.min(1,age/HOP_DURATION));
 const active=Number.isFinite(age)&&age>=0&&age<HOP_COOLDOWN;
 const squash=active&&!reduced?curve([[0,0],[.13,.047],[.31,0],[.80,0],[1,.032]],t)*(1-ease((age-HOP_DURATION)/.17)):0;
 const lift=active?hopOffset(age,reduced):0;
 const tuck=active&&!reduced?Math.sin(Math.PI*t)**2*.047:0;
 return {lift,squash,tuck,reach:active&&!reduced?Math.sin(Math.PI*t)**2:0,weight:active&&!reduced?ease(age/.055)*(1-ease((age-HOP_DURATION)/.18)):0};
}
export function sampleHop(age,out,{reduced=false,handsFree=false}={}){
 out.fill(0);
 const p=hopPose(age,reduced),y=p.lift-p.squash;
 feet(out,{y,left:[-.16,.11+p.lift+p.tuck,.005+.04*p.reach],right:[.16,.11+p.lift+p.tuck,.005-.025*p.reach],leftTilt:-.25*p.reach,rightTilt:-.18*p.reach});
 setJoint(out,'body',.12*p.reach-.06*p.squash/.047,0,0);
 setJoint(out,'head',-.09*p.reach,0,.025*p.reach);
 arm(out,'left',[-.40,.54+.16*p.reach,.07+.12*p.reach],[.15*p.reach,0,.12]);
 if(handsFree)arm(out,'right',[.39,.54+.14*p.reach,.07+.1*p.reach],[.13*p.reach,0,-.12]);
 return out;
}
