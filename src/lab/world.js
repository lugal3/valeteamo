// Deterministic, editable dollhouse layout. Metres: x/z horizontal, y upward.
export const HEIGHT = 3.15;
export const MATERIAL = {
  wallpaper: [0.75, 0.56, 0.65], wall2: [0.57, 0.61, 0.69], plaster: [0.68, 0.67, 0.72],
  wood: [0.47, 0.29, 0.30], floor: [0.48, 0.34, 0.38], tile: [0.38, 0.51, 0.52],
  velvet: [0.65, 0.33, 0.45], cream: [0.85, 0.76, 0.65], pink: [0.92, 0.59, 0.65],
  dark: [0.28, 0.24, 0.33], glass: [0.49, 0.63, 0.76], brass: [0.94, 0.68, 0.33],
  paper: [0.93, 0.84, 0.70], foliage: [0.43, 0.61, 0.43], carpet: [0.58, 0.37, 0.51],
  trim: [0.80, 0.60, 0.57], terracotta: [0.72, 0.42, 0.36], torchmetal: [0.43,0.47,0.60],
  torchglass:[0.96,0.82,0.53], glove:[0.96,0.88,0.86], pawpad:[0.94,0.57,0.69], bow:[0.78,0.22,0.37],
  glove: [0.98, 0.88, 0.84], pawpad: [0.96, 0.54, 0.62], torchmetal: [0.39, 0.47, 0.57], torchglass: [1.0, 0.93, 0.64], bow: [0.84, 0.23, 0.36]
};
const b = (id, x, y, z, w, h, d, mat, solid = true, extra = {}) => ({ id, x, y, z, w, h, d, mat, solid, ...extra });
const thing = (id, kind, label, x, y, z, extra = {}) => ({ id, kind, label, x, y, z, ...extra });

