export const VENT_BASE=1.28;

// The cover moves as one rigid grille. Its stored offsets keep the frame,
// louvers and handle together even when a checkpoint skips the animation.
export function installVentCover(add){
 const parts=[];
 const piece=(id,x,y,z,w,h,d,pitch=0,mat='torchmetal')=>{
  const box=add('vent-cover-'+id,2.8+x,VENT_BASE+.31+y,1.87+z,w,h,d,mat,false,{dynamic:true,pitch});
  parts.push({box,x,y,z,pitch});
 };
 for(const side of [-1,1]){
  piece('side'+side,side*.38,0,0,.055,.59,.052);
  piece('edge'+side,0,side*.27,0,.72,.05,.052);
 }
 for(let i=0;i<6;i++)piece('louver'+i,0,-.20+i*.078,0,.71,.048,.07,-.38);
 piece('handle',0,.22,.047,.16,.035,.045,0,'brass');
 return parts;
}

export function poseVentCover(vent,amount){
 vent.coverAmount=amount;
 const t=amount*amount*(3-2*amount),angle=t*Math.PI/2,c=Math.cos(angle),s=Math.sin(angle);
 for(const {box,x,y,z,pitch} of vent.cover){
  box.x=2.8+x+.88*t;
  box.y=(VENT_BASE+.31)*(1-t)+.065*t+.24*Math.sin(Math.PI*t)+y*c-z*s;
  box.z=1.87+.25*Math.sin(Math.PI*t)+y*s+z*c;
  box.pitch=pitch+angle;
 }
}

export function removeVentCover(vent,reduced){
 if(vent.unlatched)return false;
 vent.unlatched=true;
 if(reduced)poseVentCover(vent,1);
 return true;
}

export function advanceVentCover(vent,dt){
 if(vent.unlatched&&vent.coverAmount<1)poseVentCover(vent,Math.min(1,vent.coverAmount+dt/.85));
}
