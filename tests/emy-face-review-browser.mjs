import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1240,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/emy-face-review.html');
 await page.waitForFunction(()=>window.__emyReview);
 fs.mkdirSync('output/emy-face-baseline/lab',{recursive:true});
 for(const view of ['front','three','left','right','back','top']){
  await page.selectOption('#view',view);
  const snapshot=await page.evaluate(()=>window.__emyReview.snapshot());assert(snapshot.equal);
  const pixels=await page.evaluate(()=>{const a=document.querySelector('#original'),b=document.querySelector('#candidate');return a.toDataURL()===b.toDataURL();});assert(pixels,view+' identical pixels');
  await page.screenshot({path:'output/emy-face-baseline/lab/'+view+'.png'});
 }
 await page.selectOption('#pose','sleep');await page.check('#lod');assert((await page.evaluate(()=>window.__emyReview.snapshot())).equal);
 await page.setViewportSize({width:844,height:390});await page.selectOption('#pose','groom');await page.screenshot({path:'output/emy-face-baseline/lab/mobile.png'});
 assert.deepEqual(errors,[]);console.log('PASS actual WebGL: six views, identical pixels, low LOD, poses and mobile viewport');
}finally{await browser?.close();await server.close();}
