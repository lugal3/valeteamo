// One visual language for the view-model, climbing paws and the mirror avatar.
export const CHIBI={white:[.995,.956,.91],ink:[.115,.075,.09],pink:[.95,.63,.73],blue:[.35,.64,.81],red:[.84,.19,.26],gold:[1,.74,.26],metal:[.36,.45,.56],grip:[.19,.24,.32],lens:[1,.94,.68]};
export function chibiPiece(id,x,y,z,w,h,d,color=CHIBI.white,extra={}){
 return {id,x,y,z,w,h,d,mat:'glove',color,shape:'round',smooth:true,chibi:true,segments:20,rings:12,solid:false,...extra};
}
export function placePieces(parts,{x=0,y=0,z=0,scale=1,prefix=''}={}){
 return parts.map(p=>({...p,id:prefix+p.id,x:x+p.x*scale,y:y+p.y*scale,z:z+p.z*scale,w:p.w*scale,h:p.h*scale,d:p.d*scale}));
}
export function torchModel(flash=true){
 const add=(id,x,y,z,w,h,d,color,extra={})=>chibiPiece('torch-'+id,x,y,z,w,h,d,color,{shape:'lathe',segments:24,...extra});
 return [
  add('body',0,0,0,.145,.145,.49,CHIBI.metal),
  add('grip',0,0,-.11,.155,.155,.25,CHIBI.grip),
  ...[-.19,-.145,-.10,-.055].map((z,i)=>add('grip-ring'+i,0,0,z,.162,.162,.018,[.25,.31,.39])),
  add('end-cap',0,0,-.258,.15,.15,.045,CHIBI.metal),
  add('head',0,0,.228,.225,.225,.17,CHIBI.metal,{profile:[[-.5,0],[-.5,.63],[-.35,.7],[.2,.98],[.4,1],[.5,.94],[.5,0]]}),
  add('rim',0,0,.318,.229,.229,.035,CHIBI.gold),
  add('lens',0,0,.34,.187,.187,.014,flash?CHIBI.lens:[.37,.51,.64],{emissive:flash}),
  chibiPiece('torch-switch',0,.079,-.045,.052,.026,.08,CHIBI.red,{segments:16,rings:8}),
  chibiPiece('torch-lens-highlight',-.037,.039,.35,.032,.048,.008,[1,.99,.91],{segments:12,rings:6,emissive:true})
 ];
}
export function grippingPaw(){
 const add=(id,x,y,z,w,h,d,color=CHIBI.white,extra={})=>chibiPiece('hand-'+id,x,y,z,w,h,d,color,extra);
 return [
  add('palm',.005,-.10,-.125,.187,.16,.215),
  add('thumb',-.077,-.025,-.105,.092,.112,.139,CHIBI.white,{pitch:-.3}),
  ...[-.186,-.128,-.070].map((z,i)=>add('knuckle'+i,.075,-.023,z,.066,.092,.075)),
  add('wrist',.008,-.205,-.15,.132,.16,.14),
  add('cuff',.008,-.265,-.16,.18,.065,.18,CHIBI.pink),
  add('sleeve',.008,-.35,-.18,.185,.16,.19,CHIBI.pink)
 ];
}
