// Serve originals and candidates on loopback; compare decoded AudioBuffers
// in Chromium and WebKit at the source sample rate, with no resampling.
const fs=require('node:fs/promises'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
(async()=>{
 const dir=path.resolve(process.argv[2]),report=JSON.parse(await fs.readFile(path.join(dir,'report.json'),'utf8'));
 const files=report.files.filter(r=>r.status==='candidate');
 assert(files.length,'At least one smaller PCM-exact candidate required');
 const server=http.createServer(async(req,res)=>{
  try{
   if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Audio QA</title>');return;}
   const m=/^\/(original|candidate)\/(\d+)$/.exec(req.url);
   if(!m||!files[Number(m[2])]){res.writeHead(404);res.end();return;}
   const row=files[Number(m[2])],original=m[1]==='original';
   res.setHeader('Content-Type',original?'audio/wav':'audio/flac');
   res.end(await fs.readFile(original?row.source:path.join(dir,row.candidate)));
  }catch(e){res.writeHead(500);res.end(String(e));}
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const [name,type] of [['chromium',chromium],['webkit',webkit]]){
   const browser=await type.launch({headless:true});
   try{
    const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port);
    for(const [i,row] of files.entries()){
     const result=await page.evaluate(async({i,rate})=>{
      let ctx;
      try{
       ctx=new OfflineAudioContext(1,1,rate);
       const decode=async kind=>ctx.decodeAudioData(await (await fetch('/'+kind+'/'+i)).arrayBuffer());
       const [a,b]=await Promise.all([decode('original'),decode('candidate')]);
       const same=a.length===b.length&&a.numberOfChannels===b.numberOfChannels&&a.sampleRate===b.sampleRate;
       let maxError=0;if(same)for(let c=0;c<a.numberOfChannels;c++){
        const x=a.getChannelData(c),y=b.getChannelData(c);
        for(let k=0;k<x.length;k++)maxError=Math.max(maxError,Math.abs(x[k]-y[k]));
       }
       return {same,maxError,length:a.length,rate:a.sampleRate,channels:a.numberOfChannels,pass:same&&maxError===0};
      }catch(e){return {pass:false,error:String(e)};}
     },{i,rate:row.rate});
     (row.browser??={})[name]=result;
     console.log(name,row.source,JSON.stringify(result));
    }
   }finally{await browser.close();}
  }
  report.browserApproved=files.filter(r=>r.browser?.chromium?.pass&&r.browser?.webkit?.pass);
  report.browserApprovedSavings=report.browserApproved.reduce((n,r)=>n+r.bytes-r.candidateBytes,0);
  await fs.writeFile(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');
  assert(report.browserApproved.length,'No candidate achieved exact browser decoding in both engines');
 }finally{await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
