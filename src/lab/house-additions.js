import {KITCHEN_BAR,KITCHEN_HIDE_SPOT} from './kitchen-hide-layout.js';
export const PIANO_NOTES=['Do','Re','Mi','Fa','Sol','La','Si','Do agudo'];
export const PIANO_KEYS=['a','s','d','f','g','h','j','k'];
export const PIANO_SCORE=[0,2,4,5,4,2,1,0];

export function installPiano(add,obj,{x,z,floor}){
 const wood={color:[.34,.22,.18]};
 const part=(id,dx,y,dz,w,h,d,mat='wood',solid=false,extra={})=>add('piano-'+id,x-dx,floor+y,z-dz,w,h,d,mat,solid,{...wood,...extra});
 part('case',0,.79,0,.60,1.58,1.75,'wood',true);
 part('crown',0,1.58,0,.66,.085,1.85,'trim');
 part('front',.314,1.24,0,.032,.41,1.61,'wood',false,{color:[.46,.31,.22]});
 for(const offset of [-.72,0,.72])part('bead-'+offset,.335,1.26,offset,.032,.33,.048,'brass');
 part('keybed',.42,.874,0,.31,.11,1.73,'wood',true);
 for(const offset of [-.78,.78])part('cheek-'+offset,.45,.96,offset,.32,.11,.14);
 const keys=PIANO_NOTES.map((_,i)=>part('key-'+i,.44,.95,(i-3.5)*.176,.29,.038,.164,'cream',false,{dynamic:true,color:[.91,.82,.68]}));
 for(const i of [0,1,3,4,5])part('black-'+i,.40,.982,(i-3)*.176,.17,.034,.071,'dark',false,{color:[.14,.12,.13]});
 part('score',.339,1.35,0,.025,.25,.47,'paper',false,{color:[.88,.78,.58],pitch:-.08});
 for(let i=0;i<5;i++)part('staff-'+i,.355,1.30+i*.018,0,.008,.005,.38,'dark');
 for(let i=0;i<8;i++)part('ink-'+i,.362,1.30+PIANO_SCORE[i]*.011,(i-3.5)*.046,.008,.019,.027,'dark');
 part('bench',.86,.49,0,.34,.075,.87,'velvet',true,{color:[.42,.22,.26]});
 for(const dx of [.74,.98])for(const dz of [-.36,.36])part('bench-leg-'+dx+dz,dx,.225,dz,.054,.45,.065,'wood',true);
 return obj('piano','piano','Piano antiguo',x-.49,floor+1.1,z,{keys,keyHeight:floor+.95,handOffsetX:-.15,
  seat:{x:x-.86,y:floor+1.24,z,yaw:Math.PI/2,pitch:-.39}});
}

export function decorateKitchen(add){
 add('pantry-wall-shelf',11.91,1.67,.26,1.16,.068,.28,'wood',false);
 for(const x of [11.47,12.35])add('pantry-shelf-bracket-'+x,x,1.54,.26,.048,.23,.20,'torchmetal',false);
 for(const [i,x,height,color] of [[0,11.51,.23,[.58,.35,.26]],[1,11.76,.29,[.71,.61,.39]],[2,12.04,.19,[.44,.51,.36]],[3,12.30,.26,[.49,.39,.53]]]){
  add('pantry-jar-'+i,x,1.71+height/2,.26,.15,height,.15,'ceramica',false,{shape:'cylinder',segments:10,color});
  add('pantry-lid-'+i,x,1.72+height,.26,.17,.034,.17,'brass',false,{shape:'cylinder',segments:10});
  add('pantry-label-'+i,x,1.71+height*.44,.34,.093,.067,.009,'paper',false);
 }
 // Props live on the newly rotated top; no floating fruit/towels left
 // at the obsolete side-on island location.
 add('island-fruit-dish',KITCHEN_BAR.x,1.173,3.17,.31,.040,.31,'ceramica',false,
  {shape:'round',segments:12,rings:6,color:[.84,.76,.59]});
 for(const [i,x,z,color] of [[0,10.93,3.13,[.69,.24,.23]],[1,11.06,3.23,[.71,.48,.18]],[2,11.12,3.09,[.55,.60,.25]]])
  add('island-fruit-'+i,x,1.25,z,.13,.13,.13,'paper',false,
   {shape:'round',segments:10,rings:6,color});
 for(let i=0;i<2;i++)add('island-towel-'+i,11.12,1.155+i*.018,2.99,
  .22-i*.016,.018,.25-i*.018,'velvet',false,
  {color:i%2?[.74,.62,.49]:[.42,.51,.45]});
 add('prep-recipe-book',13.48,1.01,2.70,.26,.040,.21,'wood',false,{color:[.43,.26,.28],yaw:.11});
 add('prep-recipe-pages',13.48,1.031,2.70,.237,.008,.188,'paper',false,{yaw:.11});
}

