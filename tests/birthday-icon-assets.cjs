const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

const src=fs.readFileSync('src/experience/extra-birthday-assets.ts','utf8');
const transpiled=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const out={};vm.runInNewContext(transpiled,{exports:out,Error});
const icons=out.EXTRA_BIRTHDAY_ICONS;
assert.equal(icons.length,3,'three additional icons from the supplied collage');
assert.equal(new Set(icons.map(i=>i.id)).size,3,'unique asset IDs');
const expected=new Set(['cat-birthday-cake','cat-on-gift','cat-portrait-party']);
for(const icon of icons){
 assert(expected.delete(icon.id),'unexpected or duplicate asset: '+icon.id);
 assert.equal(icon.status,'reserved','do not insert unused stickers into existing scenes');
 assert(icon.title&&icon.alt&&icon.suggestedPlacement,'documented usage and accessibility');
 assert.equal(icon.src,'/experience/icons/'+icon.id+'.webp');
 const file='public'+icon.src;
 assert(fs.existsSync(file),'missing cropped asset '+file);
 const bytes=fs.readFileSync(file);
 assert(bytes.length>4000&&bytes.length<60000,'asset optimized for mobile');
 assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF','RIFF WebP');
 assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP','valid WebP');
 assert.equal(bytes.subarray(12,16).toString('ascii'),'VP8 ','lossy WebP');
 assert.equal(bytes.readUInt16LE(26)&0x3fff,384,'square width');
 assert.equal(bytes.readUInt16LE(28)&0x3fff,384,'square height');
 assert.equal(out.getExtraBirthdayIcon(icon.id).src,icon.src,'typed getter');
}
assert.equal(expected.size,0);
const manifest=JSON.parse(fs.readFileSync('public/manifest.webmanifest','utf8'));
const html=fs.readFileSync('index.html','utf8');
assert(manifest.icons.every(icon=>icon.src.includes('vale-icon-v1-')),
 'original ValeTeAmo app icon remains unchanged');
assert(html.includes('vale-icon-v1-180.png')&&html.includes('vale-favicon-v1-32.png'),
 'original favicon / apple home-screen icon preserved');
console.log('PASS: 3 supplied cropped WebP icons (384px), documented and original PWA icon untouched.');
