export const PRESIDENT_NAME='Friedrich Weiss';

export function installLouisAltar(add,obj,floor){
 const x=12.27,z=.44,ink=[.29,.12,.15],wax=[.46,.16,.18];
 add('louis-altar-plinth',x,floor+.36,z,1.62,.72,.63,'wood',true,{color:[.31,.20,.22]});
 add('louis-altar-slab',x,floor+.75,z,1.68,.09,.69,'wood',true,{color:[.39,.23,.23]});
 add('louis-altar-cloth',x,floor+.801,z,.96,.018,.67,'velvet',false,{color:[.57,.13,.24]});
 add('louis-altar-drape',x,floor+.63,.795,.96,.35,.026,'velvet',false,{color:[.49,.10,.19]});
 add('louis-altar-board',x,floor+1.59,.144,1.75,1.48,.065,'wood',false,{color:ink});
 add('louis-altar-portrait-frame',x,floor+1.60,.185,.58,.69,.044,'brass',false);
 add('louis-altar-portrait',x,floor+1.60,.213,.51,.62,.018,'paper',false,{art:10,front:'south'});
 const cards=[[-.58,1.35,-.16],[-.51,1.96,.12],[.60,1.44,.11],[.53,1.94,-.13],[-.29,2.13,.09],[.26,1.14,-.08]];
 for(const [i,[dx,height,roll]] of cards.entries()){
  add('louis-altar-card-'+i,x+dx,floor+height,.184,.21,.15,.016,'paper',false,{roll,color:[.73,.64,.52]});
  add('louis-altar-pin-'+i,x+dx,floor+height+.064,.203,.024,.023,.018,'brass',false);
  const dy=1.60-height;
  add('louis-altar-thread-'+i,x+dx/2,floor+height+dy/2,.216,Math.hypot(dx,dy),.008,.008,'bow',false,{roll:Math.atan2(-dy,dx),color:[.58,.10,.14]});
 }
 for(const [i,dx] of [-.64,-.44,.40,.62].entries()){
  const height=.13+(i%3)*.045;
  add('louis-altar-wax-'+i,x+dx,floor+.811+height/2,z+.07,.067,height,.067,'paper',false,{shape:'round',segments:8,rings:4,color:wax});
  add('louis-altar-flame-'+i,x+dx,floor+.825+height,z+.07,.021,.036,.021,'torchglass',false,{shape:'round',segments:6,rings:3,glow:true,color:[.91,.48,.27]});
 }
 add('louis-altar-vinyl',x,floor+.826,z+.09,.36,.022,.36,'dark',false,{shape:'round'});
 add('louis-altar-label',x,floor+.84,z+.09,.11,.01,.11,'bow',false,{shape:'round'});
 obj('louis-altar','inspect','Altar de Louis',x,floor+1.42,.84,{text:'El rostro de Louis Tomlinson está en el centro. Los hilos unen entradas de conciertos con recortes en los que alguien anotó a qué hora llegó y con quién salió. En cada papel se repite la misma frase: «Canta solo para mí».'});
 obj('president-dossier','note','Dossier de la presidencia',x+.45,floor+.862,z+.23,{text:`${PRESIDENT_NAME}, presidente alemán. Entre sus discursos hay listas de conciertos de Louis, todas marcadas a mano. La última hoja lleva un dibujo de esta casa y una cruz sobre el dormitorio.`});
}
