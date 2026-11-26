import {readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {join,relative,extname,resolve} from 'node:path';
import {gzipSync,brotliCompressSync,constants} from 'node:zlib';
const root=resolve(process.argv[2]||'dist'),output=process.argv[3];
const entries=[];
async function walk(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())await walk(path);
  else if(entry.isFile()){
   const bytes=(await stat(path)).size,ext=extname(path).toLowerCase()||'(none)';
   const textLike=/^\.(js|mjs|css|html|json|svg|txt|xml|map|webmanifest)$/.test(ext);
   const data=textLike?await readFile(path):null;
   entries.push({path:relative(root,path),ext,bytes,gzip:data?gzipSync(data,{level:6}).length:null,
    brotli:data?brotliCompressSync(data,{params:{[constants.BROTLI_PARAM_QUALITY]:5}}).length:null});
  }
 }
}
await walk(root);
const byExtension={};
for(const f of entries){
 const group=byExtension[f.ext]??={files:0,bytes:0};
 group.files++;group.bytes+=f.bytes;
}
const total=entries.reduce((n,x)=>n+x.bytes,0);
const report={files:entries.length,totalBytes:total,byExtension,largest:entries.sort((a,b)=>b.bytes-a.bytes).slice(0,30),textGzipBytes:entries.reduce((n,x)=>n+(x.gzip??0),0),textBrotliBytes:entries.reduce((n,x)=>n+(x.brotli??0),0),estimatedGzipTransferAllBytes:entries.reduce((n,x)=>n+(x.gzip??x.bytes),0),note:'Full dist including public; transfer estimate for all files, not initial load or measured HTTP traffic.'};
const json=JSON.stringify(report,null,2);
if(output)await writeFile(output,json+'\n');
console.log(json);
