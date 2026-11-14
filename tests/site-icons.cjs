const fs=require('node:fs'),assert=require('node:assert/strict');
function dims(name){
 const b=fs.readFileSync(name);
 assert.deepEqual(b.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));
 return [b.readUInt32BE(16),b.readUInt32BE(20)];
}
for(const [file,n] of [['vale-icon-v1-180.png',180],['vale-icon-v1-192.png',192],['vale-icon-v1-512.png',512],['vale-favicon-v1-32.png',32]]){
 for(const dir of ['public','dist'])assert.deepEqual(dims(dir+'/'+file),[n,n],file+' '+dir);
}
const html=fs.readFileSync('dist/index.html','utf8');
for(const path of ['/vale-icon-v1-180.png','/vale-favicon-v1-32.png','/vale-icon-v1-192.png','https://valefc.web.app/vale-icon-v1-512.png'])assert(html.includes(path),path);
const m=JSON.parse(fs.readFileSync('dist/manifest.webmanifest','utf8'));
assert.equal(m.display,'standalone');
for(const size of [192,512])assert(m.icons.some(i=>i.src.includes('vale-icon-v1-'+size)&&i.sizes===size+'x'+size));
console.log('PASS: iPhone icon, favicon, PWA manifest, social preview and built artifacts.');
