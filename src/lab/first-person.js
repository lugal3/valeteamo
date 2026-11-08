const cache={};
export function climbingHandPieces(side){
 return [
  {id:'palm',x:0,y:0,z:0,w:.13,h:.07,d:.15,mat:'glove',shape:'round'},
  {id:'thumb',x:side*.065,y:-.015,z:-.04,w:.045,h:.065,d:.09,mat:'glove',shape:'round'},
  ...[-.04,0,.04].map((x,i)=>({id:'finger'+i,x,y:.008,z:-.085,w:.036,h:.05,d:.10,mat:'glove',shape:'round'})),
  {id:'cuff',x:0,y:-.045,z:.12,w:.14,h:.13,d:.18,mat:'bow',shape:'round'}
 ];
}
export function flashlightPieces(flash){
 return cache[flash?'on':'off']??=(
  [
   {id:'torch-body',x:.66,y:-.43,z:.86,w:.12,h:.12,d:.50,mat:'torchmetal',shape:'cylinder'},
   {id:'torch-grip',x:.66,y:-.43,z:.72,w:.14,h:.14,d:.20,mat:'dark',shape:'cylinder'},
   {id:'torch-neck',x:.635,y:-.42,z:1.11,w:.155,h:.155,d:.08,mat:'brass',shape:'cylinder'},
   {id:'torch-reflector',x:.63,y:-.42,z:1.16,w:.18,h:.18,d:.045,mat:'torchmetal',shape:'cylinder'},
   {id:'torch-lens',x:.63,y:-.42,z:1.185,w:.155,h:.155,d:.016,mat:flash?'torchglass':'glass',shape:'cylinder',glow:flash},
   {id:'torch-switch',x:.66,y:-.358,z:.79,w:.04,h:.018,d:.065,mat:'bow'},
   {id:'hand-grip',x:.66,y:-.515,z:.71,w:.16,h:.12,d:.18,mat:'glove',shape:'round'},
   {id:'hand-thumb',x:.59,y:-.47,z:.76,w:.055,h:.09,d:.10,mat:'glove',shape:'round'},
   {id:'hand-fingers',x:.71,y:-.485,z:.76,w:.05,h:.08,d:.14,mat:'glove',shape:'round'},
   {id:'sleeve',x:.67,y:-.66,z:.66,w:.17,h:.20,d:.16,mat:'bow'}
  ]
 );
}
