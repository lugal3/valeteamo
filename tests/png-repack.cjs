const assert=require('node:assert/strict'),{deflateSync,inflateSync}=require('node:zlib');
const sig=Buffer.from([137,80,78,71,13,10,26,10]);
function chunk(type,data){
 const header=Buffer.alloc(8);header.writeUInt32BE(data.length);header.write(type,4);
 let crc=0xffffffff;for(const byte of Buffer.concat([header.subarray(4),data])){crc^=byte;for(let i=0;i<8;i++)crc=(crc&1)?0xedb88320^(crc>>>1):crc>>>1;}
 const end=Buffer.alloc(4);end.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([header,data,end]);
}
function parse(png){const out=[];for(let i=8;i<png.length;){const n=png.readUInt32BE(i),type=png.toString('ascii',i+4,i+8);out.push({type,raw:png.subarray(i,i+n+12),data:png.subarray(i+8,i+8+n)});i+=n+12;}return out;}
(async()=>{
 const {repackPNG}=await import('../scripts/optimize-png.mjs');
 const header=Buffer.alloc(13);header.writeUInt32BE(64);header.writeUInt32BE(64,4);header[8]=8;header[9]=6;
 const rgba=Buffer.alloc(64*(1+64*4));for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=y*257+x*4+1;rgba[i]=x;rgba[i+1]=y;rgba[i+2]=128;rgba[i+3]=x%2?255:0;}
 const packed=deflateSync(rgba,{level:0}),meta=chunk('tEXt',Buffer.from('Comment\0Preserve me'));
 const input=Buffer.concat([sig,chunk('IHDR',header),meta,chunk('IDAT',packed.subarray(0,100)),chunk('IDAT',packed.subarray(100)),chunk('IEND',Buffer.alloc(0))]);
 const output=repackPNG(input);
 assert(output.length<input.length,'Compressed PNG must become smaller');
 const orig=parse(input),next=parse(output);
 assert.deepEqual(next.filter(c=>c.type!=='IDAT').map(c=>c.raw),orig.filter(c=>c.type!=='IDAT').map(c=>c.raw));
 assert.deepEqual(inflateSync(Buffer.concat(next.filter(c=>c.type==='IDAT').map(c=>c.data))),rgba);
 assert.deepEqual(repackPNG(output),output,'Idempotent optimization');
 const animated=Buffer.concat([sig,chunk('IHDR',header),chunk('acTL',Buffer.alloc(8)),chunk('IDAT',packed),chunk('IEND',Buffer.alloc(0))]);
 assert.equal(repackPNG(animated),animated,'Never alter animation');
 const corrupt=Buffer.from(input);corrupt[20]^=1;assert.throws(()=>repackPNG(corrupt),/CRC/);
 console.log('PASS PNG repack: exact decoded bytes, metadata, alpha, idempotence, APNG and corrupt-input safety');
})().catch(e=>{console.error(e);process.exitCode=1;});
