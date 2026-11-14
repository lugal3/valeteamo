import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {deflateSync,inflateSync} from 'node:zlib';

// All app icons are generated from the committed 192x192 photo artwork,
// without network access or additional dependencies.
const root=process.cwd(),source=readFileSync(join(root,'public/vale-icon-v1-192.png'));
const sig=Buffer.from([137,80,78,71,13,10,26,10]);
if(!source.subarray(0,8).equals(sig))throw Error('Invalid source PNG');
let w=0,h=0,bitDepth=0,colorType=0,palette=null,alpha=null;
const chunks=[];
for(let pos=8;pos<source.length;){
 const len=source.readUInt32BE(pos),type=source.toString('ascii',pos+4,pos+8);
 const data=source.subarray(pos+8,pos+8+len);pos+=len+12;
 if(type==='IHDR'){w=data.readUInt32BE(0);h=data.readUInt32BE(4);bitDepth=data[8];colorType=data[9];if(data[12])throw Error('Interlaced PNG');}
 else if(type==='PLTE')palette=data;
 else if(type==='tRNS')alpha=data;
 else if(type==='IDAT')chunks.push(data);
 else if(type==='IEND')break;
}
if(w!==192||h!==192||bitDepth!==8||colorType!==3||!palette)throw Error('Expected 192x192 indexed PNG');
const compressed=inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(w*h);
const paeth=(a,b,c)=>{let p=a+b-c,da=Math.abs(p-a),db=Math.abs(p-b),dc=Math.abs(p-c);return da<=db&&da<=dc?a:db<=dc?b:c;};
let k=0;
for(let y=0;y<h;y++){
 const f=compressed[k++];
 for(let x=0;x<w;x++){
  const value=compressed[k++],a=x?pixels[y*w+x-1]:0,b=y?pixels[(y-1)*w+x]:0,c=y&&x?pixels[(y-1)*w+x-1]:0;
  let pred=0;
  switch(f){case 0:break;case 1:pred=a;break;case 2:pred=b;break;case 3:pred=Math.floor((a+b)/2);break;case 4:pred=paeth(a,b,c);break;default:throw Error('Unknown PNG filter '+f);}
  pixels[y*w+x]=(value+pred)&255;
 }
}
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function chunk(name,data){
 const out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length,0);out.write(name,4);data.copy(out,8);
 let crc=0xffffffff;for(let j=4;j<out.length-4;j++)crc=crcTable[(crc^out[j])&255]^(crc>>>8);
 out.writeUInt32BE((crc^0xffffffff)>>>0,out.length-4);return out;
}
function generate(size,filename){
 const stride=size*4,raw=Buffer.alloc(size*(stride+1));
 for(let y=0;y<size;y++){
  const sy=Math.min(h-1,Math.floor((y+.5)*h/size));
  for(let x=0;x<size;x++){
   const sx=Math.min(w-1,Math.floor((x+.5)*w/size)),idx=pixels[sy*w+sx],i=y*(stride+1)+1+x*4;
   raw[i]=palette[idx*3];raw[i+1]=palette[idx*3+1];raw[i+2]=palette[idx*3+2];raw[i+3]=alpha&&idx<alpha.length?alpha[idx]:255;
  }
 }
 const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;
 writeFileSync(join(root,'public',filename),Buffer.concat([sig,chunk('IHDR',ihdr),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]));
}
generate(180,'vale-icon-v1-180.png');
generate(512,'vale-icon-v1-512.png');
generate(32,'vale-favicon-v1-32.png');
