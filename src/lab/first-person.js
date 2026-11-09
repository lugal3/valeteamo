import {CHIBI,chibiPiece,placePieces,torchModel,grippingPaw} from './chibi-model.js';
const cache={};
export function climbingHandPieces(side){
 return cache['climb'+side]??=[
  chibiPiece('palm',0,0,0,.145,.085,.16),
  chibiPiece('thumb',side*.065,-.017,-.036,.057,.067,.09),
  ...[-.045,0,.045].map((x,i)=>chibiPiece('finger'+i,x,.005,-.082,.044,.058,.103)),
  chibiPiece('wrist',0,-.047,.095,.12,.10,.13),
  chibiPiece('cuff',0,-.07,.15,.155,.075,.18,CHIBI.pink)
 ];
}
export function flashlightPieces(flash){
 // Round white mitten wraps the grip, with a tucked thumb and three soft knuckles.
 // Forward-biased placement keeps the silhouette below and right of the reticle.
 return cache[flash?'on':'off']??=placePieces([...torchModel(flash),...grippingPaw()],{x:.47,y:-.34,z:1.0,scale:.85,prefix:'view-'});
}