export function installKitchenBar(add,obj){
 const {x,z,depth,length}=KITCHEN_BAR;
 // Facing the kitchen doorway: long dimension is now Z, not X.
 // A solid, opaque front panel conceals Louis on the rear/EAST side,
 // including while he crouches, and leaves a walkable corridor around
 // the NORTH end. No invisible clipping walls or teleport shortcuts.
 add('kitchen-bar-top',x,1.045,z,depth,.105,length,'stone',true,
  {surface:'counter-stone',color:[.56,.51,.47]});
 add('kitchen-bar-screen',x-depth/2+.07,.50,z,.14,.99,length-.16,'wood',true,
  {color:[.42,.29,.23]});
 // Plinth hides the floor gap but does not add collision cost.
 add('kitchen-bar-plinth',x-depth/2+.095,.10,z,.17,.19,length-.19,'wood',false,
  {color:[.31,.22,.18]});
 for(const pz of [z-length/2+.09,z,z+length/2-.09])
  add('kitchen-bar-stile-'+pz,x-depth/2-.016,.50,pz,.060,.91,.075,'trim',false,
   {color:[.56,.37,.26]});
 add('kitchen-bar-edge',x-depth/2-.017,1.008,z,.055,.068,length+.025,'brass',false,
  {color:[.60,.45,.28]});
 // Two slim back supports instead of the earlier full-length side slab:
 // players and Louis can physically walk behind the counter.
 for(const pz of [z-length/2+.16,z+length/2-.16])
  add('kitchen-bar-back-leg-'+pz,x+depth/2-.09,.48,pz,.085,.95,.085,'wood',true,
   {color:[.44,.30,.25]});
 // Existing preparation bench is reused against the east kitchen wall.
 add('kitchen-prep-top',13.58,.94,2.26,.62,.082,1.26,'stone',true,
  {surface:'counter-stone'});
 for(const pz of [1.72,2.80])
  add('kitchen-prep-leg-'+pz,13.37,.45,pz,.080,.90,.085,'wood',true);
 add('kitchen-prep-board',13.53,.993,2.28,.32,.034,.51,'wood',false);
 // Keep the puzzle key on the new front-facing worktop.
 obj('red-key','key','Llave roja',x-.02,1.112,z+.05,{red:true});
 obj('hide-kitchen','hide','Agacharse detrás del mesón',
  KITCHEN_HIDE_SPOT.x,.83,KITCHEN_HIDE_SPOT.z,{
   requiresCrouch:true,hideType:'kitchen',
   returnX:12.10,returnZ:.89,
   hideCamera:{x:12.22,y:.67,z:2.54,yaw:-Math.PI/2,pitch:0}
  });
}
export function installExtraHides(add,obj){
 add('shower-tray',7.96,.035,6.91,.68,.07,.68,'ceramica',false);
 add('shower-pipe',7.71,1.56,7.16,.028,1.39,.028,'torchmetal',false);
 add('shower-head',7.85,2.19,7.16,.23,.055,.13,'torchmetal',false);
 add('shower-rail',8.32,2.25,6.94,.043,.043,.78,'brass',false);
 for(let i=0;i<6;i++)add('shower-fold-'+i,8.32+(i%2)*.018,1.29,6.63+i*.115,.055,1.82,.12,'velvet',true,{color:[.40,.57,.56]});
 obj('hide-shower','hide','Esconderse en la ducha',7.98,1.06,6.60,{hideType:'shower',returnX:8.05,returnZ:6.30,hideCamera:{x:7.94,y:1.28,z:7.00,yaw:Math.PI,pitch:0}});
 const x=1.02,z=2.23;
 add('trunk-base',x,.12,z,1.08,.24,.66,'wood',true);
 add('trunk-back',x,.32,z-.30,1.08,.30,.07,'wood',true);
 for(const side of [-1,1])add('trunk-side-'+side,x+side*.51,.32,z,.06,.30,.66,'wood',true);
 add('trunk-front',x,.36,z+.32,1.08,.23,.065,'wood',true);
 const lid=add('trunk-lid',x,.51,z,1.12,.10,.70,'wood',true,{dynamic:true,color:[.43,.28,.21]});
 const straps=[-.35,.35].map(dx=>add('trunk-strap-'+dx,x+dx,.569,z,.078,.018,.71,'brass',false,{dynamic:true}));
 const hinge={y:.51,z:z-.35},parts=[lid,...straps].map(box=>({box,y:box.y,z:box.z}));
 obj('hide-trunk','hide','Esconderse en el baúl',x,.59,z+.37,{hideType:'trunk',returnX:x,returnZ:2.89,hideCamera:{x,y:.425,z,yaw:0,pitch:0},lid:{hinge,parts}});
}

export function poseTrunk(lid,open){
 const pitch=-1.26*open,c=Math.cos(pitch),s=Math.sin(pitch);
 for(const {box,y,z} of lid.parts){
  const dy=y-lid.hinge.y,dz=z-lid.hinge.z;
  box.y=lid.hinge.y+dy*c-dz*s;box.z=lid.hinge.z+dy*s+dz*c;box.pitch=pitch;
 }
}
