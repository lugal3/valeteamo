// Verify each user audio asset is a real compact Opus file and cues line up.
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root='src/lab/audio/user/';
const names=['cat-meow','cat-purr','churu-open','danger-alert','hatch-close','power-cut','rc-motor-loop','van-door-close','van-drive-away'];
let total=0;
for(const name of names){
 const b=fs.readFileSync(root+name+'.ogg');
 assert.equal(b.subarray(0,4).toString(),'OggS',name+' Ogg signature');
 assert(b.indexOf(Buffer.from('OpusHead'))>=0,name+' should contain an Opus stream');
 assert(b.length>800&&b.length<50000,name+' should fit mobile download budget');
 total+=b.length;
}
assert(total<125000,'All nine individual user sounds should be smaller than 125 KB');
const sprite=fs.readFileSync('src/lab/audio/user-sprite.ogg');
assert.equal(sprite.subarray(0,4).toString(),'OggS');
assert(sprite.indexOf(Buffer.from('OpusHead'))>=0);
assert(sprite.length<80000,'Single network fetch should remain under 80 KB');
assert.equal(crypto.createHash('sha256').update(sprite).digest('hex'),'5537824e9f1e58f9a00c6747dcb47d8bbdd1e92d77ee030bbbb9b21d46591927');
const code=fs.readFileSync('src/lab/audio/user-sprite-index.js','utf8');
for(const cue of ['cat-meow','cat-purr','churu-open','danger-alert','hatch-close','power-cut','rc-motor','van-door','van-away'])
 assert(code.includes("'"+cue+"'"),'Audio cue declared: '+cue);
const ts=fs.readFileSync('src/audio.ts','utf8');
for(const cue of ["cat","churu","van-door","van-away"])assert(ts.includes(cue+':')||ts.includes("'"+cue+"':"),'2D cue: '+cue);
const house=fs.readFileSync('src/lab/house.js','utf8');
for(const cue of ["cat-purr","power-cut","danger-alert","hatch-close"])assert(house.includes("'"+cue+"'"),'House event wired: '+cue);
const sound=fs.readFileSync('src/lab/sound.js','utf8');
assert(sound.includes("clipBuffer('rc-motor')"),'RC loops sampled sound');
console.log('PASS user audio: 9 valid compressed Ogg/Opus clips ('+total+' bytes), 1 sprite ('+sprite.length+' bytes), 2D/3D cue wiring');
