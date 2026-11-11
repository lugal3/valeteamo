function noteModel(piece,note){
 const yaw=note.mirrored?.25:-.12,c=Math.cos(yaw),s=Math.sin(yaw);
 const paper=[.96,.86,.69],crease=[.69,.55,.43],ink=[.23,.16,.22];
 const sheet=(id,x,y,z,w,h,d,color,extra={})=>piece(id,x*c-z*s,y,x*s+z*c,w,h,d,'paper',{color,yaw,...extra});
 return [
  sheet('edge',0,-.045,0,.37,.012,.255,[.78,.65,.49]),
  sheet('face',0,-.035,.008,.365,.008,.24,paper),
  sheet('fold-shadow',0,-.030,-.065,.35,.002,.01,crease),
  sheet('fold',0,-.028,-.097,.357,.012,.057,[1,.9,.73],{pitch:.13}),
  sheet('margin',-.132,-.029,.023,.004,.002,.145,[.74,.41,.40]),
  ...[[.000,.001,.215],[.015,.027,.185],[-.006,.053,.196],[-.031,.077,.146]].map(([x,z,w],i)=>
   sheet('ink-'+i,x,-.029,z,w,.002,.004,ink)),
  sheet('ink-sign',.093,-.029,.102,.050,.002,.007,[.67,.35,.43],{yaw:yaw+.22})
 ];
}

function batteryModel(piece){
 const metal=[.69,.72,.76],copper=[.86,.49,.23];
 const roll=1.12,yaw=.48;
 const section=(id,y,w,h,d,mat,extra)=>{
  const x=-y*Math.sin(roll);
  return piece(id,x*Math.cos(yaw),y*Math.cos(roll)-.012,x*Math.sin(yaw),w,h,d,mat,{roll,yaw,...extra});
 };
 const ring=(id,y,diameter,height,color,mat='torchmetal')=>section(id,y,diameter,height,diameter,mat,{color,shape:'cylinder',segments:16});
 return [
  ring('base',-.114,.136,.028,metal),
  ring('wrapper',-.031,.138,.148,[.22,.29,.40],'paper'),
  ring('label-stripe',-.055,.140,.028,[.47,.62,.70],'paper'),
  ring('shoulder',.066,.138,.053,copper),
  ring('insulator',.096,.132,.009,[.19,.20,.24]),
  ring('positive',.110,.064,.028,metal),
  section('plus-vertical',.125,.005,.002,.031,'paper',{color:[.24,.23,.26]}),
  section('plus-horizontal',.125,.031,.002,.005,'paper',{color:[.24,.23,.26]})
 ];
}

function keyModel(piece){
 const pieces=[];
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4;
  pieces.push(piece('ring-'+i,Math.cos(angle)*.065,0,Math.sin(angle)*.065-.055,.045,.025,.045,'brass',{glow:true}));
 }
 pieces.push(piece('shaft',0,0,.08,.035,.025,.18,'brass',{glow:true}),piece('tooth',.028,0,.13,.07,.025,.025,'brass',{glow:true}),
  piece('bow-left',-.045,.025,-.055,.065,.035,.04,'pink',{glow:true,baseYaw:-.15}),piece('bow-right',.045,.025,-.055,.065,.035,.04,'pink',{glow:true,baseYaw:.15}));
 return pieces;
}

export function pickupGeometry(objects){
 return objects.flatMap(o=>{
  if(o.taken||o.concealed&&!o.dynamic)return [];
  const piece=(id,dx,dy,dz,w,h,d,mat,extra)=>({id:'pickup-'+o.id+'-'+id,x:o.x+dx,y:o.y+dy,z:o.z+dz,w,h,d,mat,
   solid:false,dynamic:true,source:o,sourceOffset:[dx,dy,dz],...extra});
  if(o.kind==='note')return noteModel(piece,o);
  if(o.kind==='battery')return batteryModel(piece);
  if(o.kind==='key')return keyModel(piece);
  return [];
 });
}
