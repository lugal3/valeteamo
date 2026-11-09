import {chibiPiece,CHIBI} from './chibi-model.js';
export function phonePieces(){return [
 chibiPiece('phone-body',0,.02,0,.18,.32,.032,CHIBI.pink,{shape:'rounded-box',smooth:false,roundness:.12}),
 chibiPiece('phone-screen',0,.03,-.019,.148,.253,.006,[.13,.18,.27],{emissive:true,shape:'rounded-box',smooth:false,roundness:.08}),
 chibiPiece('phone-speaker',0,.158,-.024,.045,.007,.005,[.25,.15,.24]),
 chibiPiece('phone-notification',0,.08,-.025,.115,.045,.004,[.92,.68,.78],{emissive:true}),
 ...[-.045,0,.045].map((x,i)=>chibiPiece('phone-app'+i,x,-.04,-.025,.028,.028,.004,[.65,.8,.85],{emissive:true})),
 chibiPiece('phone-grip',0,-.14,.035,.14,.10,.09),chibiPiece('phone-thumb',-.084,-.09,-.006,.045,.09,.06),chibiPiece('phone-cuff',0,-.23,.06,.15,.12,.12,CHIBI.pink)
];}
