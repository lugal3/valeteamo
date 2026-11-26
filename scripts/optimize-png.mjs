// Lossless PNG repack: preserve EVERY non-IDAT chunk, and the exact inflated
// scanlines (including filters, alpha, palette, interlace and bit depth).
// No color conversion, resizing or metadata stripping. Only adopt smaller bytes.
import {readdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';
import {inflateSync,deflateSync,constants} from 'node:zlib';
import {pathToFileURL} from 'node:url';
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Uint32Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i&1)?0xedb88320^(i>>>1):i>>>1;return i>>>0;});
function crc(data){let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){
 const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);out.write(type,4,4,'ascii');data.copy(out,8);
 out.writeUInt32BE(crc(out.subarray(4,-4)),out.length-4);return out;
}
function parse(png){
 if(!png.subarray(0,8).equals(signature))throw Error('Invalid PNG signature');
 const chunks=[];let at=8;
 while(at+12<=png.length){
  const length=png.readUInt32BE(at),end=at+12+length;
  if(end>png.length)throw Error('Truncated PNG chunk');
  const raw=png.subarray(at,end),type=raw.toString('ascii',4,8),data=raw.subarray(8,-4);
  if(crc(raw.subarray(4,-4))!==raw.readUInt32BE(raw.length-4))throw Error('Invalid CRC '+type);
  chunks.push({type,data,raw});at=end;
  if(type==='IEND')break;
 }
 if(at!==png.length||chunks[0]?.type!=='IHDR'||chunks.at(-1)?.type!=='IEND')throw Error('Unexpected PNG structure');
 return chunks;
}
export function repackPNG(png){
 const chunks=parse(png);
 // APNG can contain separate animation image streams. Leave it untouched.
 if(chunks.some(c=>['acTL','fcTL','fdAT'].includes(c.type)))return png;
 const first=chunks.findIndex(c=>c.type==='IDAT'),last=chunks.findLastIndex(c=>c.type==='IDAT');
 if(first<0||chunks.slice(first,last+1).some(c=>c.type!=='IDAT'))return png;
 const filtered=inflateSync(Buffer.concat(chunks.slice(first,last+1).map(c=>c.data)),{maxOutputLength:128*1024*1024});
 let best=png;
 for(const strategy of [constants.Z_DEFAULT_STRATEGY,constants.Z_FILTERED]){
  const packed=deflateSync(filtered,{level:9,strategy,memLevel:9});
  const candidate=Buffer.concat([signature,...chunks.slice(0,first).map(c=>c.raw),chunk('IDAT',packed),...chunks.slice(last+1).map(c=>c.raw)]);
  if(candidate.length<best.length){
   if(!inflateSync(packed).equals(filtered))throw Error('Repack changed decoded scanlines');
   const unchanged=parse(candidate).filter(c=>c.type!=='IDAT').map(c=>c.raw);
   const original=chunks.filter(c=>c.type!=='IDAT').map(c=>c.raw);
   if(unchanged.length!==original.length||unchanged.some((c,i)=>!c.equals(original[i])))throw Error('Repack changed PNG metadata');
   best=candidate;
  }
 }
 return best;
}
async function main(root){
 const rows=[];
 async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
   const file=join(dir,e.name);
   // Vite's hashed assets must retain their original content hash. Only
   // repack copied public files (comics, sprites, icons, etc.).
   if(e.isDirectory()){if(dir===root&&e.name==='assets')continue;await walk(file);continue;}
   if(!e.isFile()||!e.name.toLowerCase().endsWith('.png'))continue;
   const original=await readFile(file);let smaller;
   try{smaller=repackPNG(original);}catch(error){rows.push({path:relative(root,file),status:'kept',reason:String(error),before:original.length,after:original.length});continue;}
   if(smaller.length<original.length){const temp=file+'.repack';await writeFile(temp,smaller);await rename(temp,file);}
   rows.push({path:relative(root,file),before:original.length,after:smaller.length,saved:original.length-smaller.length});
  }
 }
 await walk(root);
 console.log(JSON.stringify({pngFiles:rows.length,bytesSaved:rows.reduce((n,r)=>n+r.before-r.after,0),files:rows}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main(resolve(process.argv[2]||'dist'));
