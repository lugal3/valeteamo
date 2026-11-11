import {CUP_PROFILE} from './chibi-geometry.js';

const BULB_GLASS=[[-.5,0],[-.48,.31],[-.42,.61],[-.31,.85],[-.15,1],[.04,.97],[.22,.79],[.37,.56],[.5,.43],[.5,0]];
const BULB_SOCKET=[[-.5,.68],[-.48,1],[-.30,1],[.32,1],[.48,.94],[.5,.70]];
const MOUNT=[[-.5,.62],[-.46,.89],[-.30,1],[.48,1],[.5,0]];
const SHADE=CUP_PROFILE.map(([y,radius],i)=>[y,i===CUP_PROFILE.length-1?.98:radius]);

export function installHouseLights(add,obj,height){
 const circuits=[],fixtures=[];
 function circuit(id,room,mounts,switches,on=false){
  const state={id,room,on,switches:[]};circuits.push(state);
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
   add(id+'-plate',x,y,z,flat?.034:.135,.187,flat?.135:.034,'cream',false,{shape:'rounded-box',segments:8,rings:5,roundness:.26});
   const rocker=add(id+'-rocker',x+dx,y+(on?.024:-.024),z+dz,flat?.031:.065,.087,flat?.065:.031,'torchmetal',false,{dynamic:true});
   add(id+'-locator',x+dx*.57,y-.073,z+dz*.57,.014,.013,.014,'paper',false,{glow:true,color:[.33,.57,.50]});
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
 return {circuits,fixtures};
}

export function toggleCircuit(circuit){
 circuit.on=!circuit.on;
 for(const {rocker,y} of circuit.switches)rocker.y=y+(circuit.on?.024:-.024);
 return circuit.on;
}
