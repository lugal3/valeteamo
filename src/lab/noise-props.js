// Lightweight, deterministic noise props. Shares the existing dynamic house geometry.
import {blocked,groundHeight,segmentHitsBox} from './world.js';
const SPECS=[
 ['glass-living','Vaso',2.45,.995,8.79,0,'glass'],
 ['plate-living','Plato',2.48,.95,9.43,0,'plate'],
 ['glass-kitchen','Vaso',13.60,1.10,2.64,0,'glass'],
 ['plate-kitchen','Plato',10.97,1.13,3.66,0,'plate'],
 ['cup-study','Taza',3.10,.965,4.14,0,'cup'],
 ['cup-reading','Taza',2.15,4.13,7.92,3.15,'cup']
];
export function installNoiseProps(world){
 const props=[];
 for(const [id,label,x,y,z,floor,form] of SPECS){
  const size=form==='plate'?[.22,.027,.22]:form==='glass'?[.105,.18,.105]:[.13,.12,.13];
  const box={id:'noise-'+id,x,y,z,w:size[0],h:size[1],d:size[2],mat:form==='glass'?'glass':'cream',solid:false,dynamic:true,
   shape:form==='plate'?'round':'lathe',segments:12,color:form==='glass'?[.70,.87,.93]:[.94,.86,.79]};
  world.boxes.push(box);
  const prop={id:'noise-'+id,kind:'noise-prop',label:'Recoger '+label.toLowerCase(),x,y,z,floor,box,form,held:false,flight:null,spent:false};
  world.objects.push(prop);props.push(prop);
 }
 return props;
}
export function grabNoiseProp(prop){
 if(!prop||prop.spent||prop.flight)return false;
 prop.held=true;prop.interactable=false;return true;
}
export function holdNoiseProp(prop,camera){
 if(!prop?.held)return;
 prop.x=camera.x+Math.sin(camera.yaw)*.52+Math.cos(camera.yaw)*.16;
 prop.y=camera.y-.32;
 prop.z=camera.z+Math.cos(camera.yaw)*.52-Math.sin(camera.yaw)*.16;
 Object.assign(prop.box,{x:prop.x,y:prop.y,z:prop.z,roll:.22,pitch:.05});
}
export function releaseNoiseProp(prop,camera,throwing=true){
 if(!prop?.held)return false;
 prop.held=false;
 const speed=throwing?7:1.2;
 prop.flight={vx:Math.sin(camera.yaw)*speed,vy:throwing?2.4:0,vz:Math.cos(camera.yaw)*speed,ttl:2.2};
 return true;
}
export function stepNoiseProps(props,dt,world,pursuer,emy){
 const cues=[];
 for(const prop of props){
  if(!prop.flight)continue;
  const f=prop.flight,step=Math.min(.055,Math.max(0,dt));f.ttl-=step;
  const prev={x:prop.x,y:prop.y,z:prop.z};
  f.vy-=9.8*step;prop.x+=f.vx*step;prop.y+=f.vy*step;prop.z+=f.vz*step;
  const hitEnemy=pursuer?.active&&Math.abs(pursuer.x-prop.x)<.5&&Math.abs(pursuer.z-prop.z)<.5&&
   prop.y>pursuer.y+.2&&prop.y<pursuer.y+2;
  const nearCat=emy&&!emy.hidden&&!f.dodged&&Math.abs(emy.x-prop.x)<.48&&Math.abs(emy.z-prop.z)<.48&&Math.abs(emy.y+.35-prop.y)<.60;
  if(nearCat){
   // Real sideways dodge to an unblocked spot; projectile keeps flying.
   const lateral=Math.atan2(f.vx,f.vz)+Math.PI/2;
   for(const side of [1,-1]){
    const nx=emy.x+Math.sin(lateral)*side*.62,nz=emy.z+Math.cos(lateral)*side*.62;
    const floor=groundHeight(nx,nz,emy.y,world.hatch?.amount>.92);
    if(Number.isFinite(floor)&&Math.abs(floor-emy.y)<.25&&!blocked(world.boxes,nx,floor,nz,.20,.62)){
     Object.assign(emy,{x:nx,y:floor,z:nz,yaw:lateral+side*Math.PI/2,reaction:0,dodgeTime:.65});
     f.dodged=true;cues.push({kind:'evade',at:{x:nx,y:floor,z:nz}});break;
    }
   }
  }
  const base=groundHeight(prop.x,prop.z,prop.floor,world.hatch?.amount>.92);
  // Swept segment against solid furniture and walls: objects no longer pass
  // through tabletops or barriers simply because the floor is lower.
  const hitSurface=world.boxes.some(box=>box.solid&&
   Math.abs(box.x-(prev.x+prop.x)*.5)<box.w/2+.6&&
   Math.abs(box.z-(prev.z+prop.z)*.5)<box.d/2+.6&&
   Math.abs(box.y-(prev.y+prop.y)*.5)<box.h/2+.6&&
   segmentHitsBox(prev,prop,box,.035));
  const landed=!Number.isFinite(base)||prop.y<=base+.055||hitSurface||f.ttl<=0||hitEnemy;
  if(landed){
   prop.x=hitSurface?prev.x:prop.x;prop.z=hitSurface?prev.z:prop.z;
   prop.y=hitSurface?prev.y:Number.isFinite(base)?base+.055:prev.y;
   prop.flight=null;prop.spent=true;prop.interactable=false;
   if(hitEnemy)pursuer.stun(2.0);
   else pursuer?.hearNoise({x:prop.x,y:Number.isFinite(base)?base:prop.floor,z:prop.z},1.3);
   cues.push({kind:hitEnemy?'stun':'impact',at:{x:prop.x,y:prop.y,z:prop.z}});
  }
  Object.assign(prop.box,{x:prop.x,y:prop.y,z:prop.z,roll:prop.flight?prop.box.roll+step*9:1.2,pitch:prop.flight?prop.box.pitch+step*8:0});
 }
 return cues;
}
