import {KITCHEN_BAR,KITCHEN_HIDE_SPOT} from './kitchen-hide-layout.js';
import {PIANO_NOTES,PIANO_INTRO,PIANO_PAGE_SIZE,PIANO_WHITE} from './piano-recital.js';
export const PIANO_SHEET_ID='piano-sheet';
export const MASTER_KEY_ID='master-key';

export function installPiano(add,obj,{x,z,floor}){
 const wood={color:[.34,.22,.18]};
 const part=(id,dx,y,dz,w,h,d,mat='wood',solid=false,extra={})=>add('piano-'+id,x+dx,floor+y,z+dz,w,h,d,mat,solid,{...wood,...extra});
 part('case',0,.79,0,.60,1.58,1.75,'wood',true);
 part('crown',0,1.58,0,.66,.085,1.85,'trim');
 part('front',.314,1.24,0,.032,.41,1.61,'wood',false,{color:[.46,.31,.22]});
 for(const offset of [-.72,0,.72])part('bead-'+offset,.335,1.26,offset,.032,.33,.048,'brass');
 part('keybed',.42,.874,0,.31,.11,1.73,'wood',true);
 for(const offset of [-.78,.78])part('cheek-'+offset,.45,.96,offset,.32,.11,.14);
 const keys=PIANO_NOTES.map((_,i)=>{
  const white=PIANO_WHITE.includes(i);
  const index=white?PIANO_WHITE.indexOf(i):PIANO_WHITE.findIndex(note=>note>i)-.5;
  return part('key-'+i,white?.47:.397,white?.95:.985,(index-3.5)*.176,
   white?.29:.17,white?.038:.034,white?.164:.071,white?'cream':'dark',false,
   {dynamic:true,color:white?[.91,.82,.68]:[.14,.12,.13]});
 });
 const keyLights=keys.map((key,i)=>part('guide-'+i,(key.x-x)+.055,-100-floor,key.z-z,
  .044,.010,Math.min(key.d-.012,.103),'brass',false,{dynamic:true,glow:true,color:[1,.67,.23]}));
 const score=[part('score',.339,1.35,0,.025,.25,.47,'paper',false,
  {dynamic:true,color:[.88,.78,.58],pitch:.08})];
 for(let i=0;i<5;i++)score.push(part('staff-'+i,.355,1.30+i*.018,0,.008,.005,.38,'dark',false,{dynamic:true}));
 const scoreDots=PIANO_INTRO.slice(0,PIANO_PAGE_SIZE).map(([,note],i)=>part('ink-'+i,.362,1.295+note*.006,
  (i-3)*.050,.008,.019,.027,'dark',false,{dynamic:true}));
 score.push(...scoreDots);
 const scoreLight=part('score-guide',.374,-100-floor,0,.012,.024,.034,'brass',false,{dynamic:true,glow:true,color:[1,.67,.23]});
 const compartment=[
  part('compartment-tray',.335,1.087,-.58,.20,.024,.32,'wood',false,{dynamic:true}),
  part('compartment-panel',.420,1.15,-.58,.040,.112,.34,'wood',false,{dynamic:true,color:[.46,.28,.19]}),
  part('compartment-knob',.455,1.151,-.58,.036,.032,.065,'brass',false,{dynamic:true})
 ];
 const reward=obj('red-key','key','Llave roja del sótano',x+.55,floor+1.14,z-.58,
  {dynamic:true,red:true,concealed:true,interactable:false,yaw:-.26});
 const sparks=Array.from({length:9},(_,i)=>part('spark-'+i,.58,-100-floor,-.58,.025,.025,.025,
  'brass',false,{dynamic:true,glow:true,shape:'round',color:i%2?[1,.76,.29]:[1,.91,.62]}));
 part('bench',.86,.49,0,.34,.075,.87,'velvet',true,{color:[.42,.22,.26]});
 for(const dx of [.74,.98])for(const dz of [-.36,.36])part('bench-leg-'+dx+dz,dx,.225,dz,.054,.45,.065,'wood',true);
 const piano=obj('piano','piano','Piano antiguo',x+.49,floor+1.1,z,{
  keys,keyHeights:keys.map(key=>key.y),keyLights,scoreDots,scoreLight,floor,scorePlaced:false,solved:false,
  score:score.map(box=>({box,y:box.y})),compartment:compartment.map(box=>({box,x:box.x})),
  reward,rewardHeight:reward.y,sparks,
  compartmentAmount:0,seat:{x:x+.86,y:floor+1.24,z,yaw:-Math.PI/2,pitch:-.39}
 });
 setPianoScore(piano,false);
 return piano;
}

