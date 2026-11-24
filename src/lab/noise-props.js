// Lightweight, deterministic noise props. Shares the existing dynamic house geometry.
import {blocked,groundHeight} from './world.js';
const SPECS=[
 ['glass-living','Vaso',1.52,.96,8.98,0,'glass'],
 ['plate-living','Plato',2.55,.96,9.0,0,'plate'],
 ['glass-kitchen','Vaso',9.22,1.00,2.30,0,'glass'],
 ['plate-kitchen','Plato',9.72,1.00,2.75,0,'plate'],
 ['cup-study','Taza',3.16,.87,2.15,0,'cup'],
 ['cup-reading','Taza',1.69,4.13,7.98,3.15,'cup']
];
export function installNoiseProps(world){
 const props=[];
 for(const [id,label,x,y,z,floor,form] of SPECS){
  const size=form==='plate'?[.25,.027,.25]:form==='glass'?[.105,.18,.105]:[.13,.12,.13];
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
  const evadeCat=emy&&!emy.hidden&&Math.abs(emy.x-prop.x)<.32&&Math.abs(emy.z-prop.z)<.32&&Math.abs(emy.y+.30-prop.y)<.55;
  if(evadeCat){emy.yaw+=Math.PI*.35;emy.reaction=0;cues.push('evade');}
  const base=groundHeight(prop.x,prop.z,prop.floor,world.hatch?.amount>.92);
  const wall=blocked(world.boxes,prop.x,Number.isFinite(base)?base:prop.floor,prop.z,.08,.2);
  const landed=!Number.isFinite(base)||prop.y<=base+.055||wall||f.ttl<=0||hitEnemy||evadeCat;
  if(landed){
   prop.x=wall?prev.x:prop.x;prop.z=wall?prev.z:prop.z;
   prop.y=Number.isFinite(base)?base+.055:prev.y;
   prop.flight=null;prop.spent=true;prop.interactable=false;
   if(hitEnemy)pursuer.stun(2.0);
   else pursuer?.hearNoise({x:prop.x,y:Number.isFinite(base)?base:prop.floor,z:prop.z},hitEnemy?3:1.3);
   cues.push(hitEnemy?'stun':evadeCat?'evade':'impact');
  }
  Object.assign(prop.box,{x:prop.x,y:prop.y,z:prop.z,roll:prop.flight?prop.box.roll+step*9:1.2,pitch:prop.flight?prop.box.pitch+step*8:0});
 }
 return cues;
}
