import {CUP_PROFILE} from './chibi-geometry.js';

const BULB_GLASS=[[-.5,0],[-.48,.31],[-.42,.61],[-.31,.85],[-.15,1],[.04,.97],[.22,.79],[.37,.56],[.5,.43],[.5,0]];
const BULB_SOCKET=[[-.5,.68],[-.48,1],[-.30,1],[.32,1],[.48,.94],[.5,.70]];
const MOUNT=[[-.5,.62],[-.46,.89],[-.30,1],[.48,1],[.5,0]];
const SHADE=CUP_PROFILE.map(([y,radius],i)=>[y,i===CUP_PROFILE.length-1?.98:radius]);

export function installHouseLights(add,obj,height){
 const circuits=[],fixtures=[],power={on:true};
 function circuit(id,room,mounts,switches,on=false){
  const state={id,room,on,supply:power,switches:[]};circuits.push(state);
  for(const [x,floor,z,drop=.37] of mounts){
   const id='fixture-'+fixtures.length,ceiling=floor===0?height-.22:6.26,y=ceiling-drop;
   const fixture={x,y:y-.153,z,tile:fixtures.length+1,circuit:state};fixtures.push(fixture);
   add(id+'-mount',x,ceiling-.035,z,.25,.07,.25,'torchmetal',false,{shape:'lathe',profile:MOUNT,segments:12,color:[.33,.28,.32]});
   add(id+'-cord',x,(ceiling+y)/2,z,.027,drop,.027,'dark',false);
   add(id+'-shade',x,y+.084,z,.37,.15,.37,'brass',false,{shape:'lathe',profile:SHADE,pitch:Math.PI,segments:16,color:[.60,.42,.24]});
   add(id+'-shade-rim',x,y+.013,z,.365,.013,.365,'brass',false,{shape:'torus',majorRadius:.174,tubeRadius:.007,pitch:Math.PI/2,segments:14});
   add(id+'-socket',x,y+.006,z,.101,.087,.101,'torchmetal',false,{shape:'lathe',profile:BULB_SOCKET,segments:12,color:[.43,.39,.36]});
   for(let n=0;n<3;n++)add(id+'-thread-'+n,x,y-.030+n*.021,z,.106,.012,.106,'brass',false,{shape:'lathe',profile:MOUNT,segments:10,color:[.58,.49,.39]});
   add(id+'-bulb',x,y-.103,z,.168,.171,.168,'glass',false,{shape:'lathe',profile:BULB_GLASS,segments:16,dynamic:true,color:[1,.91,.74],fixture});
  }
  for(const [x,floor,z,axis,side] of switches){
   const id='switch-'+state.id+(state.switches.length?'-'+state.switches.length:''),y=floor+1.26;
   const flat=axis==='x',dx=flat?side*.035:0,dz=flat?0:side*.035;
   const plate=(part,scale,py,width,height,depth,mat,extra={})=>add(id+'-'+part,x+dx*scale,py,z+dz*scale,flat?depth:width,height,flat?width:depth,mat,false,extra);
   plate('frame',0,y,.145,.218,.035,'brass',{shape:'rounded-box',roundness:.19,color:[.61,.48,.34]});
   plate('plate',.54,y,.124,.191,.018,'cream',{shape:'rounded-box',roundness:.18,surface:'glaze'});
   plate('socket',.84,y,.076,.120,.014,'dark');
   const rocker=plate('rocker',1.18,y+(on?.024:-.024),.056,.071,.020,'torchmetal',{dynamic:true,shape:'rounded-box',roundness:.18});
   for(const side of [-1,1])plate('screw-'+side,.87,y+side*.080,.019,.015,.013,'torchmetal',{color:[.46,.39,.33]});
   plate('locator',1.01,y-.053,.014,.010,.012,'paper',{glow:true,color:[.23,.38,.34]});
   state.switches.push({rocker,y});
   obj(id,'light-switch','Interruptor · '+room,x+dx*1.6,y,z+dz*1.6,{circuit:state});
  }
 }
 circuit('recibidor','Recibidor',[[5.9,0,9.75]],[[6.85,0,11.875,'z',-1]],true);
 circuit('pasillo','Pasillo',[[5.95,0,4.65]],[[4.525,0,5.50,'x',1]]);
 circuit('estudio','Estudio',[[2.10,0,2.05]],[[4.275,0,3.40,'x',-1]]);
 circuit('salon','Sala de estar',[[2.2,0,8.1,.55]],[[4.275,0,7.81,'x',-1]]);
 circuit('cocina','Cocina',[[10.68,0,2.46]],[[7.625,0,3.53,'x',1]]);
 circuit('bano','Baño',[[8.75,0,5.91,.31]],[[7.375,0,6.85,'x',-1]]);
 circuit('escalera','Escalera',[[12,height,7.13,.83],[12,0,11.17,.23]],[[13.875,0,10.65,'x',-1],[13.875,height,4.18,'x',-1]]);
 circuit('distribuidor','Distribuidor',[[6.82,height,8.24]],[[4.525,height,5.50,'x',1]]);
 circuit('dormitorio','Dormitorio',[[2.20,height,2.30]],[[4.275,height,1.40,'x',-1]]);
 circuit('lectura','Sala de lectura',[[2.2,height,8]],[[4.275,height,7.82,'x',-1]]);
 circuit('musica','Sala de música',[[10.62,height,1.65]],[[10.12,height,2.875,'z',-1]]);
 // South-facing bath wall, directly ahead from the foot of the stairs.
 const x=9.40,y=1.48,z=7.55,front=z+.11,plate={color:[.28,.28,.25]},rust={color:[.49,.28,.17]},copper={color:[.64,.43,.22]};
 add('power-meter-case',x,y,z,.75,1.02,.16,'torchmetal',false,{...plate,shape:'rounded-box',roundness:.12});
 add('power-meter-recess',x,y-.04,front-.021,.62,.73,.038,'dark',false,{color:[.16,.16,.15]});
 for(const side of [-1,1]){
  for(const height of [-.42,.42])add('power-meter-rivet-'+side+height,x+side*.323,y+height,front-.01,.051,.051,.033,'torchmetal',false,{...rust,shape:'cylinder',segments:6});
  for(const height of [-.23,.19]){
   add('power-meter-insulator-'+side+height,x+side*.13,y+height,front,.133,.138,.072,'cream',false,{surface:'glaze',color:[.61,.53,.38]});
   add('power-meter-contact-'+side+height,x+side*.13,y+height,front+.051,.08,.103,.062,'brass',false,copper);
  }
 }
 add('power-meter-header',x,y+.357,front+.004,.57,.143,.025,'brass',false,{...copper,art:14,front:'south'});
 for(let i=0;i<8;i++)add('power-meter-stripe-'+i,x-.245+i*.07,y-.40,front+.016,.038,.064,.017,'brass',false,{roll:-.40,color:[.75,.50,.14]});
 for(let i=0;i<10;i++)add('power-meter-scuff-'+i,x+(i%2?-.318:.318),y-.29+(i%5)*.14,front-.021,.064,.013,.014,'wood',false,{...rust,roll:(i%3-1)*.34});
 const conduit=add('power-meter-conduit',x+.218,y+.73,z-.014,.085,.53,.088,'torchmetal',false,{shape:'round',segments:8,rings:5,...plate});
 add('power-meter-conduit-clamp',conduit.x,y+.67,z+.015,.125,.068,.11,'torchmetal',false,rust);
 add('power-meter-lamp',x+.244,y+.22,front+.031,.07,.07,.044,'paper',false,{dynamic:true,power,shape:'cylinder',segments:9,color:[.58,.81,.41]});
 const leverParts=[-.13,.13].map(dx=>add('power-meter-knife-'+dx,x+dx,y-.02,front+.108,.045,.32,.043,'brass',false,{dynamic:true,...copper}));
 leverParts.push(add('power-meter-lever',x,y+.14,front+.137,.37,.082,.074,'trim',false,{dynamic:true,shape:'rounded-box',roundness:.30,color:[.64,.16,.13]}));
 const meter=obj('house-power','power-switch','Interruptor general',x,y-.025,front+.16,{power,amount:1,parts:leverParts.map(box=>({box,y:box.y,z:box.z}))});
 return {circuits,fixtures,power,meter};
}

export const circuitPowered=circuit=>!!circuit?.on&&circuit.supply?.on!==false;

export function toggleCircuit(circuit){
 if(circuit.supply?.on===false)return null;
 circuit.on=!circuit.on;
 for(const {rocker,y} of circuit.switches)rocker.y=y+(circuit.on?.024:-.024);
 return circuit.on;
}

export function toggleHousePower(meter){
 meter.power.on=!meter.power.on;
 return meter.power.on;
}

export function updatePowerLever(meter,delta){
 const target=Number(meter.power.on);
 if(meter.amount===target)return;
 meter.amount=Math.min(1,Math.max(0,meter.amount+Math.sign(target-meter.amount)*delta/.22));
 const t=meter.amount,drop=(1-t*t*(3-2*t));
 for(const {box,y,z} of meter.parts){box.y=y-.30*drop;box.z=z+Math.sin(t*Math.PI)*.075;}
}
