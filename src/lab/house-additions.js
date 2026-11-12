export const PIANO_NOTES=['Do','Re','Mi','Fa','Sol','La','Si','Do agudo'];
export const PIANO_KEYS=['a','s','d','f','g','h','j','k'];
export const PIANO_SCORE=[0,2,4,5,4,2,1,0];

export function installPiano(add,obj){
 const x=.44,z=7.04,wood={color:[.34,.22,.18]};
 const part=(id,dx,y,dz,w,h,d,mat='wood',solid=false,extra={})=>add('piano-'+id,x+dx,y,z+dz,w,h,d,mat,solid,{...wood,...extra});
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
 return obj('piano','piano','Piano antiguo',.93,1.1,z,{keys,seat:{x:1.30,y:1.24,z,yaw:-Math.PI/2,pitch:-.39}});
}

export function installKitchenBar(add,obj){
 const x=12.20,z=3.65;
 add('kitchen-bar-top',x,1.04,z,3.20,.10,.66,'stone',true,{surface:'counter-stone',color:[.51,.47,.42]});
 add('kitchen-bar-screen',x,.49,3.39,3.12,.98,.12,'wood',true,{color:[.44,.29,.24]});
 for(const px of [10.72,12.15,13.69])add('kitchen-bar-stile-'+px,px,.50,3.313,.085,.91,.062,'trim',false,{color:[.51,.35,.27]});
 add('kitchen-bar-edge',x,1.00,3.29,3.22,.075,.045,'brass',false,{color:[.56,.42,.26]});
 add('kitchen-prep-top',13.58,.94,2.26,.62,.082,1.26,'stone',true,{surface:'counter-stone'});
 for(const pz of [1.72,2.80])add('kitchen-prep-leg-'+pz,13.37,.45,pz,.080,.90,.085,'wood',true);
 add('kitchen-prep-board',13.53,.993,2.28,.32,.034,.51,'wood',false);
 obj('red-key','key','Llave roja',11.53,1.112,3.66,{red:true});
 obj('hide-kitchen','hide','Agacharse tras la barra',11.82,.88,4.12,{requiresCrouch:true,hideType:'kitchen',returnX:10.20,returnZ:4.09,hideCamera:{x:11.39,y:.77,z:3.90,yaw:-Math.PI/2,pitch:0}});
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
