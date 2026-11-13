import {BATH_MIRROR,MIRROR_SPAWN} from './mirror.js';
import {BALUSTER_PROFILE,CUP_PROFILE,CANDLE_PROFILE,CLOCK_PROFILE} from './chibi-geometry.js';
import {installHouseLights} from './house-lights.js';
import {installCabinet,installRefrigerator} from './house-cabinets.js';
import {installLouisAltar} from './louis-altar.js';
import {installWallClock} from './wall-clock.js';
import {STUDY_SIGN} from './artwork.js';
import {HATCH,floorAroundHatch,installBasement} from './basement.js';
import {decorateKitchen,installPiano,installKitchenBar,installExtraHides} from './house-additions.js';
import {installArrivalCar} from './arrival-car.js';
// V5: generous landings and an independent, open stairwell. Dimensions in metres.
export const HEIGHT=3.15;
export const HOUSE=Object.freeze({width:14,depth:12});
export const STAIR=Object.freeze({xMin:10.8,xMax:13.2,centerX:12,zTop:4.95,zBottom:9.95,wellX:10.3,wellZ:10.2});
export const UNDER_STAIRS=Object.freeze({xMin:10.72,xMax:12.56,zMin:5.50,zMax:7.66});
export const WORLD_BOUNDS=Object.freeze({minX:-10,maxX:26,minZ:-8,maxZ:32});
const BASIN_PROFILE=[[-.5,0],[-.5,.58],[-.36,.78],[-.03,.97],[.33,1],[.5,.99],[.5,.91],[.31,.88],[-.04,.74],[-.25,.49],[-.28,0]];
export const ROOMS=[
 {id:'study',label:'Estudio',floor:0,x0:0,x1:4.4,z0:0,z1:4.7},
 {id:'living',label:'Sala de estar',floor:0,x0:0,x1:4.4,z0:4.7,z1:12},
 {id:'kitchen',label:'Cocina y comedor',floor:0,x0:7.5,x1:14,z0:0,z1:4.4},
 {id:'bath',label:'Baño',floor:0,x0:7.5,x1:10,z0:4.4,z1:7.4},
 {id:'stairs',label:'Vestíbulo de la escalera',floor:0,x0:10,x1:14,z0:4.4,z1:12},
 {id:'bedroom',label:'Dormitorio',floor:1,x0:0,x1:4.4,z0:0,z1:4.7},
 {id:'reading',label:'Sala de lectura',floor:1,x0:0,x1:4.4,z0:4.7,z1:12},
 {id:'music',label:'Sala de música',floor:1,x0:7.5,x1:14,z0:0,z1:3}
];
export function roomAt(x,z,y=0){
 if(y<-.12)return 'Sótano';
 if(x<0||x>HOUSE.width||z<0||z>HOUSE.depth)return 'Jardín y vecindario';
 return ROOMS.find(r=>r.floor===(y>HEIGHT*.52?1:0)&&x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1)?.label||(y>HEIGHT*.52?'Distribuidor y descansillo':'Recibidor y pasillo');
}
export function buildHouse(spawn='ground'){
 const boxes=[],objects=[];
 const add=(id,x,y,z,w,h,d,mat,solid=true,extra={})=>{const box={id,x,y,z,w,h,d,mat,solid,...extra};boxes.push(box);return box;};
 const obj=(id,kind,label,x,y,z,extra={})=>{const object={id,kind,label,x,y,z,...extra};objects.push(object);return object;};
 const wall=(axis,id,coordinate,start,end,y=0,mat='wallpaper')=>add(id,axis==='x'?coordinate:(start+end)/2,y+1.55,axis==='z'?coordinate:(start+end)/2,axis==='x'?.20:end-start,3.1,axis==='z'?.20:end-start,mat);
 function partition(axis,id,coordinate,start,end,gaps=[],floor=0,mat='wallpaper'){
  let cursor=start;
  for(const gap of [...gaps].sort((a,b)=>a.center-b.center)){
   const low=gap.center-gap.width/2,high=gap.center+gap.width/2;
   if(low>cursor)wall(axis,id+'-'+cursor,coordinate,cursor,low,floor,mat);
   const sill=gap.sill||0,height=gap.height||2.25;
   if(sill)add(id+'-sill-'+low,axis==='x'?coordinate:gap.center,floor+sill/2,axis==='z'?coordinate:gap.center,axis==='x'?.2:gap.width,sill,axis==='z'?.2:gap.width,'cream');
   const header=3.1-sill-height;
   if(header>0)add(id+'-header-'+low,axis==='x'?coordinate:gap.center,floor+sill+height+header/2,axis==='z'?coordinate:gap.center,axis==='x'?.2:gap.width,header,axis==='z'?.2:gap.width,mat);
   if(gap.window){
    const x=axis==='x'?coordinate:gap.center,z=axis==='z'?coordinate:gap.center,vertical=axis==='x';
    for(const side of [-1,1])add(id+'-frame-'+low+'-'+side,x+(vertical?0:side*gap.width/2),floor+sill+height/2,z+(vertical?side*gap.width/2:0),vertical?.14:.08,height,vertical?.08:.14,'wood',false);
    for(const top of [0,height])add(id+'-rail-'+low+'-'+top,x,floor+sill+top,z,vertical?.14:gap.width+.1,.08,vertical?gap.width+.1:.14,'wood',false);
    if(!gap.intro){
     add(id+'-cross-'+low,x,floor+sill+height/2,z,vertical?.12:.055,height,vertical?.055:.12,'cream',false);
     const out=coordinate===0?-1:1;
     for(const [i,level] of [.39,.68].entries()){
      const width=gap.width+.27,py=floor+sill+height*level,bx=x+(vertical?out*.115:0),bz=z+(vertical?0:out*.115);
      const planks=['board-low','board-high'];
      add(id+'-'+planks[i]+'-'+low,bx,py,bz,vertical?.089:width,.182,vertical?width:.089,'wood',false,{castShadow:true,color:i?[.45,.32,.25]:[.37,.26,.23]});
      for(const side of [-1,1])for(const row of [-1,1]){
       const span=side*(gap.width*.5-.026),surface=out*.052;
       add(id+'-nail-'+low+i+side+row,bx+(vertical?surface:span),py+row*.042,bz+(vertical?span:surface),vertical?.018:.033,.035,vertical?.033:.018,'torchmetal',false,{shape:'cylinder',yaw:vertical?Math.PI/2:0,segments:6,color:[.47,.45,.39]});
       add(id+'-nail-tip-'+low+i+side+row,bx+(vertical?-surface:span),py+row*.042,bz+(vertical?span:-surface),.017,.017,.017,'torchmetal',false,{color:[.26,.27,.25]});
      }
     }
    }
   }
   cursor=high;
  }
  if(cursor<end)wall(axis,id+'-end',coordinate,cursor,end,floor,mat);
 }
 const window=(center,width=1.4,intro=false)=>({center,width,sill:.85,height:1.5,window:true,intro});
 floorAroundHatch(add,'garden-ground',-.25,.44,-10,26,-8,32,'grass',true);
 floorAroundHatch(add,'base',-.17,.34,-.15,14.15,-.15,12.15,'floor',true);
 add('floor-up-left',5.15,HEIGHT-.11,6,10.3,.22,12,'wood');
 add('floor-up-right-front',12.15,HEIGHT-.11,2.475,3.7,.22,4.95,'wood');
 add('floor-up-right-back',12.15,HEIGHT-.11,11.1,3.7,.22,1.8,'wood');
 add('ceiling',7,6.35,6,14.3,.18,12.3,'plaster');
 add('roof',7,7.20,6,14.6,1.65,12.6,'roof',false,{shape:'gable'});
 for(const floor of [0,HEIGHT]){
  partition('x','west-'+floor,0,0,12,[window(2),window(8.5)],floor);
  partition('x','east-'+floor,14,0,12,[window(1.6),window(7.2)],floor,'wall2');
  partition('z','north-'+floor,0,0,14,[window(2.5),window(9.8)],floor);
  partition('z','south-'+floor,12,0,14,floor===0?[window(2.2,1.54,true),{center:5.9,width:1.3}]:[window(2.2),window(6.1),window(12.1)],floor);
  // Fase 3: split by room
  const wpStudy=floor===0?'wall_study':'wall_bedroom';
  const wpSalon=floor===0?'wall_salon':'wall_bedroom';
  partition('x','west-partition-study-'+floor,4.4,0,4.7,[{center:2.4,width:1.3}],floor,wpStudy);
  partition('x','west-partition-salon-'+floor,4.4,4.7,12,[{center:6.8,width:1.3}],floor,wpSalon);
  wall('z','west-room-divider-'+floor,4.7,0,4.4,floor,wpStudy);
 }
 partition('x','east-ground',7.5,0,12,[{center:2.5,width:1.3},{center:5.8,width:1.4},{center:10,width:3}],0,'wall_kitchen');
 wall('z','kitchen-divider',4.4,7.5,14,0,'wall_kitchen');wall('z','bath-divider',7.4,7.5,10,0,'wall_bath');
 wall('x','stairwell-side',10,4.4,7.4,0,'wall_stairs');
 partition('x','music-west',7.5,0,3,[],HEIGHT,'wall_stairs');
 partition('z','music-south',3,7.5,14,[{center:9,width:1.4}],HEIGHT,'wall2');
 function door(id,x,y,z,w,d,label,angle,locked=false){
  const alongX=w>d,width=alongX?w:d,hinge={x:x-(alongX?width/2:0),z:z-(alongX?0:width/2)};
  // Static frame surrounding the door opening
  const ft=.035,fd=(alongX?d:w)+.03;
  if(alongX){
   add('door-jamb-a-'+id,x-width/2-ft/2,y+1.1,z,ft,2.22,fd,'trim',false);
   add('door-jamb-b-'+id,x+width/2+ft/2,y+1.1,z,ft,2.22,fd,'trim',false);
   add('door-lintel-'+id,x,y+2.2+ft/2,z,width+ft*2,ft,fd,'trim',false);
  }else{
   add('door-jamb-a-'+id,x,y+1.1,z-width/2-ft/2,fd,2.22,ft,'trim',false);
   add('door-jamb-b-'+id,x,y+1.1,z+width/2+ft/2,fd,2.22,ft,'trim',false);
   add('door-lintel-'+id,x,y+2.2+ft/2,z,fd,ft,width+ft*2,'trim',false);
  }
  const shape=add('door-'+id,x,y+1.1,z,w,2.2,d,'wood',true,{dynamic:true});
  const handle=add('handle-'+id,x+(alongX?width*.34:.09),y+1.03,z+(alongX?-.09:width*.34),.085,.085,.085,'brass',false,{dynamic:true,shape:'round',segments:6,rings:3});
  const plate=add('handle-plate-'+id,x+(alongX?width*.34:.068),y+1.03,z+(alongX?-.068:width*.34),alongX?.06:.01,alongX?.14:.14,alongX?.01:.06,'brass',false,{dynamic:true});
  const panel=add('panel-'+id,x+(alongX?0:.063),y+1.28,z+(alongX?-.063:0),alongX?width*.72:.025,1.4,alongX?.025:width*.72,'wood',false,{dynamic:true,color:[.49,.30,.26]});
  const hingeA=add('hinge-a-'+id,hinge.x+(alongX?0:.045),y+.45,hinge.z+(alongX?.045:0),.03,.09,.03,'brass',false,{dynamic:true,shape:'cylinder',segments:6});
  const hingeB=add('hinge-b-'+id,hinge.x+(alongX?0:.045),y+1.75,hinge.z+(alongX?.045:0),.03,.09,.03,'brass',false,{dynamic:true,shape:'cylinder',segments:6});
  const parts=[handle,plate,panel,hingeA,hingeB];
  for(const side of [-1,1])for(const height of [.52,1.11,1.94])parts.push(add('door-moulding-'+id+side+height,x+(alongX?0:side*.069),y+height,z+(alongX?side*.069:0),alongX?width*.79:.025,.055,alongX?.025:width*.79,'trim',false,{dynamic:true,color:[.42,.25,.21]}));
  if(id==='entrada'){
   parts.push(add('entry-padlock',x+.36,y+.95,z-.11,.116,.13,.086,'brass',false,{dynamic:true,hiddenGeometry:true}));
   parts.push(add('entry-padlock-shackle',x+.36,y+1.029,z-.11,.092,.095,.035,'torchmetal',false,{dynamic:true,hiddenGeometry:true,shape:'torus',majorRadius:.035,tubeRadius:.010,segments:9,rings:5}));
  }
  if(locked){
   const px=x+(alongX?width*.34:.105),pz=z+(alongX?-.105:width*.34),py=y+1.03;
   const lockBody=add('padlock-body-'+id,px,py-.04,pz,.055,.07,.04,'brass',false,{dynamic:true});
   const lockShackle=add('padlock-shackle-'+id,px,py+.02,pz,.045,.045,.015,'torchmetal',false,{dynamic:true,shape:'torus',majorRadius:.02,tubeRadius:.006});
   parts.push(lockBody,lockShackle);
  }
  return obj(id,'door',label,x,y+1.1,z,{box:shape,parts:parts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x,z},hinge,swingAngle:angle,slideDistance:width*Math.abs(angle),open:false,amount:0,state:'closed',locked});
 }
 door('entrada',5.9,0,12,1.23,.11,'Puerta de entrada',-Math.PI/2);
 door('salon',4.4,0,6.8,.11,1.2,'Puerta de la sala de estar',Math.PI/2);
 door('estudio',4.4,0,2.4,.11,1.2,'Puerta del estudio',-Math.PI/2);
 door('cocina',7.5,0,2.5,.11,1.2,'Puerta de la cocina',-Math.PI/2);
 door('bano',7.5,0,5.8,.11,1.3,'Puerta del baño',Math.PI/2);
 door('dormitorio',4.4,HEIGHT,2.4,.11,1.2,'Dormitorio de Kitty',-Math.PI/2,true);
 door('lectura',4.4,HEIGHT,6.8,.11,1.2,'Sala de lectura',Math.PI/2);
 door('habitación',9,HEIGHT,3,1.3,.11,'Sala de música y recuerdos',Math.PI/2);
 const sash=add('entry-window-sash',2.2,1.6,12,1.38,1.34,.045,'glass',false,{dynamic:true});
 const windowParts=[];
 const windowLatch=add('entry-window-latch',2.80,1.17,11.94,.15,.075,.06,'brass',false,{hiddenGeometry:true});
 for(const x of [1.5,2.9])windowParts.push(add('entry-sash-stile-'+x,x,1.6,12,.055,1.4,.07,'wood',false,{dynamic:true}));
 for(const y of [.91,2.29])windowParts.push(add('entry-sash-rail-'+y,2.2,y,12,1.45,.055,.07,'wood',false,{dynamic:true}));
 const entryWindow={kind:'window',box:sash,latch:windowLatch,parts:windowParts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x:2.2,z:12},hinge:{x:1.5,z:12},swingAngle:Math.PI/2,amount:0};
 // A continuous ramp follows sixteen visible, correctly sized treads.
 const length=STAIR.zBottom-STAIR.zTop;
 for(let i=0;i<16;i++){
  const t=(i+.5)/16,z=STAIR.zBottom-t*length,h=(i+1)*HEIGHT/16;
  add('step-'+i,12,h-.09,z,2.4,.18,length/16+.01,'wood',false);
  add('step-lip-'+i,12,h-.01,z+length/32,2.42,.035,.035,'wood',false);
  add('step-carpet-'+i,12,h-.075,z,1.2,.195,length/16+.01,'carpet',false,{ao:.86});
 }
 for(const x of [10.55,13.45])for(let i=0;i<=13;i++){
  const t=i/13,z=STAIR.zBottom-t*length,y=t*HEIGHT;
  add('stair-post-'+x+'-'+i,x,y+.5,z,.065,1,.065,'wood');
 }
 for(const x of [10.55,13.45])add('stair-handrail-'+x,x,HEIGHT/2+.99,(STAIR.zTop+STAIR.zBottom)/2,.095,.09,Math.hypot(length,HEIGHT)+.25,'wood',false,{pitch:Math.atan2(HEIGHT,length)});
 const nook=UNDER_STAIRS,nookX=(nook.xMin+nook.xMax)/2,nookZ=(nook.zMin+nook.zMax)/2;
 add('stair-nook-ceiling',nookX,1.19,nookZ,nook.xMax-nook.xMin,.12,nook.zMax-nook.zMin,'wood');
 add('stair-nook-back',nookX,.54,5.55,nook.xMax-nook.xMin,1.08,.10,'wood');
 add('stair-nook-side',12.51,.54,nookZ,.10,1.08,nook.zMax-nook.zMin,'wood');
 add('stair-nook-end',nookX,.54,7.61,nook.xMax-nook.xMin,1.08,.10,'wood');
 for(const [i,x,y,z,w,h,d,mat] of [[0,11.18,.29,5.96,.63,.58,.64,'wood'],[1,12.19,.35,6.30,.50,.70,.62,'wood'],[2,11.15,.18,7.34,.54,.36,.39,'paper']]){
  add('stair-nook-crate-'+i,x,y,z,w,h,d,mat,true,{color:[.49,.34,.26]});
  add('stair-nook-crate-band-'+i,x,y+h/2+.008,z,w*.20,.017,d,'trim',false);
 }
 obj('understairs','hide','Esconderse bajo la escalera',11.88,.69,6.79,{hideType:'understairs',requiresCrouch:true,returnX:10.38,returnZ:6.82,hideCamera:{x:11.96,y:.76,z:6.80,yaw:-1.16,pitch:0}});
 for(let i=0;i<=21;i++)add('landing-post-'+i,10.22,HEIGHT+.52,4.95+i*.25,.06,1.04,.06,'wood',true,(i===0||i===21)?{shape:'lathe',profile:BALUSTER_PROFILE,segments:6}:{});
 add('landing-handrail',10.22,HEIGHT+1.04,7.575,.10,.10,5.45,'wood',false);
 for(let i=0;i<=14;i++)add('landing-south-post-'+i,10.35+i*.25,HEIGHT+.52,10.23,.06,1.04,.06,'wood',true,(i===0||i===14)?{shape:'lathe',profile:BALUSTER_PROFILE,segments:6}:{});
 add('landing-south-handrail',12.1,HEIGHT+1.04,10.23,3.65,.10,.10,'wood',false);
 function table(id,x,y,z,w=1.3,d=.7){
  add(id,x,y+.85,z,w,.12,d,'wood');
  for(const sx of [-1,1])for(const sz of [-1,1])add(id+'-leg-'+sx+sz,x+sx*(w/2-.08),y+.41,z+sz*(d/2-.07),.09,.82,.09,'wood');
 }
 function orient(first,x,z,yaw){if(!yaw)return;const c=Math.cos(yaw),s=Math.sin(yaw);for(const b of boxes.slice(first)){const dx=b.x-x,dz=b.z-z;b.x=x+dx*c-dz*s;b.z=z+dx*s+dz*c;b.yaw=(b.yaw||0)+yaw;}}
 function chair(id,x,y,z,yaw=0){const first=boxes.length;add(id,x,y+.36,z,.60,.13,.58,'velvet',true,{shape:'rounded-box',roundness:.32});add(id+'-back',x,y+.72,z+.25,.60,.65,.08,'pink',true,{shape:'rounded-box',roundness:.35});for(const sx of [-1,1])for(const sz of [-1,1])add(id+'-leg-'+sx+sz,x+sx*.22,y+.17,z+sz*.20,.07,.34,.07,'wood');orient(first,x,z,yaw);}
 function shelf(id,x,y,z,yaw=0){const first=boxes.length;add(id+'-back',x,y+1,z,.70,2,.15,'wood');for(let i=0;i<4;i++){add(id+'-shelf-'+i,x,y+.2+i*.5,z+.18,.72,.08,.50,'wood');for(let j=0;j<4;j++)add(id+'-book-'+i+j,x-.23+j*.15,y+.4+i*.5,z+.18,.1,.30,.26,j%2?'pink':'paper',false);}orient(first,x,z,yaw);}
 function lamp(id,x,y,z){add(id+'-base',x,y+.035,z,.24,.07,.24,'brass',false,{shape:'round'});add(id+'-stem',x,y+.24,z,.04,.35,.04,'brass',false,{shape:'cylinder'});add(id+'-shade',x,y+.38,z,.28,.20,.28,'cream',false,{shape:'lathe',profile:CUP_PROFILE,segments:6,pitch:Math.PI});add(id+'-glass',x,y+.30,z,.10,.12,.10,'paper',false,{shape:'round'});add(id+'-cap',x,y+.49,z,.05,.04,.05,'brass',false,{shape:'round'});}
 function plant(id,x,y,z){
  add(id+'-pot',x,y+.22,z,.40,.44,.40,'terracotta');add(id+'-lip',x,y+.44,z,.44,.07,.44,'brass',false);add(id+'-stem',x,y+.70,z,.03,.53,.03,'stem',false);
  for(let n=0;n<7;n++){const angle=n*Math.PI*2/7;add(id+'-leaf-'+n,x+Math.cos(angle)*.18,y+.67+.12*(n%3),z+Math.sin(angle)*.18,.24,.48,.08,'foliage',false,{shape:'leaf',yaw:angle,lean:.16});}
 }
 function frame(id,x,y,z,dir,art,{width=.76,height=.81,label=art===1?'Cuadro del corazón · One Direction':'Cuadro de One Direction',text=art===1?'Un corazón rojo está marcado junto al escenario. Parece una pista.':'Un cartel original inspirado en One Direction: música, viajes y recuerdos.'}={}){
  const vertical=dir==='west'||dir==='east';add('frame-'+id,x,y,z,vertical?.10:width+.12,height+.12,vertical?width+.12:.10,'wood',false);
  add('picture-'+id,x+(dir==='east'?.06:dir==='west'?-.06:0),y,z+(dir==='south'?.06:dir==='north'?-.06:0),vertical?.02:width,height,vertical?width:.02,'paper',false,{art,front:dir});
  obj('picture-'+id,'picture',label,x,y,z,{art,text});
 }
 // Keep the window landing and both sides of the doorway clear.
 const sofaStart=boxes.length;
 add('sofa',2.15,.35,9.5,2.2,.55,.85,'velvet',true,{shape:'rounded-box',roundness:.35});add('sofa-back',2.15,.76,9.95,2.3,.76,.17,'pink',true,{shape:'rounded-box',roundness:.35});
 for(const x of [.98,3.32])add('sofa-arm-'+x,x,.62,9.5,.18,.35,.94,'velvet',true,{shape:'rounded-box',roundness:.35});
 add('sofa-pillow-l',1.25,.58,9.5,.35,.32,.15,'pink',false,{shape:'rounded-box',roundness:.4,yaw:.25});
 add('sofa-pillow-r',3.05,.58,9.5,.35,.32,.15,'bow',false,{shape:'rounded-box',roundness:.4,yaw:-.25});
 orient(sofaStart,2.15,9.5,Math.PI/2);
 for(const box of boxes.slice(sofaStart)){box.x-=1.49;box.z-=.30;}
 table('coffee-table',2.10,0,9.2,.83,1.08);add('table-runner',2.10,.918,9.2,.54,.012,.90,'velvet',false);
 add('cup-saucer',2.0,.930,8.9,.14,.016,.14,'cream',false,{shape:'lathe',profile:CUP_PROFILE,segments:10});
 add('cup-coffee',2.0,.976,8.9,.10,.09,.10,'cream',false,{shape:'lathe',profile:CUP_PROFILE,segments:10});
 obj('sofa-note','inspect','Sofá',1.09,.67,9.20,{text:'La tela está gastada justo frente a la tele. Alguien pasaba mucho tiempo sentado aquí.'});
 obj('coffee-cup','inspect','Taza de café',2.0,.99,8.9,{text:'Todavía queda café en el fondo. La taza está fría.'});
 add('living-rug',2.05,.014,9.12,3.55,.025,3.05,'carpet',false,{ao:.88});
 installCabinet(add,obj,{id:'media-cabinet',label:'Cajón de los mandos',x:2.63,z:5.04,w:1.56,h:.61,d:.46,
  items:[{id:'media-battery',kind:'battery',label:'Pila del control remoto',dx:.49},{id:'media-flashlight',kind:'flashlight',label:'Linterna',dx:-.40}]});
 const tvStand=boxes.length,tvPower={on:false};
 add('tv-table',4.04,.31,9.42,1.49,.62,.47,'wood');
 for(const x of [3.65,4.42])add('tv-foot-'+x,x,.65,9.42,.12,.06,.24,'dark',false);
 add('tv-back',4.04,1.06,9.37,1.21,.72,.23,'dark',false,{shape:'rounded-box',roundness:.26,segments:12,rings:8,color:[.18,.15,.17]});
 add('tv-frame',4.04,1.06,9.45,1.25,.72,.16,'wood',false,{shape:'rounded-box',roundness:.20,segments:12,rings:8,color:[.35,.24,.23]});
 add('tv-bezel',3.97,1.07,9.548,1.07,.61,.07,'torchmetal',false,{shape:'rounded-box',roundness:.21,segments:12,rings:8,color:[.31,.32,.36]});
 add('tv-screen',3.97,1.07,9.59,1.00,.555,.020,'glass',false,{video:true,front:'south',color:[.13,.16,.19]});
 add('tv-power-dot',4.60,.817,9.552,.027,.024,.018,'paper',false,{dynamic:true,power:tvPower,color:[.41,.80,.52]});
 for(let n=0;n<7;n++)add('tv-speaker-'+n,4.566,.87+n*.037,9.55,.095,.013,.018,'dark',false);
 for(const y of [1.18,1.29])add('tv-dial-'+y,4.565,y,9.569,.071,.071,.033,'brass',false,{shape:'cylinder',segments:12,color:[.56,.51,.44]});
 orient(tvStand,4.04,9.42,Math.PI/2);
 const television={x:3.83,y:1.07,z:9.37,power:tvPower};
 add('tv-remote',2.34,.940,9.07,.115,.044,.245,'dark',false,{shape:'rounded-box',roundness:.23});
 add('tv-remote-power',2.34,.965,8.995,.033,.014,.029,'bow',false);
 for(let i=0;i<6;i++)add('tv-remote-key-'+i,2.316+i%2*.048,.967,9.05+Math.floor(i/2)*.036,.025,.013,.022,'torchmetal',false);
 obj('television','television','Control remoto',2.34,.985,9.07,{power:tvPower});
 lamp('table-lantern',2.10,.92,9.5);plant('salon-plant',.38,0,11.55);frame('stain',3.65,1.8,4.84,'south',1);
 frame('living-tour',.15,1.8,5.35,'east',12,{width:.65,height:1.16,label:'Starfire y Robin',text:'Starfire y Robin en la portada de un cómic de los Jóvenes Titanes.'});
 // Study with the same existing drawer/key progression.
 const studyStart=boxes.length,deskOffset=1.565;
 table('study-desk',2.6,0,2.7,1.35,.65);chair('study-chair',2.55,0,1.31,Math.PI);
 obj('study-books','inspect','Libros del estudio',.42,1.16,3.62,{text:'Entre los manuales hay un álbum vacío. Han arrancado todas las fotos de la misma página.'});
 add('desk-back',2.6,.66,2.97,1.2,.30,.06,'wood');for(const x of [2.15,3.05])add('drawer-housing-'+x,x,.73,2.65,.10,.22,.55,'wood');
 const front=add('drawer',2.6,.73,2.365,.76,.22,.055,'pink',true,{dynamic:true,surface:'paint'});
 const parts=[add('drawer-bottom',2.6,.64,2.61,.70,.035,.44,'wood',true,{dynamic:true}),add('drawer-left',2.25,.73,2.61,.035,.18,.44,'wood',true,{dynamic:true}),add('drawer-right',2.95,.73,2.61,.035,.18,.44,'wood',true,{dynamic:true}),add('drawer-back',2.6,.73,2.83,.70,.18,.035,'wood',true,{dynamic:true}),add('drawer-handle',2.6,.73,2.315,.19,.055,.055,'brass',false,{dynamic:true})];
 const drawer=obj('drawer','drawer','Cajón del escritorio',2.6,.73,2.335,{box:front,parts:parts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x:2.6,z:2.365},slideAxis:'z',slideDistance:-.42,open:false,amount:0,state:'closed'});
 const key=obj('key','key','Llave con lazo',2.58,.68,2.58,{dynamic:true,concealed:true,interactable:false});drawer.contents=[{object:key,origin:{x:key.x,z:key.z}}];
 add('study-papers',2.65,.94,2.75,.38,.06,.27,'paper',false);lamp('study-lamp',2.15,.92,2.72);
 for(const box of boxes.slice(studyStart))box.z+=deskOffset;
 for(const item of [drawer,key,drawer.origin,drawer.contents[0].origin,...drawer.parts.map(part=>part.origin)])item.z+=deskOffset;
 shelf('study-shelf',.19,0,3.6,-Math.PI/2);plant('study-plant',4.00,0,4.32);
 frame('study',.95,1.8,.15,'south',15,{label:'Letrero del estudio',text:STUDY_SIGN});
 // Kitchen and bathroom are recognizable rooms, not corridor props.
 floorAroundHatch(add,'kitchen-floor',.012,.024,7.65,13.85,.15,4.25,'tile',false,{ao:.91});
 const quartz={surface:'counter-stone',color:[.55,.53,.51]};
 add('kitchen-counter',8.875,.925,.48,1.69,.075,.73,'stone',true,quartz);
 add('kitchen-counter-east',11.37,.925,.48,2,.075,.73,'stone',true,quartz);
 add('kitchen-counter-sill',10.05,.925,.18,.66,.075,.13,'stone',true,quartz);
 add('kitchen-counter-edge',10.05,.925,.79,.66,.075,.11,'stone',true,quartz);
 add('kitchen-counter-base',9.76,.44,.47,1.70,.88,.67,'wood',true,{color:[.39,.29,.26]});
 add('kitchen-plinth',9.76,.065,.804,1.69,.13,.035,'wood',false,{color:[.22,.19,.19]});
 for(const x of [9.36,10.16]){
  add('kitchen-cabinet-door-'+x,x,.47,.81,.74,.68,.047,'wood',false,{color:[.48,.35,.30]});
  add('kitchen-cabinet-inset-'+x,x,.47,.84,.59,.53,.016,'wood',false,{color:[.39,.28,.27]});
  add('kitchen-cabinet-pull-'+x,x,.70,.868,.21,.029,.046,'torchmetal',false);
 }
 add('kitchen-backsplash',10.20,1.067,.147,4.34,.213,.064,'tile',false,{color:[.54,.61,.57]});
 add('kitchen-backsplash-cap',10.20,1.183,.155,4.34,.029,.076,'tile',false,{surface:'glaze',color:[.58,.65,.60]});
 installRefrigerator(add,obj);
 installCabinet(add,obj,{id:'kitchen-drawer',label:'Cajón de la cocina',x:11.51,z:.48,w:1.45,h:.885,d:.66,color:[.28,.44,.44],
  items:[{id:'pantry-note',kind:'note',label:'Lista de compras arrugada',dx:-.21,text:'Uvas. Café. Velas nuevas para la sala de música. La última línea dice «no volver a dejarlo salir».'}]});
 add('oven',8.50,.43,.49,.79,.86,.70,'torchmetal');add('oven-glass',8.50,.46,.86,.63,.45,.029,'glass',false,{color:[.16,.21,.26]});
 add('oven-handle',8.50,.74,.897,.56,.04,.045,'torchmetal',false);
 for(const x of [8.36,8.64])for(const z of [.33,.62])add('hob-'+x+z,x,.98,z,.19,.031,.19,'dark',false,{shape:'lathe',profile:CLOCK_PROFILE,segments:10});
 obj('oven','inspect','Horno',8.50,.57,.92,{text:'El reloj se quedó detenido. El vidrio está frío.'});
 add('sink',10.05,.917,.49,.668,.112,.508,'torchmetal',false,{shape:'lathe',profile:BASIN_PROFILE,segments:24,color:[.56,.60,.61]});
 add('sink-drain',10.05,.891,.49,.081,.014,.081,'dark',false,{shape:'lathe',profile:CLOCK_PROFILE,segments:12});
 add('tap-base',10.05,.985,.215,.125,.042,.113,'torchmetal',false,{shape:'round',segments:10});
 add('tap',10.05,1.114,.215,.047,.255,.047,'torchmetal',false,{shape:'round',segments:10});
 add('tap-spout',10.05,1.236,.33,.043,.046,.25,'torchmetal',false);
 add('tap-aerator',10.05,1.216,.447,.042,.055,.042,'dark',false,{shape:'round',segments:8});
 add('tap-lever',10.13,1.065,.214,.105,.027,.028,'torchmetal',false);
 installKitchenBar(add,obj);
 decorateKitchen(add);
 add('kitchen-mug-a',11.5,1.01,.46,.09,.09,.09,'cream',false,{shape:'lathe',profile:CUP_PROFILE,segments:9});
 add('kitchen-mug-b',11.7,1.01,.46,.09,.09,.09,'pink',false,{shape:'lathe',profile:CUP_PROFILE,segments:9});
 const rugZ=(HATCH.minZ+HATCH.maxZ)/2;
 const rug=[add('hatch-rug',8.55,.120,rugZ,1.48,.030,1.81,'carpet',false,{dynamic:true,color:[.62,.17,.30]})];
 for(const offset of [-.74,.74])rug.push(add('hatch-rug-band-'+offset,8.55,.137,rugZ+offset,1.44,.009,.125,'velvet',false,{dynamic:true,color:[.84,.56,.32]}));
 for(let i=0;i<5;i++)rug.push(add('hatch-rug-diamond-'+i,8.15+i*.2,.139,rugZ,.10,.010,.10,'velvet',false,{dynamic:true,yaw:Math.PI/4,color:[.83,.52,.52]}));
 const hatchRug=obj('hatch-rug','rug','Tapete bordado',8.55,.15,rugZ,{amount:0,aside:false,
  parts:rug.map(box=>({box,x:box.x,y:box.y}))});
 add('bath-floor',8.75,.012,5.9,2.25,.024,2.75,'tile',false,{ao:.90});add('toilet-base',9.25,.27,6.55,.45,.54,.65,'cream',true,{shape:'round'});add('toilet-seat',9.25,.56,6.5,.52,.08,.63,'cream',false,{shape:'round'});add('toilet-tank',9.25,.70,7.0,.50,.56,.22,'cream');
 installCabinet(add,obj,{id:'basin-cabinet',label:'Gabinete bajo el lavamanos',x:8.66,z:4.8,w:.89,h:.86,d:.57,color:[.37,.45,.47],
  items:[{id:'bath-battery',kind:'battery',label:'Pila del lavamanos',dx:.235},{id:'bath-note',kind:'note',label:'Papel bajo el lavamanos',dx:-.17,text:'W. mandó quitar el pestillo de la sala de música. Desde entonces la cierra por fuera.'}]});
 add('basin',8.66,.922,4.81,.81,.13,.53,'cream',false,{shape:'lathe',profile:BASIN_PROFILE,segments:16,surface:'glaze',color:[.9,.92,.88]});
 add('bath-drain',8.66,.889,4.81,.071,.012,.071,'torchmetal',false,{shape:'round',segments:7,rings:4});
 add('bath-tap',8.66,1.014,4.57,.056,.30,.056,'brass',false,{shape:'lathe',profile:CLOCK_PROFILE,segments:10});
 add('bath-tap-spout',8.66,1.14,4.69,.059,.047,.25,'brass',false,{shape:'rounded-box',roundness:.45,segments:8,rings:5});
 const water=add('bath-water',8.66,-100,4.795,.027,.211,.025,'glass',false,{shape:'lathe',profile:CLOCK_PROFILE,segments:9,dynamic:true,color:[.46,.66,.79]});
 obj('bath-tap','tap','Llave del lavamanos',8.66,1.15,4.81,{water,on:false});
 boxes.push({...BATH_MIRROR});
 for(const z of [4.77,6.33])add('mirror-frame-'+z,9.83,1.48,z,.07,1.96,.07,'brass',false);
 for(const y of [.52,2.44])add('mirror-frame-'+y,9.83,y,5.55,.07,.07,1.63,'brass',false);
 add('towel-rail',9.81,1.57,6.67,.06,.044,.52,'brass',false);
 add('towel',9.78,1.29,6.67,.05,.55,.42,'pink',false);
 installExtraHides(add,obj);
 // Hall consoles sit against walls, outside the walking strip.
 add('hall-console',4.682,.43,10.5,.35,.86,.9,'wood');obj('note-hall','note','Nota doblada',4.70,.911,10.5,{text:'Una nota espera junto a la entrada.'});
 add('hall-runner',5.95,.012,6.5,1.2,.024,9.5,'carpet',false,{ao:.86});const clock=installWallClock(add,6.05,1.85,.19);
 obj('battery-hall','battery','Pila pequeña',6.7,.13,7.5);obj('battery-living','battery','Pila junto al sofá',3.6,.13,7.8);
 // Master bedroom: space beside the bed remains clear for the rescue and closet.
 const bedX=1.76;
 for(const x of [1.30,2.22])for(const z of [.41,2.21])add('bed-leg-'+x+z,x,HEIGHT+.25,z,.12,.5,.12,'wood');
 add('upper-bed',bedX,HEIGHT+.53,1.29,1.10,.18,2.04,'wood');
 add('upper-mattress',bedX,HEIGHT+.70,1.29,1.06,.22,2.02,'cream',false,{shape:'rounded-box',roundness:.25});
 add('upper-blanket',bedX,HEIGHT+.83,1.63,1.08,.08,1.37,'pink',false,{shape:'rounded-box',roundness:.35});
 add('upper-blanket-fold',bedX,HEIGHT+.88,1.04,1.08,.06,.23,'cream',false,{shape:'rounded-box',roundness:.35});
 add('headboard',bedX,HEIGHT+.90,.195,1.14,1.0,.19,'wood');
 add('headboard-cap',bedX,HEIGHT+1.42,.195,1.18,.06,.19,'trim',false);
 add('bed-bow-center',bedX,HEIGHT+1.35,.31,.10,.09,.07,'bow',false,{shape:'round'});
 add('bed-bow-left',bedX-.09,HEIGHT+1.35,.31,.12,.13,.06,'pink',false,{shape:'round',roll:-.2});
 add('bed-bow-right',bedX+.09,HEIGHT+1.35,.31,.12,.13,.06,'pink',false,{shape:'round',roll:.2});
 add('pillow-1',bedX,HEIGHT+.87,.61,.73,.14,.44,'paper',false,{shape:'rounded-box',roundness:.4});
 const bedsideX=2.70,bedsideZ=.385;
 add('bedside',bedsideX,HEIGHT+.36,bedsideZ,.55,.72,.55,'wood');lamp('night-light',bedsideX,HEIGHT+.74,bedsideZ-.05);
 add('candle-holder',bedsideX-.16,HEIGHT+.73,bedsideZ,.10,.025,.10,'brass',false,{shape:'round'});
 add('candle-stick',bedsideX-.16,HEIGHT+.80,bedsideZ,.035,.12,.035,'cream',false,{shape:'lathe',profile:CANDLE_PROFILE,segments:8});
 add('candle-flame',bedsideX-.16,HEIGHT+.88,bedsideZ,.025,.04,.025,'torchglass',false,{shape:'round',glow:true});
 add('plush-body',bedsideX,HEIGHT+.79,bedsideZ+.15,.14,.16,.14,'cream',false,{shape:'round'});
 add('plush-head',bedsideX,HEIGHT+.91,bedsideZ+.15,.13,.12,.13,'cream',false,{shape:'round'});
 for(const side of [-1,1])add('plush-ear-'+side,bedsideX+side*.05,HEIGHT+.98,bedsideZ+.15,.045,.06,.045,'pink',false,{shape:'round'});
 add('plush-bow',bedsideX+.03,HEIGHT+.94,bedsideZ+.208,.05,.04,.03,'bow',false,{shape:'round'});
 obj('bedside-plush','inspect','Peluche del velador',bedsideX,HEIGHT+.94,bedsideZ+.17,{text:'El peluche está mirando hacia la puerta. En la etiqueta está bordado el nombre de Louis.'});
 // Face the open side of the bedroom so the leaf can swing clear of the bed and wardrobe.
 const safeX=3.98,safeZ=4.18,safeFront=3.68;
 add('safe-bottom',safeX,HEIGHT+.10,safeZ,.60,.12,.70,'dark');
 add('safe-top',safeX,HEIGHT+.91,safeZ,.60,.10,.70,'torchmetal');
 for(const side of [-1,1])add('safe-side-'+side,safeX,HEIGHT+.50,safeZ+side*.32,.60,.74,.06,'torchmetal');
 add('safe-back',4.24,HEIGHT+.50,safeZ,.08,.74,.58,'dark');
 const safeDoor=add('safe-door',safeFront,HEIGHT+.50,safeZ,.075,.73,.63,'torchmetal',true,{dynamic:true});
 const safeParts=[add('safe-keypad',safeFront-.05,HEIGHT+.61,safeZ-.15,.025,.24,.18,'dark',false,{dynamic:true}),
  add('safe-handle',safeFront-.07,HEIGHT+.52,safeZ+.16,.05,.22,.065,'brass',false,{dynamic:true})];
 for(let i=0;i<9;i++)safeParts.push(add('safe-key-'+i,safeFront-.07,HEIGHT+.67-Math.floor(i/3)*.06,safeZ-.20+(i%3)*.05,.014,.027,.027,'cream',false,{dynamic:true}));
 obj('mirror-safe','safe','Caja fuerte del dormitorio',safeFront-.06,HEIGHT+.59,safeZ,{box:safeDoor,
  parts:safeParts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x:safeFront,z:safeZ},hinge:{x:safeFront,z:safeZ+.315},
  swingAngle:-Math.PI*.48,slideDistance:.63,amount:0,open:false,state:'closed'});
 add('safe-envelope',safeX,HEIGHT+.18,safeZ,.24,.035,.33,'paper',false);
 add('safe-seal',safeX,HEIGHT+.205,safeZ,.07,.014,.08,'pink',false);
 table('bedroom-writing-table',3.89,HEIGHT,1.32,.73,.85);
 add('bedroom-writing-book',4.04,HEIGHT+.945,1.08,.23,.06,.30,'wood',false,{color:[.44,.25,.31],yaw:.18});
 add('bedroom-writing-book-pages',4.04,HEIGHT+.961,1.08,.21,.012,.27,'paper',false,{yaw:.18});
 obj('mirror-note','note','Nota con el código invertido',3.81,HEIGHT+.926,1.47,{text:'Cuatro cifras trazadas con una escritura extraña.',mirrored:true});
 frame('bed',3.8,HEIGHT+1.95,.15,'south',4);
 obj('note-upper','note','Carta en el dormitorio',bedsideX-.15,HEIGHT+.755,bedsideZ+.19,{text:'Hay una canción que siempre me recuerda a ti.'});
 obj('battery-upper','battery','Pila del dormitorio',bedsideX+.17,HEIGHT+.78,bedsideZ+.13);
 obj('basement-note','note','Papel clavado en el dormitorio',3.55,HEIGHT+1.46,.19,{text:'Lo bajé a la fuerza. La trampilla queda bajo el tapete rojo de la cocina.'});
 obj('bed','bed','Cama con lazo',bedX,HEIGHT+1.0,2.07,{returnX:2.80,returnZ:2.63});
 obj('underbed','hide','Esconderse bajo la cama',bedX,HEIGHT+.32,2.31,{hideType:'underbed',returnX:bedX,returnZ:2.72,hideCamera:{x:bedX,y:HEIGHT+.28,z:1.72,yaw:0,pitch:0}});
 // Wardrobe is a hollow shell. Its two physical louvered leaves leave real sight gaps.
 add('wardrobe-back',.18,HEIGHT+1.15,3.85,.12,2.3,1.65,'wood');for(const z of [3.02,4.68])add('wardrobe-side-'+z,.78,HEIGHT+1.15,z,1.3,2.3,.09,'wood');
 add('wardrobe-top',.78,HEIGHT+2.3,3.85,1.3,.08,1.75,'wood');add('wardrobe-bottom',.78,HEIGHT+.06,3.85,1.3,.12,1.75,'wood');
 const leaves=[];
 for(const [side,z,angle] of [[0,3.06,-1.30],[1,4.64,1.30]]){
  const hinge={x:1.38,z},center=z+(side?-.39:.39),leaf=[];
  for(const edge of [-1,1])leaf.push(add('wardrobe-stile-'+side+edge,1.38,HEIGHT+1.18,center+edge*.36,.065,2.12,.065,'wood',true,{dynamic:true}));
  for(let row=0;row<12;row++)leaf.push(add('wardrobe-louver-'+side+'-'+row,1.38,HEIGHT+.23+row*.165,center,.06,.115,.70,'wood',true,{dynamic:true}));
  for(const y of [HEIGHT+.13,HEIGHT+2.23])leaf.push(add('wardrobe-rail-'+side+y,1.38,y,center,.07,.10,.78,'wood',true,{dynamic:true}));
  leaf.push(add('wardrobe-knob-'+side,1.44,HEIGHT+1.05,center+(side?-.25:.25),.08,.08,.08,'brass',false,{dynamic:true}));
  leaves.push({hinge,angle,parts:leaf.map(box=>({box,origin:{x:box.x,z:box.z}}))});
 }
 obj('wardrobe','hide','Entrar en el armario',1.42,HEIGHT+1.15,3.85,{hideType:'wardrobe',returnX:2.25,returnZ:3.85,wardrobeLeaves:leaves,amount:0,hideCamera:{x:.84,y:HEIGHT+1.28,z:3.85,yaw:Math.PI/2,pitch:0}});
 // Upstairs music room and reading room have distinct furniture and clear passages.
 table('music-console',9.78,HEIGHT,.40,1.65,.55);
 add('record-deck',9.78,HEIGHT+.966,.40,.52,.105,.41,'wood',false,{shape:'rounded-box',roundness:.20,segments:8,rings:4});
 add('record-player',9.73,HEIGHT+1.026,.40,.33,.022,.33,'dark',false,{shape:'lathe',profile:CLOCK_PROFILE,segments:16});
 add('record-arm',9.94,HEIGHT+1.035,.41,.025,.026,.29,'torchmetal',false,{yaw:.19});
 obj('record-player','inspect','Tocadiscos',9.78,HEIGHT+1.05,.42,{text:'El vinilo está rayado en el mismo surco. Al lado, alguien escribió «Otra vez, desde el principio».'});
 shelf('music-books',13.80,HEIGHT,2.03,Math.PI/2);chair('music-chair',8.24,HEIGHT,1.33,.98);
 add('guitar-body',10.92,HEIGHT+1.13,.20,.35,.48,.10,'wood',false,{shape:'round'});add('guitar-neck',10.92,HEIGHT+1.6,.20,.055,.65,.08,'wood',false);
 obj('guitar','inspect','Guitarra de la sala',10.92,HEIGHT+1.39,.32,{text:'Una cuerda está rota. En la caja quedó un adhesivo de One Direction.'});
 installLouisAltar(add,obj,HEIGHT);
 frame('archive',12.45,HEIGHT+1.71,2.86,'north',13,{width:1.36,height:.745,label:'Afiche de archivo',text:'Un afiche de campaña viejo, guardado junto a los recortes de la casa.'});
 chair('reading-chair',.67,HEIGHT,7.55,-Math.PI/2);table('reading-table',1.50,HEIGHT,7.92,.72,.62);lamp('reading-light',1.50,HEIGHT+.92,7.92);shelf('reading-books',.19,HEIGHT,9.8,-Math.PI/2);plant('reading-plant',4.02,HEIGHT,5.33);frame('reading',3.75,HEIGHT+1.9,11.83,'north',2);
 obj('reading-books','inspect','Biblioteca de la planta alta',.47,HEIGHT+1.16,9.8,{text:'Los anuarios tienen los lomos gastados. Entre ellos hay entradas de conciertos archivadas por fecha.'});
 installCabinet(add,obj,{id:'reading-cabinet',label:'Cajón de la sala de lectura',x:2.05,y:HEIGHT,z:5.12,w:1.28,d:.60,
  items:[{id:'reading-battery',kind:'battery',label:'Pila de la sala de lectura',dx:.24}]});
 add('reading-rug',1.92,HEIGHT+.012,8.0,2.9,.024,4,'carpet',false,{ao:.88});add('upper-bench',4.95,HEIGHT+.43,11.65,1.15,.18,.48,'velvet');for(const x of [4.55,5.35])add('bench-leg-'+x,x,HEIGHT+.20,11.65,.08,.4,.35,'wood');plant('landing-plant',8.3,HEIGHT,11.54);frame('landing',8.0,HEIGHT+1.85,11.83,'north',0);
 installPiano(add,obj,{x:13.55,z:3.99,floor:HEIGHT});
 add('reading-tea-saucer',1.69,HEIGHT+.927,7.98,.18,.018,.18,'ceramica',false,{shape:'round'});
 add('reading-tea-cup',1.69,HEIGHT+.98,7.98,.10,.10,.10,'cream',false,{shape:'lathe',profile:CUP_PROFILE,segments:9});
 add('living-folded-throw',.85,.66,8.59,.28,.065,.37,'velvet',false,{color:[.53,.36,.45],yaw:.08});
 add('living-magazine',2.00,.946,9.41,.22,.025,.31,'paper',false,{color:[.68,.51,.42],yaw:-.23});
 // Exterior is built geometry, with a grounded garden and recognizable neighborhood.
 add('front-path',5.9,-.005,16.25,1.65,.025,8.5,'stone',false);add('road',8,-.005,23,36,.025,3.4,'asphalt',false);add('pavement',8,0,20.5,36,.04,1.3,'stone',false);
 for(const x of [-4.8,19.5]){
  add('neighbor-'+x,x,1.9,4,5.0,3.8,6.0,'plaster');add('neighbor-roof-'+x,x,4.55,4,5.5,1.55,6.5,'roof',false,{shape:'gable'});
  for(const z of [2.5,5.5]){add('neighbor-window-'+x+z,x+(x<0?2.53:-2.53),2.0,z,.04,.9,1.0,'torchglass',false,{glow:true});}
 }
 for(const x of [0,10,20]){add('distant-house-'+x,x,1.65,29,5.0,3.3,3.5,'wall2');add('distant-roof-'+x,x,3.9,29,5.4,1.2,4,'roof',false,{shape:'gable'});for(const dx of [-1.2,1.2])add('distant-window-'+x+dx,x+dx,1.8,27.22,.8,.8,.03,'torchglass',false,{glow:true});}
 for(const [i,x,z] of [[0,-2,14],[1,16,14],[2,-6,17],[3,19,18],[4,-2,-3],[5,16,-3]]){
  add('tree-trunk-'+i,x,1.1,z,.25,2.2,.25,'wood');for(let n=0;n<3;n++)add('tree-crown-'+i+n,x+(n-1)*.45,2.6+(n%2)*.45,z+(n%2)*.30,1.7,1.9,1.6,'foliage',false,{shape:'round',segments:8,rings:4});
 }
 for(let i=0;i<8;i++){const x=i%2?8.2:3.6,z=13.5+Math.floor(i/2)*1.4;plant('garden-plant-'+i,x,0,z);}
 const car=installArrivalCar(add);
 for(const x of [-9.7,25.7])add('garden-boundary-x'+x,x,.65,12,.15,1.3,40,'wood');for(const z of [-7.7,31.7])add('garden-boundary-z'+z,8,.65,z,36,1.3,.15,'wood');
 add('moon',-2,15,-6,1.4,1.4,1.4,'paper',false,{shape:'round',glow:true});
 
  // Fase 3: Thin decals (manchas, polvo, cobwebs) — solid:false, no collision
  add('decal-dust-sw',1.2,.005,11.8,2.1,.01,.12,'stain',false);
  add('decal-dust-nw',.12,.005,8.5,.12,.01,3.0,'stain',false);
  add('decal-sink-stain',9.9,.013,.62,.55,.01,.35,'stain',false);
  add('decal-basin-stain',8.5,.013,4.88,.70,.01,.40,'stain',false);
  add('decal-cobweb-a',7.9,.52,4.0,.28,.01,.12,'cobweb',false);
  add('decal-cobweb-b',7.9,.005,4.0,.28,.01,.18,'cobweb',false);
  add('decal-finger-a',5.0,1.08,11.94,.22,.18,.01,'stain',false);
  add('decal-finger-b',6.5,0.92,11.94,.14,.12,.01,'stain',false);
  add('decal-stair-dust',12,.005,7.45,2.3,.01,.12,'stain',false);
  add('decal-bath-drip',9.88,0.6,4.45,.01,.55,.12,'stain',false);
  add('decal-study-dust',.12,.005,1.5,.12,.01,2.8,'stain',false);
  const spawns={mirror:{...MIRROR_SPAWN},ground:{x:5.95,y:0,z:10.65,yaw:Math.PI},upstairs:{x:12,y:HEIGHT,z:4.15,yaw:-Math.PI/2,items:{key:1}},sound:{x:2.2,y:0,z:11.0,yaw:Math.PI},interactions:{x:3.3,y:0,z:3.6,yaw:-2.8,items:{key:1,batteries:1}}};
 const lights=installHouseLights(add,obj,HEIGHT);
 const hatch=installBasement(add,obj,lights);
 hatchRug.hatch=hatch;
 return {boxes,objects,lights,television,clock,hatch,hatchRug,entryWindow,car,spawn:spawns[spawn]||spawns.ground,spawns,rooms:ROOMS,bounds:WORLD_BOUNDS,stair:STAIR,house:HOUSE};
}
