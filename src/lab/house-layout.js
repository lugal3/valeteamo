// V5: generous landings and an independent, open stairwell. Dimensions in metres.
export const HEIGHT=3.15;
export const HOUSE=Object.freeze({width:14,depth:12});
export const STAIR=Object.freeze({xMin:10.8,xMax:13.2,centerX:12,zTop:4.95,zBottom:9.95,wellX:10.3,wellZ:10.2});
export const WORLD_BOUNDS=Object.freeze({minX:-10,maxX:26,minZ:-8,maxZ:32});
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
    if(!gap.intro)add(id+'-cross-'+low,x,floor+sill+height/2,z,vertical?.12:.055,height,vertical?.055:.12,'cream',false);
    add(id+'-curtain-'+low,x+(vertical?-.13:-gap.width/2+.08),floor+sill+height/2,z+(vertical?-gap.width/2+.08:-.13),vertical?.10:.16,height,vertical?.16:.10,'pink',false);
   }
   cursor=high;
  }
  if(cursor<end)wall(axis,id+'-end',coordinate,cursor,end,floor,mat);
 }
 const window=(center,width=1.4,intro=false)=>({center,width,sill:.85,height:1.5,window:true,intro});
 add('garden-ground',8,-.25,12,36,.44,40,'grass');
 add('base',7,-.17,6,14.3,.34,12.3,'floor');
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
  partition('x','west-partition-'+floor,4.4,0,12,[{center:2.4,width:1.3},{center:6.8,width:1.3}],floor);
  wall('z','west-room-divider-'+floor,4.7,0,4.4,floor);
 }
 partition('x','east-ground',7.5,0,12,[{center:2.5,width:1.3},{center:5.8,width:1.4},{center:10,width:3}],0,'wall2');
 wall('z','kitchen-divider',4.4,7.5,14,0,'wall2');wall('z','bath-divider',7.4,7.5,10,0,'wall2');
 wall('x','stairwell-side',10,4.4,7.4,0,'plaster');
 partition('x','music-west',7.5,0,3,[],HEIGHT,'wall2');
 partition('z','music-south',3,7.5,14,[{center:9,width:1.4}],HEIGHT,'wall2');
 function door(id,x,y,z,w,d,label,angle,locked=false){
  const alongX=w>d,width=alongX?w:d,hinge={x:x-(alongX?width/2:0),z:z-(alongX?0:width/2)};
  const shape=add('door-'+id,x,y+1.1,z,w,2.2,d,'wood',true,{dynamic:true});
  const handle=add('handle-'+id,x+(alongX?width*.34:.09),y+1.03,z+(alongX?-.09:width*.34),.085,.085,.085,'brass',false,{dynamic:true});
  const panel=add('panel-'+id,x+(alongX?0:.063),y+1.28,z+(alongX?-.063:0),alongX?width*.72:.025,1.4,alongX?.025:width*.72,'trim',false,{dynamic:true,surface:'paint'});
  return obj(id,'door',label,x,y+1.1,z,{box:shape,parts:[handle,panel].map(box=>({box,origin:{x:box.x,z:box.z},yaw:0})),origin:{x,z},hinge,swingAngle:angle,slideDistance:width*Math.abs(angle),open:false,amount:0,state:'closed',locked});
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
 for(const x of [1.5,2.9])windowParts.push(add('entry-sash-stile-'+x,x,1.6,12,.055,1.4,.07,'wood',false,{dynamic:true}));
 for(const y of [.91,2.29])windowParts.push(add('entry-sash-rail-'+y,2.2,y,12,1.45,.055,.07,'wood',false,{dynamic:true}));
 const entryWindow={kind:'window',box:sash,parts:windowParts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x:2.2,z:12},hinge:{x:1.5,z:12},swingAngle:Math.PI/2,amount:0};
 // A continuous ramp follows sixteen visible, correctly sized treads.
 const length=STAIR.zBottom-STAIR.zTop;
 for(let i=0;i<16;i++){
  const t=(i+.5)/16,z=STAIR.zBottom-t*length,h=(i+1)*HEIGHT/16;
  add('step-'+i,12,h-.09,z,2.4,.18,length/16+.01,'wood',false);
 }
 for(const x of [10.55,13.45])for(let i=0;i<=13;i++){
  const t=i/13,z=STAIR.zBottom-t*length,y=t*HEIGHT;
  add('stair-post-'+x+'-'+i,x,y+.5,z,.065,1,.065,'wood');
 }
 for(const x of [10.55,13.45])add('stair-handrail-'+x,x,HEIGHT/2+.99,(STAIR.zTop+STAIR.zBottom)/2,.095,.09,Math.hypot(length,HEIGHT)+.25,'wood',false,{pitch:Math.atan2(HEIGHT,length)});
 for(let i=0;i<=21;i++)add('landing-post-'+i,10.22,HEIGHT+.52,4.95+i*.25,.06,1.04,.06,'wood');
 add('landing-handrail',10.22,HEIGHT+1.04,7.575,.10,.10,5.45,'wood',false);
 for(let i=0;i<=14;i++)add('landing-south-post-'+i,10.35+i*.25,HEIGHT+.52,10.23,.06,1.04,.06,'wood');
 add('landing-south-handrail',12.1,HEIGHT+1.04,10.23,3.65,.10,.10,'wood',false);
 function table(id,x,y,z,w=1.3,d=.7){
  add(id,x,y+.85,z,w,.12,d,'wood');
  for(const sx of [-1,1])for(const sz of [-1,1])add(id+'-leg-'+sx+sz,x+sx*(w/2-.08),y+.41,z+sz*(d/2-.07),.09,.82,.09,'wood');
 }
 function orient(first,x,z,yaw){if(!yaw)return;const c=Math.cos(yaw),s=Math.sin(yaw);for(const b of boxes.slice(first)){const dx=b.x-x,dz=b.z-z;b.x=x+dx*c-dz*s;b.z=z+dx*s+dz*c;b.yaw=yaw;}}
 function chair(id,x,y,z,yaw=0){const first=boxes.length;add(id,x,y+.36,z,.60,.13,.58,'velvet');add(id+'-back',x,y+.72,z+.25,.60,.65,.08,'pink');for(const sx of [-1,1])for(const sz of [-1,1])add(id+'-leg-'+sx+sz,x+sx*.22,y+.17,z+sz*.20,.07,.34,.07,'wood');orient(first,x,z,yaw);}
 function shelf(id,x,y,z,yaw=0){const first=boxes.length;add(id+'-back',x,y+1,z,.70,2,.15,'wood');for(let i=0;i<4;i++){add(id+'-shelf-'+i,x,y+.2+i*.5,z+.18,.72,.08,.50,'wood');for(let j=0;j<4;j++)add(id+'-book-'+i+j,x-.23+j*.15,y+.4+i*.5,z+.18,.1,.30,.26,j%2?'pink':'paper',false);}orient(first,x,z,yaw);}
 function lamp(id,x,y,z){add(id+'-base',x,y+.035,z,.24,.07,.24,'brass',false);add(id+'-glass',x,y+.24,z,.15,.35,.15,'torchglass',false,{glow:true});add(id+'-cap',x,y+.45,z,.24,.08,.24,'dark',false);}
 function plant(id,x,y,z){
  add(id+'-pot',x,y+.22,z,.40,.44,.40,'terracotta');add(id+'-lip',x,y+.44,z,.44,.07,.44,'brass',false);add(id+'-stem',x,y+.70,z,.03,.53,.03,'stem',false);
  for(let n=0;n<7;n++){const angle=n*Math.PI*2/7;add(id+'-leaf-'+n,x+Math.cos(angle)*.18,y+.67+.12*(n%3),z+Math.sin(angle)*.18,.24,.48,.08,'foliage',false,{shape:'leaf',yaw:angle,lean:.16});}
 }
 function frame(id,x,y,z,dir,art){
  const vertical=dir==='west'||dir==='east';add('frame-'+id,x,y,z,vertical?.10:.88,.93,vertical?.88:.10,'wood',false);
  add('picture-'+id,x+(dir==='east'?.06:dir==='west'?-.06:0),y,z+(dir==='south'?.06:dir==='north'?-.06:0),vertical?.02:.76,.81,vertical?.76:.02,'paper',false,{art,front:dir});
  obj('picture-'+id,'picture',art===1?'Cuadro del corazón · One Direction':'Cuadro de One Direction',x,y,z,{art,text:art===1?'Un corazón rojo está marcado junto al escenario. Parece una pista.':'Un cartel original inspirado en One Direction: música, viajes y recuerdos.'});
 }
 // Living room: seating faces a low media cabinet, with a clear route around it.
 add('sofa',2.15,.35,9.5,2.2,.55,.85,'velvet');add('sofa-back',2.15,.76,9.95,2.3,.76,.17,'pink');
 for(const x of [.98,3.32])add('sofa-arm-'+x,x,.62,9.5,.18,.35,.94,'velvet');
 table('coffee-table',2.2,0,8.1,1.10,.82);add('living-rug',2.2,.014,8.6,3.3,.025,4.0,'carpet',false);
 add('media-cabinet',2.2,.31,5.02,1.6,.62,.40,'wood');add('tv-frame',2.2,1.02,4.98,1.1,.62,.10,'dark',false);add('tv-screen',2.2,1.02,5.045,.94,.48,.02,'glass',false);
 lamp('table-lantern',2.2,.92,8.1);plant('salon-plant',.65,0,11.2);frame('stain',3.65,1.8,4.84,'south',1);frame('living-tour',.15,1.8,5.35,'east',0);
 // Study with the same existing drawer/key progression.
 table('study-desk',2.6,0,2.7,1.35,.65);chair('study-chair',3.25,0,1.15,-2.75);shelf('study-shelf',.16,0,3.6,-Math.PI/2);plant('study-plant',3.8,0,4.05);
 add('desk-back',2.6,.66,2.97,1.2,.30,.06,'wood');for(const x of [2.15,3.05])add('drawer-housing-'+x,x,.73,2.65,.10,.22,.55,'wood');
 const front=add('drawer',2.6,.73,2.365,.76,.22,.055,'pink',true,{dynamic:true,surface:'paint'});
 const parts=[add('drawer-bottom',2.6,.64,2.61,.70,.035,.44,'wood',true,{dynamic:true}),add('drawer-left',2.25,.73,2.61,.035,.18,.44,'wood',true,{dynamic:true}),add('drawer-right',2.95,.73,2.61,.035,.18,.44,'wood',true,{dynamic:true}),add('drawer-back',2.6,.73,2.83,.70,.18,.035,'wood',true,{dynamic:true}),add('drawer-handle',2.6,.73,2.315,.19,.055,.055,'brass',false,{dynamic:true})];
 const drawer=obj('drawer','drawer','Cajón del escritorio',2.6,.73,2.335,{box:front,parts:parts.map(box=>({box,origin:{x:box.x,z:box.z}})),origin:{x:2.6,z:2.365},slideAxis:'z',slideDistance:-.42,open:false,amount:0,state:'closed'});
 const key=obj('key','key','Llave con lazo',2.58,.68,2.58,{dynamic:true,concealed:true,interactable:false});drawer.contents=[{object:key,origin:{x:key.x,z:key.z}}];
 add('study-papers',2.65,.94,2.75,.38,.06,.27,'paper',false);lamp('study-lamp',2.15,.92,2.72);frame('study',.95,1.8,.15,'south',2);
 // Kitchen and bathroom are recognizable rooms, not corridor props.
 add('kitchen-floor',10.75,.012,2.2,6.2,.024,4.1,'tile',false);
 add('kitchen-counter',10.0,.48,.65,4.3,.96,.75,'tile');add('fridge',12.95,1.0,.75,.85,2.0,.85,'cream');
 add('oven',8.5,.53,.65,.65,.82,.76,'torchmetal');add('oven-glass',8.5,.53,1.05,.48,.40,.03,'glass',false);
 for(const x of [8.35,8.65])for(const z of [.48,.80])add('hob-'+x+z,x,.99,z,.18,.025,.18,'dark',false,{shape:'round'});
 add('sink',10.0,.98,.65,.60,.045,.42,'torchmetal',false);add('tap',10.0,1.14,.35,.045,.33,.045,'brass',false);add('tap-spout',10.0,1.30,.48,.045,.045,.25,'brass',false);
 table('dining-table',11.15,0,2.8,1.6,.75);chair('dining-chair-a',11.15,0,1.75,Math.PI);chair('dining-chair-b',11.15,0,3.65);lamp('dining-light',11.15,.92,2.8);
 add('basement-hatch',8.55,.018,3.55,1.25,.035,1.0,'dark',false);for(const x of [8.15,8.95])add('hatch-hinge-'+x,x,.044,3.95,.20,.025,.07,'brass',false);add('hatch-pull',8.55,.05,3.15,.26,.04,.06,'brass',false);
 obj('basement-hatch','inspect','Trampilla del sótano',8.55,.05,3.55,{text:'La trampilla parece bajar al sótano. Está cerrada por dentro.'});
 add('bath-floor',8.75,.012,5.9,2.25,.024,2.75,'tile',false);add('toilet-base',9.25,.27,6.55,.45,.54,.65,'cream',true,{shape:'round'});add('toilet-seat',9.25,.56,6.5,.52,.08,.63,'cream',false,{shape:'round'});add('toilet-tank',9.25,.70,7.0,.50,.56,.22,'cream');
 add('basin-cabinet',8.55,.43,4.92,.75,.86,.50,'wood');add('basin',8.55,.90,4.92,.79,.10,.55,'cream',false,{shape:'round'});add('bath-tap',8.55,1.08,4.73,.05,.3,.05,'brass',false);
 add('bath-mirror',9.86,1.65,5.0,.045,.85,.70,'glass',false);add('towel',9.85,1.18,6.3,.05,.65,.45,'pink',false);
 // Hall consoles sit against walls, outside the walking strip.
 add('hall-console',4.68,.43,10.5,.35,.86,.9,'wood');obj('note-hall','note','Nota doblada',4.83,.92,10.5,{text:'Una nota espera junto a la entrada.'});
 add('hall-runner',5.95,.012,6.5,1.2,.024,9.5,'carpet',false);frame('hall',6.05,1.85,.15,'south',3);
 obj('battery-hall','battery','Pila pequeña',6.7,.13,7.5);obj('battery-living','battery','Pila junto al sofá',3.6,.13,7.8);
 // Master bedroom: space beside the bed remains clear for the rescue and closet.
 for(const x of [1.55,3.45])for(const z of [.72,2.88])add('bed-leg-'+x+z,x,HEIGHT+.25,z,.12,.5,.12,'wood');
 add('upper-bed',2.5,HEIGHT+.53,1.8,2.1,.18,2.5,'wood');add('upper-mattress',2.5,HEIGHT+.70,1.8,2.05,.22,2.45,'cream',false);add('upper-blanket',2.5,HEIGHT+.83,2.15,2.05,.05,1.7,'pink',false);
 add('headboard',2.5,HEIGHT+.90,.54,2.2,1.0,.12,'wood');add('pillow',2.5,HEIGHT+.87,.92,1.45,.12,.45,'paper',false,{shape:'round'});
 add('bedside',3.85,HEIGHT+.36,1.25,.55,.72,.55,'wood');lamp('night-light',3.85,HEIGHT+.74,1.25);plant('bedroom-plant',.60,HEIGHT,1.2);
 frame('bed',3.8,HEIGHT+1.95,.15,'south',4);obj('note-upper','note','Carta en el dormitorio',3.85,HEIGHT+.79,1.5,{text:'Hay una canción que siempre me recuerda a ti.'});obj('battery-upper','battery','Pila del dormitorio',3.85,HEIGHT+.85,1.0);
 obj('bed','bed','Cama con lazo',2.5,HEIGHT+1.0,2.75,{returnX:3.85,returnZ:3.4});
 obj('underbed','hide','Esconderse bajo la cama',2.5,HEIGHT+.32,3.0,{hideType:'underbed',returnX:2.5,returnZ:3.55,hideCamera:{x:2.5,y:HEIGHT+.28,z:2.35,yaw:0,pitch:0}});
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
 table('music-console',9.8,HEIGHT,.65,1.7,.55);add('record-player',9.8,HEIGHT+.96,.65,.40,.05,.40,'dark',false,{shape:'round'});shelf('music-books',12.8,HEIGHT,.16);chair('music-chair',8.3,HEIGHT,1.65,.98);
 add('guitar-body',11.1,HEIGHT+1.13,.21,.35,.48,.10,'wood',false,{shape:'round'});add('guitar-neck',11.1,HEIGHT+1.6,.21,.055,.65,.08,'wood',false);frame('music',8.0,HEIGHT+1.9,.15,'south',5);
 chair('reading-chair',1.3,HEIGHT,7.5,Math.PI/2);table('reading-table',2.5,HEIGHT,7.5,.75,.65);lamp('reading-light',2.5,HEIGHT+.92,7.5);shelf('reading-books',.16,HEIGHT,9.8,-Math.PI/2);plant('reading-plant',3.7,HEIGHT,5.3);frame('reading',3.75,HEIGHT+1.9,11.83,'north',2);
 add('reading-rug',2.2,HEIGHT+.012,8.0,3.1,.024,4,'carpet',false);add('upper-bench',5.1,HEIGHT+.43,11.3,1.15,.18,.48,'velvet');for(const x of [4.7,5.5])add('bench-leg-'+x,x,HEIGHT+.20,11.3,.08,.4,.35,'wood');plant('landing-plant',8.3,HEIGHT,10.8);frame('landing',8.0,HEIGHT+1.85,11.83,'north',0);
 // Exterior is built geometry, with a grounded garden and recognizable neighborhood.
 add('front-path',5.9,-.005,16.25,1.65,.025,8.5,'stone',false);add('road',8,-.005,23,36,.025,3.4,'asphalt',false);add('pavement',8,0,20.5,36,.04,1.3,'stone',false);
 for(const x of [-4.8,19.5]){
  add('neighbor-'+x,x,1.9,4,5.0,3.8,6.0,'plaster');add('neighbor-roof-'+x,x,4.55,4,5.5,1.55,6.5,'roof',false,{shape:'gable'});
  for(const z of [2.5,5.5]){add('neighbor-window-'+x+z,x+(x<0?2.53:-2.53),2.0,z,.04,.9,1.0,'torchglass',false,{glow:true});}
 }
 for(const x of [0,10,20]){add('distant-house-'+x,x,1.65,29,5.0,3.3,3.5,'wall2');add('distant-roof-'+x,x,3.9,29,5.4,1.2,4,'roof',false,{shape:'gable'});for(const dx of [-1.2,1.2])add('distant-window-'+x+dx,x+dx,1.8,27.22,.8,.8,.03,'torchglass',false,{glow:true});}
 for(const [i,x,z] of [[0,-2,14],[1,16,14],[2,-6,17],[3,19,18],[4,-2,-3],[5,16,-3]]){
  add('tree-trunk-'+i,x,1.1,z,.25,2.2,.25,'wood');for(let n=0;n<3;n++)add('tree-crown-'+i+n,x+(n-1)*.45,2.6+(n%2)*.45,z+(n%2)*.30,1.7,1.9,1.6,'foliage',false,{shape:'round'});
 }
 for(let i=0;i<8;i++){const x=i%2?8.2:3.6,z=13.5+Math.floor(i/2)*1.4;plant('garden-plant-'+i,x,0,z);}
 const carX=10.1,carZ=16.6;add('car-body',carX,.65,carZ,1.65,.65,3.3,'carpaint');add('car-cabin',carX,1.18,carZ+.12,1.4,.65,1.8,'carpaint',false,{shape:'round'});add('car-windshield',carX,1.24,carZ-.65,1.24,.43,.07,'glass',false);
 for(const x of [-.82,.82])for(const z of [-1.05,1.05])add('car-wheel-'+x+z,carX+x,.34,carZ+z,.56,.56,.20,'dark',false,{shape:'cylinder',yaw:Math.PI/2});
 for(const x of [-.52,.52])add('car-headlight-'+x,carX+x,.72,carZ-1.67,.30,.18,.04,'torchglass',false,{glow:true});
 for(const x of [-9.7,25.7])add('garden-boundary-x'+x,x,.65,12,.15,1.3,40,'wood');for(const z of [-7.7,31.7])add('garden-boundary-z'+z,8,.65,z,36,1.3,.15,'wood');
 add('moon',-2,15,-6,1.4,1.4,1.4,'paper',false,{shape:'round',glow:true});
 const spawns={ground:{x:5.95,y:0,z:10.65,yaw:Math.PI},upstairs:{x:12,y:HEIGHT,z:4.15,yaw:-Math.PI/2,items:{key:1}},sound:{x:2.2,y:0,z:11.0,yaw:Math.PI},interactions:{x:3.3,y:0,z:3.6,yaw:-2.8,items:{key:1,batteries:1}}};
 return {boxes,objects,entryWindow,spawn:spawns[spawn]||spawns.ground,spawns,rooms:ROOMS,bounds:WORLD_BOUNDS,stair:STAIR,house:HOUSE};
}