export function createHouse(spawn = 'ground') {
  const boxes = [], objects = [];
  const add = (...args) => { const v = b(...args); boxes.push(v); return v; };
  const obj = (...args) => { const v = thing(...args); objects.push(v); return v; };
  const wallX = (id, x, z0, z1, level = 0, mat = 'wallpaper') => add(id, x, level + 1.55, (z0 + z1) / 2, .20, 3.10, z1-z0, mat);
  const wallZ = (id, z, x0, x1, level = 0, mat = 'wallpaper') => add(id, (x0 + x1) / 2, level + 1.55, z, x1-x0, 3.10, .20, mat);
  // Foundation and second-storey slab leave a physical opening for the staircase.
  add('base', 6, -.20, 5, 12.4, .4, 10.4, 'floor');
  for (const y of [HEIGHT]) {
    add('floor-up-left', 4.25, y - .11, 5, 8.5, .22, 10, 'wood');
    add('floor-up-right-front', 10.25, y - .11, 2.25, 3.5, .22, 4.5, 'wood');
    add('floor-up-right-back', 10.25, y - .11, 9.62, 3.5, .22, .76, 'wood');
    add('floor-up-right-rim', 8.75, y - .11, 7.05, .5, .22, 5.1, 'wood');
  }
  add('roof', 6, 6.34, 5, 12.4, .23, 10.4, 'plaster');
  for (const level of [0, HEIGHT]) {
    wallX('outer-west-'+level, .0, 0, 10, level);
    wallX('outer-east-'+level, 12, 0, 10, level);
    wallZ('outer-north-'+level, 0, 0, 12, level);
    wallZ('outer-south-left-'+level, 10, 0, 5.25, level);
    if(level===0){
      // Genuine pass-through opening for the cinematic window (x≈10.2, y≈1.55).
      // Solid sill and header create a visible aperture rather than a camera teleport.
      wallZ('south-right-window-west',10,6.5,9.43);
      wallZ('south-right-window-east',10,10.97,12);
      add('south-window-sill',10.20,.40,10,1.54,.80,.20,'cream');
      add('south-window-lintel',10.20,2.65,10,1.54,1.0,.20,'wallpaper');
      add('south-window-open-left',9.43,1.48,10,.10,1.36,.22,'wood',false);
      add('south-window-open-right',10.97,1.48,10,.10,1.36,.22,'wood',false);
      add('south-window-upper-frame',10.20,2.16,10,1.58,.10,.22,'wood',false);
      add('south-window-lower-frame',10.20,.84,10,1.58,.10,.22,'wood',false);
      add('south-window-curtain-left',9.53,1.56,9.96,.17,1.24,.11,'pink',false);
      add('south-window-curtain-right',10.87,1.56,9.96,.17,1.24,.11,'pink',false);
    }else wallZ('outer-south-right-'+level, 10, 6.5, 12, level);
    // Front opening stays passable on both floors; a sliding door closes downstairs.
    add('south-lintel-'+level, 5.875, level+2.72, 10, 1.25, .75, .2, 'wallpaper');
    if(level === 0) {
      wallX('left-part-a', 4.05, 0, 1.85);
      wallX('left-part-b', 4.05, 3.1, 5.80);
      wallX('left-part-c', 4.05, 7.05, 10);
      add('left-lintel-a',4.05,2.73,2.475,.2,.74,1.25,'wallpaper');
      add('left-lintel-b',4.05,2.73,6.425,.2,.74,1.25,'wallpaper');
      wallX('right-part-a',7.65,0,1.85,0,'wall2');
      wallX('right-part-b',7.65,3.1,5.8,0,'wall2');
      wallX('right-part-c',7.65,8.25,10,0,'wall2');
      add('right-lintel-a',7.65,2.73,2.475,.2,.74,1.25,'wall2');
      add('right-lintel-b',7.65,2.73,7.025,.2,.74,2.45,'wall2');
    } else {
      wallX('upper-left-a',4.5,0,1.85,level,'wall2');
      wallX('upper-left-b',4.5,3.15,10,level,'wall2');
      add('upper-left-lintel',4.5,level+2.73,2.5,.2,.74,1.3,'wall2');
      wallX('upper-right-a',7.55,0,1.8,level,'wall2');
      wallX('upper-right-b',7.55,3.15,4.4,level,'wall2');
      add('upper-right-lintel',7.55,level+2.73,2.475,.2,.74,1.35,'wall2');
      wallZ('upper-bedroom-divider',5.4,0,4.5,level,'wall2');
    }
  }
  // Stairs: 12 visible risers and an invisible, continuous collision ramp.
  const stairZTop = 4.55, stairZBottom = 9.15;
  for(let i=0;i<12;i++) {
    const t=(i+.5)/12, z=stairZBottom-t*(stairZBottom-stairZTop), height=(i+1)*HEIGHT/12;
    add('step-'+i,9.75,height-.13,z,2.13,.26,(stairZBottom-stairZTop)/12+.03,'wood',false);
  }
  add('rail-left',8.58,1.76,6.84,.15,3.5,3.6,'wood',false);
  add('rail-right',10.92,1.76,6.84,.15,3.5,3.6,'wood',false);
  add('upper-railing',8.36,3.66,7.2,.16,1.05,4.1,'brass',false);
  // Sliding doors move aside completely; their actual collision boxes move with them.
  function door(id, x,y,z,w,d,slideAxis,slideDistance,label,locked=false) {
    const shape=add('door-'+id,x,y+1.1,z,w,2.2,d,'wood',true,{door:id});
    obj(id,'door',label,x,y+1.1,z,{box:shape,origin:{x,z},slideAxis,slideDistance,open:false,locked});
  }
  door('entrada',5.87,0,9.96,1.2,.11,'x',1.4,'Puerta de entrada');
  door('salon',7.65,0,2.48,.11,1.18,'z',1.5,'Puerta del salón');
  door('estudio',4.05,0,6.42,.11,1.18,'z',1.5,'Puerta del estudio');
  door('dormitorio',4.5,HEIGHT,2.52,.11,1.18,'z',1.55,'Dormitorio de Kitty',true);
  door('habitación',7.55,HEIGHT,2.52,.11,1.18,'z',1.55,'Habitación de recuerdos');
  // Furniture is boxy and spatial from every angle, not camera-facing flat sprites.
  add('sofa',9.95,.39,2.22,1.7,.78,.76,'velvet');
  add('sofa-back',9.95,.82,2.55,1.75,.68,.18,'pink');
  add('coffee-table',9.9,.38,3.47,1.3,.72,.75,'wood');
  add('living-rug',9.88,.025,3.0,2.7,.05,2.6,'carpet',false);
  add('lamp-base',11.25,.48,1.12,.4,.96,.4,'brass');
  add('lamp-shade',11.25,1.13,1.12,.66,.42,.66,'pink',false);
  add('kitchen-counter',1.2,.57,7.9,1.6,1.14,2.2,'tile');
  add('study-desk',2.6,.47,3.4,1.35,.94,.65,'wood');
  add('study-chair',2.55,.36,4.35,.67,.72,.6,'velvet');
  add('shelf',.58,1.00,2.25,.75,2.0,1.4,'wood');
  for(let i=0;i<3;i++) add('shelf-layer-'+i,.58,.5+i*.54,2.25,.8,.12,1.43,'brass',false);
  add('upper-bed',2.1,HEIGHT+.44,2.9,2.25,.88,2.7,'wood');
  add('upper-mattress',2.1,HEIGHT+.75,2.9,2.1,.24,2.5,'cream',false);
  add('upper-blanket',2.1,HEIGHT+.89,3.38,2.1,.08,1.55,'pink',false);
  add('pillow',2.1,HEIGHT+.92,1.91,1.5,.12,.55,'paper',false);
  add('bedside',3.76,HEIGHT+.38,2.0,.58,.76,.55,'wood');
  add('wardrobe',.56,HEIGHT+1.1,4.28,.9,2.2,1.15,'dark');
  add('wardrobe-face',1.04,HEIGHT+1.1,4.28,.06,1.9,1.08,'wood',false);
  add('top-desk',9.43,HEIGHT+.46,2.22,1.2,.92,.65,'wood');
  add('top-chair',9.4,HEIGHT+.35,3.22,.72,.70,.68,'velvet');
  add('top-bookshelf',11.2,HEIGHT+.96,1.15,.65,1.92,1.5,'wood');
  for(let i=0;i<3;i++) add('books-'+i,11.2,HEIGHT+.34+i*.54,1.15,.72,.2,1.25,i===1?'pink':'cream',false);
  // Decorative frames are textured 3D plates oriented to face the corridor.
  function frame(id,x,y,z,dir,art) {
    const vertical=dir==='west'||dir==='east';
    add('frame-'+id,x,y,z,vertical?.10:.85,.83,vertical?.85:.10,'wood',false);
    add('picture-'+id,x+(dir==='west'?-.058:dir==='east'?.058:0),y,z+(dir==='north'?-.058:dir==='south'?.058:0),vertical?.02:.74,.71,vertical?.74:.02,'paper',false,{art,front:dir});
    obj('picture-'+id,'picture','Cuadro de Kitty',x,y,z,{art,text:art===1?'Hay una manchita roja en la esquina. Antes no estaba ahí.':'Un recuerdo enmarcado. Alguien parece haberlo cambiado de lugar.'});
  }
  frame('garden',6.15,1.85,.18,'south',0);
  frame('stain',9.4,1.82,.18,'south',1);
  frame('bed',2.5,HEIGHT+1.9,.18,'south',2);
  frame('study',10.25,HEIGHT+1.85,.18,'south',3);
  // Flat opaque glass surfaces, with a little depth, avoid expensive alpha sorting.
  for(const [i,x,y,z] of [[0,2.0,1.84,.13],[2,2.0,HEIGHT+1.9,9.88],[3,10.4,HEIGHT+1.85,9.88]]) {
    add('window-frame-'+i,x,y,z,1.35,1.15,.10,'wood',false);
    add('window-pane-'+i,x,y,z+.06,1.17,.96,.05,'glass',false);
    add('window-cross-'+i,x,y,z+.1,.08,1.03,.08,'cream',false);
  }
  // Warm layered props: non-colliding so paths remain clear on mobile.
  // Baseboards and crown moulding add depth to all four rooms without a performance-heavy mesh.
  for(const floor of [0,HEIGHT]){
    for(const z of [.18,9.81]){
      for(const [id,x,width] of [['west',2.0,3.6],['hall',5.93,2.85],['east',9.85,3.55]]){
        add('baseboard-'+floor+'-'+z+'-'+id,x,floor+.14,z,width,.22,.12,'trim',false);
        add('crown-'+floor+'-'+z+'-'+id,x,floor+2.85,z,width,.12,.12,'brass',false);
      }
    }
  }
  const plant=(id,x,y,z)=>{
    add(id+'-pot',x,y+.24,z,.45,.46,.45,'terracotta',false);
    add(id+'-lip',x,y+.47,z,.51,.10,.51,'brass',false);
    for(let n=0;n<5;n++){
      const angle=n*6.28318/5;
      add(id+'-leaf-'+n,x+Math.cos(angle)*.18,y+.67+(.06*(n%2)),z+Math.sin(angle)*.18,.19,.49,.16,'foliage',false);
    }
  };
  plant('salon-plant',11.4,0,5.05);
  plant('study-plant',.67,0,5.05);
  plant('upper-plant',11.35,HEIGHT,4.45);
  plant('bedroom-plant',.7,HEIGHT,1.15);
  for(const [id,x,z,w,d] of [['hall-runner',5.87,6.15,1.25,2.2],['study-carpet',2.48,6.35,1.25,1.15],['upper-runner',5.9,6.38,1.25,2.0]]){
    add(id,x,id.startsWith('upper')?HEIGHT+.012:.012,z,w,.023,d,'carpet',false);
    add(id+'-stripe',x,id.startsWith('upper')?HEIGHT+.030:.030,z,w*.82,.02,d*.83,'pink',false);
  }
  for(const [id,x,y,z] of [['table-lantern',9.85,.93,3.45],['study-candle',2.45,.98,3.35],['upper-nightlight',3.72,HEIGHT+.92,2.06]]){
    add(id+'-base',x,y,z,.21,.09,.21,'brass',false);
    add(id+'-glass',x,y+.19,z,.18,.32,.18,'torchglass',false);
    add(id+'-cap',x,y+.38,z,.24,.09,.24,'dark',false);
  }
  for(let n=0;n<9;n++){
    const x=.9+(n%3)*.45,z=8.68+Math.floor(n/3)*.38;
    add('kitchen-floor-tile-'+n,x,.015,z,.36,.015,.31,n%2?'cream':'tile',false);
  }
  add('study-paper-stack',2.6,.98,3.45,.42,.06,.31,'paper',false);
  add('study-inkpot',2.95,1.04,3.25,.14,.15,.14,'dark',false);
  add('living-side-table',11.05,.31,4.2,.47,.62,.47,'wood',false);
  add('living-photo-frame',11.05,.68,4.2,.33,.33,.10,'brass',false);
  const drawer=add('drawer',2.6,.76,3.05,.76,.26,.38,'pink',false);
  obj('drawer','drawer','Cajón del escritorio',2.6,.76,3.03,{box:drawer,open:false,origin:{z:3.05}});
  obj('note-hall','note','Nota doblada',5.95,.87,4.9,{text:'El jardín era precioso. Pero anoche la casa respiró como si supiera mi nombre.'});
  obj('note-upper','note','Carta en el dormitorio',3.65,HEIGHT+.83,2.05,{text:'No sigas todas las luces rosadas. Hay recuerdos que brillan incluso cuando nadie los enciende.'});
  obj('battery-hall','battery','Pila pequeña',6.25,.32,7.65);
  obj('battery-living','battery','Pila junto al sofá',10.6,.38,2.82);
  obj('battery-upper','battery','Pila en el dormitorio',3.65,HEIGHT+.83,2.5);
  obj('key','key','Llave con lazo',2.58,.98,3.4);
  obj('bed','bed','Cama con lazo',2.1,HEIGHT+1.0,3.8,{returnX:3.6,returnZ:3.8});
  obj('underbed','hide','Esconderse bajo la cama',2.15,HEIGHT+.35,4.25,{hideType:'underbed',returnX:3.6,returnZ:4.2});
  obj('wardrobe','hide','Esconderse en el armario',1.12,HEIGHT+1.05,4.32,{hideType:'wardrobe',returnX:1.8,returnZ:4.35});
  obj('lamp','inspect','Lámpara encendida',11.25,1.15,1.12,{text:'Una luz cálida conserva el ambiente del salón.'});
  const spawns = {
    ground:{x:5.95,z:8.65,y:0,yaw:Math.PI},
    upstairs:{x:6.35,z:3.75,y:HEIGHT,yaw:2.7,items:{key:1}},
    sound:{x:10.1,z:3.75,y:0,yaw:2.8,items:{batteries:2}},
    interactions:{x:2.55,z:4.1,y:0,yaw:3.12,items:{batteries:1,key:1}}
  };
  return {boxes,objects,spawns,spawn:spawns[spawn]||spawns.ground};
}

