import Phaser from 'phaser';
// Original sprites, one letter per pixel. Frames are generated locally once.
const COLORS:Record<string,string>={w:'#fff9ec',k:'#554357',y:'#e9bc5e',p:'#e799b2',r:'#d65883',v:'#745778',b:'#94cbd8',g:'#82aa82',d:'#b87893'};
const KITTY=[
 '...kwk....kwk...', '..kwwwkkkkwwwk..', '..kwwwwwwwwwwk..', '.kwwwwwwwwrrrwk.', '.kwwwwwwwwrprrk.', 'kwwwwwwwwwwrrwk.', 'kwwwkwwwwkwwwwk.', 'kwwwwwwywwwwwwk.', '.kwwwwwwwwwwwk..', '..kkwwwwwwwkk...', '....kpppppk.....', '...kwpppppwk....', '..kwwpppppwwk...', '...kkpppppkk....', '....kpppppk.....', '....kkpppkk.....', '....kwwkwwk.....', '....kkkkkkk.....', '................', '................'
];
const PATTERNS:Record<string,string[]>={
 kuromi:['..vk......kv....','..vvk....kvv....','..vvvvkkvvvv....','.vvvvvvvvvvvv...','kvvvvvvvvvvvvk..','kvvwwwwwwwwvvk..','kvvwwkwwkwwvvk..','kvvwwwpwwwwvvk..','.kvvvvvvvvvvk...','...kvvvvkvk.....','...kvvpvvvk.....','..kvvvvvvvvk....','...kvv..vvk.....','...kk....kk.....'],
 cinna:['..www....www....','.kwwwwwwwwwwk...','kwwwwwwwwwwwwk..','wwkwwwwwwwwkww..','wwkwbwwbwwwkww..','.wkwwwwwwwwkw...','...kwwppwwwk....','....kwwwwwk.....','....kbbbbbk.....','...kwwwwwwwk....','....kkwwkk......','.....kkkk.......'],
 poop:['.......pp.......','......pddp......','.....pppppp.....','....pppppppp....','.....pppppp.....','...ppkppkpppp...','..pppppppppppp..','.pppppppppppppp.','..dddddddddddd..'],
 bomb:['.....rryrr......','.....rprpr......','......rrr.......','......kvk.......','....kvvvvvk.....','...kvvpvvvvk....','..kvvvpvvvvvk...','..kvvvvvvvvvk...','...kvvvvvvvk....','....kkkkkkk.....'],
 head:['...kw...wk......','..kwwk.kwwk.....','..kwwwwwwwk.....','.kwwwwwwwwwk....','.kwwkwwwkwwk....','.kwwwwywwwwk....','..kwwwwwwwk.....','...kkkkkkk......'],
 mantle:['......yyy.......','....yywwwyy.....','...ywwwwwwwy....','..ywwwwwwwwwy...','.ywwwwwwwwwwwy..','..ywwwwwwwwwy...','...yyyyyyyyy....'],
 brim:['.....rrr........','...rrrrrrr......','..rrr...rrr.....','..rrr...rrr.....','...rrrrrrr......','....rrrrr.......','.....rrr........']
};
function texture(scene:Phaser.Scene,name:string,rows:string[],height=20){
 const cv=document.createElement('canvas');cv.width=16;cv.height=height;
 const cx=cv.getContext('2d')!;rows.forEach((r,y)=>[...r].forEach((v,x)=>{if(COLORS[v]){cx.fillStyle=COLORS[v];cx.fillRect(x,y,1,1)}}));
 scene.textures.addCanvas(name,cv);
}
function put(rows:string[],x:number,y:number,c:string){const r=rows[y].padEnd(16,'.').split('');r[x]=c;rows[y]=r.join('');}
export function buildArt(scene:Phaser.Scene){
 for(const dir of ['down','up','right'])for(let f=0;f<6;f++)for(const shoot of [false,true]){
  const a=[...KITTY];
  if(dir==='up'){for(let y=6;y<=8;y++)for(let x=3;x<12;x++)put(a,x,y,'w');put(a,8,12,'d');}
  if(dir==='right'){put(a,4,6,'w');put(a,9,6,'w');put(a,10,6,'k');put(a,8,7,'w');put(a,12,7,'y');}
  if(f===5&&dir!=='up'){put(a,4,6,'d');put(a,9,6,'d');}
  // Alternating feet and arms, independently from the firing pose.
  if(f===1||f===3){a[16]=f===1?'...kwwk.kwwk....':'....kwwk.kwwk...';a[17]=f===1?'...kkkk.kkkk....':'....kkkk.kkkk...';}
  if(f===2||f===4){a[15]='....kpppppk.....';a[16]=f===2?'....kwwk........':'........kwwk....';a[17]=f===2?'....kkkk.kwwk...':'...kwwk.kkkk....';a[18]=f===2?'.........kkkk...':'...kkkk.........';}
  if(shoot){put(a,dir==='right'?13:3,11,'w');put(a,dir==='right'?14:12,10,'w');}
  texture(scene,`kitty-${dir}-${f}${shoot?'-shoot':''}`,a);
 }
 const hurt=[...KITTY];put(hurt,4,6,'r');put(hurt,9,6,'r');texture(scene,'kitty-hurt',hurt);
 const dead=[...KITTY];dead[6]='kwwwrwwwwrwwwwk.';dead[7]='kwwwwwwpwwwwwwk.';texture(scene,'kitty-dead',dead);
 for(const [name,rows]of Object.entries(PATTERNS)){
  texture(scene,name,rows);
  if(name==='kuromi'||name==='cinna')for(let f=0;f<4;f++){
   const a=[...rows];if(f%2){a.push('....ww..ww......');a.splice(a.length-3,1,'.'+a[a.length-3].slice(0,15));}texture(scene,`${name}-${f}`,a);
  }
 }
}
