import {readdir,readFile,stat} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(process.argv[2]||'dist');
const approved=JSON.parse(await readFile(new URL('./approved-flac.json',import.meta.url),'utf8')).pcmSha256;
const names=await readdir(join(root,'assets'));
for(const wav of Object.keys(approved)){
 const stem=wav.slice(0,-4);
 assert(names.some(n=>n.startsWith(stem+'-')&&n.endsWith('.flac')),'Missing emitted FLAC: '+stem);
 assert(!names.some(n=>n.startsWith(stem+'-')&&n.endsWith('.wav')),'Duplicate original WAV in production: '+stem);
}
const remaining=names.filter(n=>n.endsWith('.wav'));
const compressed=names.filter(n=>n.endsWith('.flac'));
assert.equal(compressed.length,Object.keys(approved).length);
const bytes=async list=>(await Promise.all(list.map(n=>stat(join(root,'assets',n))))).reduce((n,f)=>n+f.size,0);
console.log(JSON.stringify({flacFiles:compressed.length,wavFiles:remaining.length,flacBytes:await bytes(compressed),wavBytes:await bytes(remaining)}));
