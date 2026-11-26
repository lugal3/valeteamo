// Added scenery has no collision. Small mesh details share the existing
// static batch and deliberately avoid the window entry and door sweeps.
export function installHolidayAmbience(add,obj,height){
 const decor=(id,x,y,z,w,h,d,mat,extra={})=>add('v3-'+id,x,y,z,w,h,d,mat,false,{castShadow:false,...extra});
 // Layered window fabric with pleats, brass rods and ties. Same positions as
 // the existing side windows, not over the entry or the key-fetch vent.
 for(const [id,level,z] of [['living',0,8.5],['reading',height,8.5],['study',0,2]]){
  const fabric=id==='study'?[.35,.33,.41]:[.68,.42,.52];
  decor('curtain-rod-'+id,.24,level+2.43,z,.055,.055,1.72,'brass');
  for(const side of [-1,1]){
   const edge=z+side*.61;
   for(let i=0;i<4;i++)decor('curtain-fold-'+id+side+i,.24+.029*Math.sin(i*1.6),level+1.64,edge+(i-1.5)*.105,.075,1.46,.119,'velvet',{color:fabric,shape:'rounded-box',roundness:.15,segments:4,rings:2});
   decor('curtain-tie-'+id+side,.299,level+1.23,edge,.06,.09,.38,'brass',{color:[.73,.56,.35]});
  }
 }
 // Quiet holiday wreaths on wall surfaces, never on moving doors.
 for(const [id,x,y,z,yaw] of [['hall',6.98,1.91,11.84,0],['reading',2.48,height+1.88,11.83,0]]){
  decor('wreath-'+id,x,y,z,.50,.50,.085,'foliage',{shape:'torus',majorRadius:.19,tubeRadius:.058,segments:10,tubeSegments:4,yaw,color:[.31,.48,.35]});
  for(const [i,dx,dy] of [[0,-.14,.11],[1,.14,.11],[2,-.14,-.12],[3,.14,-.12]])decor('wreath-berry-'+id+i,x+dx,y+dy,z-.05,.065,.065,.035,'bow',{color:[.83,.24,.35]});
  decor('wreath-bow-'+id,x,y-.20,z-.06,.24,.075,.055,'bow',{color:[.91,.45,.56]});
 }
 // Actual art tiles in small tabletop frames, books with paper edges.
 const picture=(id,x,y,z,art)=>{
  decor('photo-back-'+id,x,y,z,.24,.28,.035,'wood',{roll:.05});
  decor('photo-face-'+id,x,y,z+.023,.205,.24,.009,'paper',{art,front:'south',roll:.05});
 };
 picture('study',2.12,1.083,4.25,12);
 picture('reading',1.68,height+1.075,8.05,2);
 for(const [i,x,y,z] of [[0,2.33,.952,9.43],[1,1.63,height+.947,7.78],[2,3.96,height+.985,1.52]]){
  decor('book-cover-'+i,x,y,z,.24,.034,.17,'wood',{yaw:.14,color:i===1?[.47,.31,.46]:[.47,.30,.26]});
  decor('book-pages-'+i,x,y+.021,z,.223,.012,.155,'paper',{yaw:.14});
 }
 // Small counter appliances and optional inspection text. Surface coordinates
 // come from the real counters; no changes to refrigerator/oven geometry.
 decor('kettle-body',11.55,1.08,.51,.22,.25,.22,'torchmetal',{shape:'round',segments:8,rings:4,color:[.43,.49,.53]});
 decor('kettle-lid',11.55,1.215,.51,.15,.034,.15,'dark');
 decor('kettle-spout',11.67,1.105,.51,.16,.055,.063,'torchmetal',{roll:.37});
 decor('kettle-handle',11.42,1.12,.51,.072,.16,.052,'dark');
 obj('inspect-kettle','inspect','Hervidor',11.55,1.11,.70,{text:'Está desenchufado. Una gota de agua quedó junto al interruptor.'});
 decor('toaster',11.91,1.055,.51,.31,.18,.20,'torchmetal',{shape:'rounded-box',roundness:.14,segments:5,rings:3});
 for(const x of [11.85,11.97])decor('toaster-slot-'+x,x,1.15,.51,.022,.009,.125,'dark');
 obj('inspect-toaster','inspect','Tostadora',11.91,1.12,.69,{text:'Dos ranuras vacías. Nadie ha preparado el desayuno.'});
 // Bath ceramic accents, a tiled backsplash and a glass-side vapor mask.
 for(let i=0;i<5;i++)decor('bath-tile-border-'+i,7.62,.45+i*.23,7.22,.024,.213,.28,'tile',{surface:'glaze',color:i%2?[.48,.63,.66]:[.63,.75,.77]});
 for(let i=0;i<4;i++)decor('bath-steam-'+i,9.38+(i%2)*.16,1.32+i*.21,6.04+(i%2)*.09,.24,.29,.035,'glass',{atmosphere:'steam',color:[.65,.74,.81]});
 // Small opaque motes only become visible inside the real flashlight beam
 // and are occluded by ordinary scene depth. No HUD overlay.
 for(const [id,x,y,z] of [['study',2.2,1.5,2.6],['hall',6.0,1.4,7.3],['reading',2.2,height+1.4,7.6],['music',10.6,height+1.4,2.1],['bath',8.7,1.5,5.6]]){
  for(let i=0;i<5;i++)decor('beam-dust-'+id+i,x+Math.sin(i*2.3)*.42,y+(i%3-1)*.19,z+Math.cos(i*1.7)*.46,.009+(i%2)*.004,.014,.009,'paper',{atmosphere:'dust',color:[.87,.83,.69]});
 }
}
