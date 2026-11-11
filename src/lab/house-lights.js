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
 const x=10.16,y=1.48,z=7.02;
 add('power-meter-case',x,y,z,.13,.52,.35,'torchmetal',false,{shape:'rounded-box',roundness:.15});
 add('power-meter-display',x+.07,y+.12,z,.03,.14,.25,'glass',false,{color:[.35,.47,.50]});
 for(let n=0;n<5;n++)add('power-meter-mark-'+n,x+.091,y+.12,z-.082+n*.041,.012,.046,.021,'paper',false,{color:[.65,.72,.69]});
 add('power-meter-lamp',x+.094,y+.04,z-.078,.018,.024,.024,'paper',false,{dynamic:true,power,color:[.48,.83,.62]});
 add('power-meter-slot',x+.073,y-.102,z,.023,.155,.142,'dark',false);
 const lever=add('power-meter-lever',x+.095,y-.067,z,.055,.045,.107,'trim',false,{dynamic:true,color:[.68,.28,.20]});
 obj('house-power','power-switch','Interruptor general',x+.135,y-.067,z,{power,lever,leverUp:y-.067});
 return {circuits,fixtures,power};
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
 meter.lever.y=meter.leverUp-(meter.power.on?0:.072);
 return meter.power.on;
}
