// Original deterministic, seamless material library. No images or network assets.
export const ATLAS_SIZE=256,TILE_SIZE=64,GUTTER=2,INNER=TILE_SIZE-GUTTER*2;
export const ATLAS_SIZE_MED=512,TILE_SIZE_MED=128,GUTTER_MED=4,INNER_MED=TILE_SIZE_MED-GUTTER_MED*2;
export const MATERIAL_NAMES=['papel-mural','yeso','madera','tablones','ceramica','tejido','alfombra','metal','hoja','papel','arcilla','vidrio','patita','laca','tallo','suave'];

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=(x,y,seed)=>{let n=Math.imul(x+seed*71,374761393)^Math.imul(y+seed,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
const wave=(v,n)=>Math.sin(v*Math.PI*2*n);

function sample(style,u,v,inner=60){
 const fine=hash(Math.floor(u*inner),Math.floor(v*inner),style),soft=wave(u,3)*wave(v,2);
 let shade=.94,height=.5,rough=.85;
 if(style===0){
  // papel-mural: romantic vintage wallpaper with delicate floral / ribbon lattice motif
  const x=wave(u,2),y=wave(v,2),motif=Math.exp(-Math.pow((x*x+y*y)-.58,2)*70);
  const lattice=Math.cos((u+v)*Math.PI*6)*Math.cos((u-v)*Math.PI*6)*.035;
  shade=.95-motif*.075+lattice+fine*.02;height=.5+motif*.10+lattice*1.2;rough=.88;
 }else if(style===1){
  // yeso: soft wall plaster with trowel marks and subtle grit
  shade=.93+fine*.05+soft*.015;height=.45+fine*.1+soft*.04;rough=.98;
 }else if(style===2||style===3){
  // madera / tablones: rich wood grain with bevel profile
  const grain=wave(u+wave(v,1)*.014,9)*.055+wave(u+wave(v,2)*.009,21)*.025;
  const joint=style===3?(Math.min(u,1-u)<.012||Math.min(v,1-v)<.008?1:0):0;
  const molding=style===2?Math.sin(clamp(v*6,0,Math.PI))*.02:0;
  shade=.93+grain+fine*.025-joint*.20+molding;height=.5+grain*1.3-joint*.18+molding;rough=.62;
 }else if(style===4){
  // ceramica: decorative patterned tile with border and star motif
  const edge=Math.min(u,1-u,v,1-v),bevel=clamp(edge/.04);
  const cu=Math.abs(u-.5),cv=Math.abs(v-.5);
  const star=Math.exp(-Math.pow(cu+cv-.28,2)*110)*.055;
  shade=.78+.19*bevel+star+soft*.012;height=.24+bevel*.35+star*.12;rough=.28;
 }else if(style===5){
  // tejido: capitoné / quilted soft fabric with tufted button indentations
  const cx=Math.abs((u*2)%1-.5),cy=Math.abs((v*2)%1-.5);
  const tuft=Math.exp(-(cx*cx+cy*cy)*24)*.12;
  const warp=wave(u,14),weft=wave(v,14),thread=(warp+weft)*.016;
  shade=.93+thread+fine*.02-tuft;height=.5+(warp+weft)*.035-tuft*1.5;rough=.94;
 }else if(style===6){
  // alfombra: textured warm carpet with woven diagonal structure
  const diag=Math.sin((u+v)*Math.PI*20)*Math.sin((u-v)*Math.PI*20)*.025;
  shade=.94+diag+fine*.03;height=.5+diag*1.4;rough=.99;
 }else if(style===7){
  shade=.94+wave(u,25)*.018+fine*.016;height=.5+wave(u,25)*.018;rough=.29;
 }else if(style===8){
  const spine=Math.exp(-Math.pow(u-.5,2)*1800),branches=Math.exp(-Math.pow(Math.sin((v*7+Math.abs(u-.5)*4)*Math.PI),2)*70);
  shade=.85+Math.abs(u-.5)*.11+spine*.11+branches*.045;height=.48+spine*.16+branches*.055;rough=.67;
 }else if(style===9){
  const fleck=hash(Math.floor(u*24),Math.floor(v*32),9),fiber=wave(v+u,27)*wave(u,7);
  shade=.91+.065*fine+.029*soft+.022*fiber-(fleck>.92?.075:0);height=.5+.038*fine+.020*fiber;rough=.94;
 }else if(style===10){
  // arcilla / stone: mineral micro-pores
  const specks=fine>.82?.06:0;
  shade=.9+fine*.065+soft*.015-specks;height=.5+fine*.055-specks*.1;rough=.89;
 }else if(style===11){
  shade=.96+wave(u+v,1)*.025;height=.5;rough=.12;
 }else if(style===12){
  shade=.97+fine*.009;height=.5+fine*.009;rough=.91;
 }else if(style===13){
  shade=.96+fine*.015+wave(v,9)*.006;height=.5+fine*.014;rough=.42;
 }else if(style===14){
  shade=.90+wave(u,9)*.04+fine*.025;height=.5+wave(u,9)*.04;rough=.95;
 }else{
  shade=.97+fine*.012;height=.5;rough=.68;
 }
 return [shade,height,rough];
}

let cachedLow, cachedMed;
export function materialPixels(quality='low'){
 const isMed = quality === 'medium';
 if(isMed && cachedMed) return cachedMed;
 if(!isMed && cachedLow) return cachedLow;

 const atlasSize = isMed ? ATLAS_SIZE_MED : ATLAS_SIZE;
 const tileSize = isMed ? TILE_SIZE_MED : TILE_SIZE;
 const gutter = isMed ? GUTTER_MED : GUTTER;
 const inner = isMed ? INNER_MED : INNER;

 const color=new Uint8Array(atlasSize*atlasSize*4),normal=new Uint8Array(color.length);
 for(let style=0;style<16;style++){
  const heights=new Float32Array(inner*inner),shades=new Float32Array(heights.length),roughness=new Float32Array(heights.length);
  for(let y=0;y<inner;y++)for(let x=0;x<inner;x++){
   const [shade,height,rough]=sample(style,x/inner,y/inner,inner),i=y*inner+x;
   heights[i]=height;shades[i]=shade;roughness[i]=rough;
  }
  for(let y=0;y<tileSize;y++)for(let x=0;x<tileSize;x++){
   const px=(x-gutter+inner)%inner,py=(y-gutter+inner)%inner,i=py*inner+px;
   const dx=(heights[py*inner+(px+1)%inner]-heights[py*inner+(px+inner-1)%inner])*.8;
   const dy=(heights[((py+1)%inner)*inner+px]-heights[((py+inner-1)%inner)*inner+px])*.8;
   const length=Math.hypot(dx,dy,1),at=(((style>>2)*tileSize+y)*atlasSize+(style%4)*tileSize+x)*4;
   color[at]=color[at+1]=color[at+2]=Math.round(clamp(shades[i])*255);color[at+3]=Math.round(roughness[i]*255);
   normal[at]=Math.round((.5-dx/length*.5)*255);normal[at+1]=Math.round((.5-dy/length*.5)*255);normal[at+2]=Math.round((.5+.5/length)*255);normal[at+3]=255;
   // Neutral albedo + tangent normal XY + roughness share one texture fetch.
   color[at+1]=normal[at];color[at+2]=normal[at+1];
  }
 }
 const res={color,normal};
 if(isMed) cachedMed=res; else cachedLow=res;
 return res;
}

export function materialStyle(box){
 if(box.mat==='grass')return 8;
 if(box.mat==='stone')return 4;
 if(box.mat==='asphalt')return 1;
 if(box.mat==='roof'||box.mat==='carpaint')return 13;
 if(box.surface==='paint')return 13;
 if(box.id==='wardrobe')return 2;
 if(box.id?.startsWith('books-'))return 9;
 if(box.id?.endsWith('-cap')&&box.mat==='dark')return 7;
 if(box.mat==='wallpaper'||box.mat==='wall2'||box.mat==='wall_salon'||box.mat==='wall_bedroom')return 0;
 if(box.mat==='plaster'||box.mat==='wall_study'||box.mat==='wall_stairs')return 1;
 if(box.mat==='floor'||box.id?.startsWith('floor-up-')||box.id?.startsWith('step-'))return 3;
 if(['wood','trim'].includes(box.mat))return 2;
 if(box.mat==='tile'||box.mat==='wall_kitchen'||box.mat==='wall_bath')return 4;
 if(box.mat==='carpet')return 6;
 if(['velvet','pink','bow'].includes(box.mat)||/mattress|pillow/.test(box.id))return 5;
 if(['brass','torchmetal'].includes(box.mat))return 7;
 if(box.mat==='foliage')return 8;
 if(box.mat==='paper')return 9;
 if(box.mat==='terracotta')return 10;
 if(['glass','torchglass'].includes(box.mat))return 11;
 if(['glove','pawpad','cobweb'].includes(box.mat))return 12;
 if(box.mat==='stem')return 14;
 if(box.mat==='stain')return 15;
 return 15;
}

export function surfaceFrame(box,normal,style){
 const axes=[[1,0,0],[0,1,0],[0,0,1]],sizes=[box.w,box.h,box.d];
 let grain=1;
 for(let i=0;i<3;i++)if(Math.abs(normal[i])<.5&&(Math.abs(normal[grain])>.5||sizes[i]>sizes[grain]))grain=i;
 const g=axes[grain],tangent=[g[1]*normal[2]-g[2]*normal[1],g[2]*normal[0]-g[0]*normal[2],g[0]*normal[1]-g[1]*normal[0]];
 const bitangent=[normal[1]*tangent[2]-normal[2]*tangent[1],normal[2]*tangent[0]-normal[0]*tangent[2],normal[0]*tangent[1]-normal[1]*tangent[0]];
 const scale=style===2?[4,.8]:style===3?[3.2,.7]:style===0?[1.6,1.6]:style===4?[2.65,2.65]:style===5||style===6?[3,3]:[2,2];
 return {tangent,bitangent,scale};
}