export function stairHeight(x,z) {
  if(x>8.65 && x<10.85 && z>=4.55 && z<=9.15) return HEIGHT * (9.15-z)/(9.15-4.55);
  return null;
}
export function groundHeight(x,z,levelHint=0) {
  const stair=stairHeight(x,z); if(stair!==null) return stair;
  return levelHint>HEIGHT*.52?HEIGHT:0;
}
export function overlaps(box, x, footY, z, radius=.19, bodyHeight=1.65) {
  // A slab is a walking surface/visual occluder, not a wall to trap a head at stair landings.
  if(!box.solid||box.id.startsWith('floor-up-'))return false;
  return Math.abs(box.x-x)<box.w/2+radius && Math.abs(box.z-z)<box.d/2+radius
     && footY < box.y+box.h/2-.02 && footY+bodyHeight > box.y-box.h/2+.02;
}
export function blocked(boxes,x,footY,z,radius=.19,bodyHeight=1.65) {
  return boxes.some(box=>overlaps(box,x,footY,z,radius,bodyHeight));
}
export function segmentHitsBox(from,to,box,padding=0) {
  if(!box.solid)return false;
  let low=0, high=1;
  for(const axis of ['x','y','z']) {
    const center=box[axis], half=box[axis==='x'?'w':axis==='y'?'h':'d']/2+padding;
    const start=from[axis], delta=to[axis]-start;
    if(Math.abs(delta)<1e-8) {if(start<center-half||start>center+half)return false;continue;}
    const a=(center-half-start)/delta, c=(center+half-start)/delta;
    low=Math.max(low,Math.min(a,c));high=Math.min(high,Math.max(a,c));
    if(low>high)return false;
  }
  return high>.001 && low<.995;
}
export function lineBlocked(boxes,from,to,ignore='') {
  return boxes.some(box=>box.id!==ignore && !box.id.startsWith('step-') && segmentHitsBox(from,to,box));
}
export function setDoor(obj,open) {
  if(obj.kind!=='door')return;
  obj.open=Boolean(open); const {box,origin,slideAxis,slideDistance}=obj;
  box[slideAxis]=origin[slideAxis]+(obj.open?slideDistance:0);
  box.solid=!obj.open;
}
export function setDrawer(obj,open) {
  if(obj.kind!=='drawer')return;
  obj.open=Boolean(open);obj.box.z=obj.origin.z+(obj.open?.33:0);
}
