export function pursuerPieces(){
 const parts=[],add=(id,x,y,z,w,h,d,color,extra={})=>parts.push({id,x,y,z,w,h,d,color,solid:false,chibi:true,...extra});
 const coat=[.16,.18,.22],cloth=[.10,.12,.16];
 add('coat',0,.91,0,.65,.95,.36,coat,{shape:'round',segments:10,rings:5});
 add('hood',0,1.63,0,.52,.55,.46,cloth,{shape:'round',segments:10,rings:6});
 add('face',0,1.64,.21,.31,.25,.035,[.055,.06,.08]);
 for(const side of [-1,1]){add('eye'+side,side*.09,1.67,.234,.035,.025,.016,[.88,.72,.42],{emissive:true});add('arm'+side,side*.36,1.03,.02,.17,.69,.20,cloth);add('hand'+side,side*.37,.67,.04,.15,.18,.16,[.32,.31,.32]);add('leg'+side,side*.17,.29,0,.20,.50,.22,cloth);add('shoe'+side,side*.17,.08,.055,.23,.16,.34,[.08,.09,.11]);}
 return parts;
}