export function guidePiano(piano,note=-1,step=-1,page=0){
 for(const [i,light] of piano.keyLights.entries())light.y=i===note?piano.keyHeights[i]+.024:-100;
 if(piano.scorePlaced&&piano.paperPage!==page){
  piano.paperPage=page;
  piano.scoreDots.forEach((dot,i)=>{dot.y=piano.floor+1.295+PIANO_INTRO[page*PIANO_PAGE_SIZE+i][1]*.006;});
 }
 const dot=piano.scoreDots[step];
 piano.scoreLight.y=dot?.y??-100;
 if(dot)piano.scoreLight.z=dot.z;
}

export function setPianoScore(piano,placed){
 piano.scorePlaced=placed;
 piano.paperPage=undefined;
 for(const {box,y} of piano.score)box.y=placed?y:-100;
}

export function posePianoCompartment(piano,amount){
 piano.compartmentAmount=amount;
 const slide=.22*amount*amount*(3-2*amount);
 for(const part of piano.compartment)part.box.x=part.x+slide;
}

export function posePianoReward(piano,time=0,reduced=false){
 const {reward,rewardHeight,sparks}=piano;
 const tray=piano.compartment[0].box;
 const up=Math.max(0,Math.min(1,(time-.65)/.79));
 const lift=reduced?0:Math.sin(Math.PI*up)*.24;
 reward.concealed=reward.taken||!piano.solved&&time<.50;
 reward.interactable=piano.solved&&!reward.taken;
 reward.x=tray.x+.02+(reduced?0:Math.sin(Math.PI*up)*.13);reward.y=rewardHeight+lift;reward.z=tray.z;
 reward.yaw=-.26+(reduced?0:up*Math.PI*2);
 reward.tilt=.22+(reduced?0:.98*Math.sin(Math.PI*up));
 for(const [i,box] of sparks.entries()){
  const t=(time-.62-i*.048)/.90,angle=i*2.4;
  box.y=t<=0||t>=1||reduced?-100:rewardHeight+.03+Math.sin(Math.PI*t)*(.12+i*.017);
  box.x=tray.x+.08+Math.cos(angle)*(.06+t*.30);
  box.z=tray.z+Math.sin(angle)*(.05+t*.28);
 }
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

 obj('hide-kitchen','hide','Agacharse detrás del mesón',
  KITCHEN_HIDE_SPOT.x,.83,KITCHEN_HIDE_SPOT.z,{
   requiresCrouch:true,hideType:'kitchen',
   returnX:12.10,returnZ:1.47,
   hideCamera:{x:12.22,y:.67,z:KITCHEN_HIDE_SPOT.z,yaw:-Math.PI/2,pitch:0}
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
 add('trunk-base',x,.075,z,1.20,.15,.90,'wood',true);
 add('trunk-back',x,.39,z-.42,1.20,.49,.06,'wood',true);
 for(const side of [-1,1])add('trunk-side-'+side,x+side*.57,.39,z,.06,.49,.90,'wood',true);
 add('trunk-front',x,.39,z+.42,1.20,.49,.06,'wood',true);
 const lid=add('trunk-lid',x,.69,z,1.24,.10,.93,'wood',true,{dynamic:true,color:[.43,.28,.21]});
 const straps=[-.35,.35].map(dx=>add('trunk-strap-'+dx,x+dx,.748,z,.078,.018,.94,'brass',false,{dynamic:true}));
 const hinge={y:.69,z:z-.465},parts=[lid,...straps].map(box=>({box,y:box.y,z:box.z}));
 obj('hide-trunk','hide','Esconderse en el baúl',x,.64,z+.48,{hideType:'trunk',returnX:x,returnZ:3.05,hideCamera:{x,y:.425,z,yaw:0,pitch:0},lid:{hinge,parts}});
}

export function poseTrunk(lid,open){
 const pitch=-1.26*open,c=Math.cos(pitch),s=Math.sin(pitch);
 for(const {box,y,z} of lid.parts){
  const dy=y-lid.hinge.y,dz=z-lid.hinge.z;
  box.y=lid.hinge.y+dy*c-dz*s;box.z=lid.hinge.z+dy*s+dz*c;box.pitch=pitch;
 }
}
