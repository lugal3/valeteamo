import {chibiPiece,CHIBI} from './chibi-model.js';
import {SAFE_CODE} from './mirror-safe.js';
export function phonePieces(){return [
 chibiPiece('phone-body',0,.02,0,.18,.32,.032,CHIBI.pink,{shape:'rounded-box',smooth:false,roundness:.12}),
 chibiPiece('phone-screen',0,.03,-.019,.148,.253,.006,[.13,.18,.27],{emissive:true,shape:'rounded-box',smooth:false,roundness:.08}),
 chibiPiece('phone-speaker',0,.158,-.024,.045,.007,.005,[.25,.15,.24]),
 chibiPiece('phone-notification',0,.08,-.025,.115,.045,.004,[.92,.68,.78],{emissive:true}),
 chibiPiece('phone-frame-left',-.093,.025,0,.008,.27,.025,[.64,.42,.53],{smooth:false}),
 chibiPiece('phone-side-button',.094,.07,0,.009,.054,.016,[.90,.69,.74],{smooth:false}),
 chibiPiece('phone-rear-camera',-.055,.13,.022,.036,.038,.012,[.24,.23,.31]),
 chibiPiece('phone-camera-lens',-.055,.13,.030,.018,.018,.006,[.12,.21,.28]),
 chibiPiece('phone-home-bar',0,-.102,-.026,.052,.006,.003,[.92,.83,.88],{smooth:false,emissive:true}),
 ...[-.045,0,.045].map((x,i)=>chibiPiece('phone-app'+i,x,-.04,-.025,.028,.028,.004,[.65,.8,.85],{emissive:true})),
 chibiPiece('phone-grip',0,-.14,.035,.14,.10,.09),chibiPiece('phone-thumb',-.084,-.09,-.006,.045,.09,.06),chibiPiece('phone-cuff',0,-.23,.06,.15,.12,.12,CHIBI.pink)
];}

export function notePieces(scale=1,mirrored=true){
 const box=(id,x,y,z,w,h,d,color)=>chibiPiece(id,x,y,z,w,h,d,color,{shape:'box',smooth:false,mat:'paper'});
 const paper=[
  box('paper-edge',0,.12,.044,.377,.232,.004,[.71,.57,.41]),
  box('paper',0,.12,.044,.375,.228,.006,[1,.89,.67]),
  box('paper-crease',0,.19,.048,.35,.004,.002,[.78,.65,.50]),
  box('paper-rule',0,.054,.040,.35,.003,.002,[.76,.65,.52])
 ];
 const segments=[[0,.052],[.022,.026],[.022,-.026],[0,-.052],[-.022,-.026],[-.022,.026],[0,0]];
 const digits={0:[0,1,2,3,4,5],1:[1,2],5:[0,5,6,2,3]};
 if(!mirrored)for(let i=0;i<3;i++)paper.push(box('rule-'+i,-.024,.081+i*.035,.049,.21-i*.032,.005,.002,[.31,.23,.23]));
 for(const [i,digit] of (mirrored?[...SAFE_CODE]:[]).entries()){
  for(const segment of digits[digit]){
   const [x,y]=segments[segment],horizontal=[0,3,6].includes(segment),center=(i-1.5)*.078;
   const width=horizontal?.04:.011,height=horizontal?.011:.04;
   paper.push(box('ink-front-'+i+'-'+segment,center+x,.12+y,.049,width,height,.002,[.17,.11,.18]));
   paper.push(box('ink-back-'+i+'-'+segment,-center-x,.12+y,.039,width,height,.002,[.45,.33,.32]));
  }
 }
 // Resize the sheet around the gripping thumb so the reflected ink stays legible.
 const sheet=paper.map(piece=>({...piece,x:.116+(piece.x-.116)*scale,y:.025+(piece.y-.025)*scale,w:piece.w*scale,h:piece.h*scale}));
 return [...sheet,chibiPiece('note-grip',.10,-.023,.067,.13,.12,.10),chibiPiece('note-thumb',.116,.025,.017,.054,.075,.043),chibiPiece('note-cuff',.12,-.105,.102,.15,.10,.115,CHIBI.pink)];
}

export function keyPieces(red){
 const color=red?[.85,.15,.18]:[.91,.68,.29];
 const shaft=chibiPiece('held-key-shaft',.03,.113,.02,.031,.148,.018,color,{smooth:false});
 const teeth=[.151,.174].map((y,i)=>chibiPiece('held-key-tooth-'+i,.057,y,.02,.048,.018,.018,color,{smooth:false}));
 const ring=Array.from({length:8},(_,i)=>chibiPiece('held-key-ring-'+i,.03+.048*Math.cos(i*Math.PI/4),.027+.048*Math.sin(i*Math.PI/4),.02,.035,.031,.026,color,{smooth:false}));
 return [shaft,...teeth,...ring,chibiPiece('held-key-paw',.015,-.019,.039,.133,.106,.087),chibiPiece('held-key-cuff',.014,-.106,.065,.146,.107,.10,CHIBI.pink)];
}
