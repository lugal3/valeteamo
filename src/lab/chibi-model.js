// One visual language for the view-model, climbing paws and the mirror avatar.
export const CHIBI={white:[.995,.956,.91],ink:[.115,.075,.09],pink:[.95,.63,.73],blue:[.35,.64,.81],red:[.84,.19,.26],gold:[1,.74,.26],metal:[.36,.45,.56],grip:[.19,.24,.32],lens:[1,.94,.68]};
export function chibiPiece(id,x,y,z,w,h,d,color=CHIBI.white,extra={}){
 return {id,x,y,z,w,h,d,mat:'glove',color,shape:'round',smooth:true,chibi:true,segments:20,rings:12,solid:false,...extra};
}
export function placePieces(parts,{x=0,y=0,z=0,scale=1,prefix=''}={}){
 return parts.map(p=>({...p,id:prefix+p.id,x:x+p.x*scale,y:y+p.y*scale,z:z+p.z*scale,w:p.w*scale,h:p.h*scale,d:p.d*scale}));
}
export function torchModel(flash=true){
 const add=(id,x,y,z,w,h,d,color,extra={})=>chibiPiece('torch-'+id,x,y,z,w,h,d,color,{shape:'lathe',segments:10,...extra});
 const switchY=flash?.069:.077;
 return [
  add('body',0,0,-.01,.142,.142,.42,CHIBI.metal,{profile:[[-.5,0],[-.46,.92],[.46,.92],[.5,0]]}),
  add('grip',0,0,-.11,.152,.152,.22,CHIBI.grip,{profile:[[-.5,0],[-.4,.98],[.4,.98],[.5,0]]}),
  add('end-cap',0,0,-.23,.148,.148,.04,CHIBI.metal,{profile:[[-.5,0],[0,1],[.5,0]]}),
  add('head',0,0,.21,.215,.215,.15,CHIBI.metal,{segments:12,profile:[[-.5,0],[-.3,.7],[.2,.98],[.5,.94],[.5,0]]}),
  add('rim',0,0,.29,.218,.218,.03,CHIBI.gold,{segments:12,profile:[[-.5,0],[0,1],[.5,0]]}),
  add('lens',0,0,.305,.18,.18,.012,flash?CHIBI.lens:[.37,.51,.64],{segments:12,emissive:flash,profile:[[-.5,0],[0,.95],[.5,0]]}),
  add('lens-halo',0,0,.302,.202,.202,.01,flash?[1,.92,.65]:[.35,.45,.55],{segments:12,emissive:flash,profile:[[-.5,0],[0,.98],[.5,0]]}),
  chibiPiece('torch-switch',0,switchY,-.045,.045,.022,.068,CHIBI.red,{segments:8,rings:3}),
  chibiPiece('torch-lens-highlight',-.032,.035,.312,.026,.038,.006,[1,.99,.91],{segments:6,rings:3,emissive:true}),
  // Mini charm bow attached to the torch handle
  chibiPiece('torch-charm-knot',.075,-.03,-.19,.036,.036,.03,CHIBI.red,{segments:6,rings:3}),
  chibiPiece('torch-charm-left',.075,.005,-.19,.052,.042,.024,CHIBI.red,{segments:6,rings:3,roll:.35}),
  chibiPiece('torch-charm-right',.075,-.065,-.19,.052,.042,.024,CHIBI.red,{segments:6,rings:3,roll:-.35})
 ];
}
export function grippingPaw(){
 const add=(id,x,y,z,w,h,d,color=CHIBI.white,extra={})=>chibiPiece('hand-'+id,x,y,z,w,h,d,color,extra);
 return [
  add('palm',.005,-.095,-.125,.182,.155,.205,CHIBI.white,{segments:10,rings:5}),
  add('thumb',-.072,-.022,-.105,.088,.105,.13,CHIBI.white,{segments:8,rings:4,pitch:-.3}),
  ...[-.18,-.125,-.07].map((z,i)=>add('knuckle'+i,.072,-.022,z,.062,.085,.07,CHIBI.white,{segments:6,rings:3})),
  add('wrist',.008,-.195,-.148,.128,.15,.135,CHIBI.white,{segments:8,rings:3}),
  add('cuff',.008,-.255,-.158,.175,.06,.175,CHIBI.pink,{segments:10,rings:3}),
  add('sleeve',.008,-.335,-.175,.18,.15,.185,CHIBI.pink,{segments:10,rings:3})
 ];
}
