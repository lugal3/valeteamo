// Export the exact in-game, code-drawn pixels as editable PNG sprite sheets.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),ts=require('typescript');
const root=path.resolve(__dirname,'..'),textures={},cache={};
function load(name){if(cache[name])return cache[name];const code=ts.transpileModule(fs.readFileSync(path.join(root,'src',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const ctx={exports:{},require:n=>n==='phaser'?{}:load(n.slice(2)),document:{createElement(){const pixels=[];return {pixels,getContext:()=>({fillStyle:'',fillRect(x,y,w,h){pixels.push({x,y,w,h,color:this.fillStyle});}})};}}};vm.runInNewContext(code,ctx);return cache[name]=ctx.exports;}
load('art').buildArt({textures:{addCanvas:(name,canvas)=>textures[name]=canvas}});
load('chibi-art').buildChibi({textures:{addCanvas:(name,canvas)=>textures[name]=canvas}});
function crc32(bytes){let crc=0xffffffff;for(const b of bytes){crc^=b;for(let i=0;i<8;i++)crc=(crc>>>1)^(crc&1?0xedb88320:0);}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));return Buffer.concat([length,name,data,crc]);}
function png(width,height,pixels){const raw=Buffer.alloc((width*4+1)*height);for(const p of pixels){const rgb=[1,3,5].map(i=>parseInt(p.color.slice(i,i+2),16));for(let y=p.y;y<p.y+p.h;y++)for(let x=p.x;x<p.x+p.w;x++){const i=y*(width*4+1)+1+x*4;raw[i]=rgb[0];raw[i+1]=rgb[1];raw[i+2]=rgb[2];raw[i+3]=255;}}
 const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
const directory=path.join(root,'public','sprites','templates');fs.mkdirSync(directory,{recursive:true});
for(const id of ['kitty','louis']){const pixels=[];const rows=['down','down-shoot','up','up-shoot','right','right-shoot','hurt','dead'];rows.forEach((row,y)=>{for(let f=0;f<6;f++){
 const key=y>=6?`${id}-${row}`:`${id}-${row.replace('-shoot','')}-${f}${row.endsWith('-shoot')?'-shoot':''}`;
 // Repeat the hurt/death pose in unused columns, convenient for drawing later.
 for(const p of textures[key].pixels)pixels.push({...p,x:p.x+f*16,y:p.y+y*20});
 }});const file=path.join(directory,id+'.png');fs.writeFileSync(file,png(96,160,pixels));console.log(path.relative(root,file));}
for(const id of ['kitty','louis']){const pixels=[];const rows=['down','down-shoot','up','up-shoot','right','right-shoot','hurt','dead'];rows.forEach((row,y)=>{for(let f=0;f<6;f++){
 const key=y===6?`chibi-${id}-down-5`:y===7?`chibi-${id}-down-0`:`chibi-${id}-${row.replace('-shoot','')}-${f}${row.endsWith('-shoot')?'-shoot':''}`;
 for(const p of textures[key].pixels)pixels.push({...p,x:p.x+f*32,y:p.y+y*40});
 }});const file=path.join(directory,'chibi-'+id+'.png');fs.writeFileSync(file,png(192,320,pixels));console.log(path.relative(root,file));}
