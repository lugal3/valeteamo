import {spawnSync} from 'node:child_process';
import {readFileSync,statSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,dirname,join,extname} from 'node:path';
import {createHash} from 'node:crypto';
// Build-time lossless replacement of explicitly imported house audio only.
// Source WAVs remain the development/fallback format. Vite fingerprints the
// actual FLAC bytes, so cache invalidation is correct.
export function approvedLosslessAudio(){
 const approved=JSON.parse(readFileSync(new URL('./approved-flac.json',import.meta.url),'utf8')).pcmSha256;
 let temporary=null;
 const candidates=new Map();
 const required=process.env.VALE_REQUIRE_FLAC==='1';
 const ffmpeg=(args)=>{const r=spawnSync('ffmpeg',['-nostdin','-v','error',...args],{maxBuffer:64*1024*1024});if(r.error||r.status!==0)throw Error(r.error?.message||r.stderr.toString());return r.stdout;};
 const pcm=file=>createHash('sha256').update(ffmpeg(['-i',file,'-map','0:a:0','-f','s32le','-acodec','pcm_s32le','-'])).digest('hex');
 const cleanup=()=>{if(temporary){rmSync(temporary,{recursive:true,force:true});temporary=null;}candidates.clear();};
 return {
  name:'vale-approved-flac',apply:'build',enforce:'pre',
  buildStart(){
   cleanup();
   const dir=resolve(process.cwd(),'src/lab/audio');
   if(spawnSync('ffmpeg',['-version'],{stdio:'ignore'}).status!==0){
    if(required)this.error('FFmpeg required for verified production FLAC build');
    else this.warn('FFmpeg unavailable: keeping original WAV audio.');
    return;
   }
   temporary=mkdtempSync(join(dir,'.flac-build-'));
   let saved=0;
   try{
    for(const [name,expected] of Object.entries(approved)){
     const src=join(dir,name),dest=join(temporary,name.replace(/\.wav$/,'.flac'));
     try{
      if(pcm(src)!==expected)throw Error('Original PCM differs from browser-approved fingerprint');
      ffmpeg(['-y','-i',src,'-map','0:a:0','-c:a','flac','-compression_level','8',dest]);
      if(pcm(dest)!==expected)throw Error('FLAC PCM mismatch');
      const original=statSync(src).size,compressed=statSync(dest).size;
      if(compressed>=original)throw Error('No size benefit');
      candidates.set(src,dest);saved+=original-compressed;
     }catch(error){
      if(required)throw Error(name+': '+error.message);
      this.warn(name+': keeping WAV ('+error.message+')');
     }
    }
    if(required&&candidates.size!==Object.keys(approved).length)throw Error('Incomplete FLAC build');
    console.log('VALE_APPROVED_FLAC '+JSON.stringify({files:candidates.size,savedBytes:saved}));
   }catch(error){cleanup();this.error(error.message);}
  },
  resolveId(source,importer){
   if(!importer||extname(source)!=='.wav'||!source.startsWith('.'))return null;
   return candidates.get(resolve(dirname(importer),source))||null;
  },
  buildEnd(error){if(error)cleanup();},
  closeBundle(){cleanup();}
 };
}
