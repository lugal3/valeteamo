import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1240,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('PAGEERROR',e.message);});page.on('console',m=>{if(m.type()==='error')console.error('CONSOLE',m.text());});page.on('requestfailed',r=>console.error('REQUESTFAILED',r.url(),r.failure()));
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/emy-face-review.html');
 fs.mkdirSync('output/emy-face-baseline/lab',{recursive:true});
 try{await page.waitForFunction(()=>window.__emyReview,undefined,{timeout:30000});}catch(e){console.error('VIEWER_DIAGNOSTIC',await page.locator('#status').textContent(),errors);await page.screenshot({path:'output/emy-face-baseline/lab/error.png'});throw e;}
 await page.selectOption('#variant','candidate');
 for(const view of ['front','three','left','right','back','top']){
  await page.selectOption('#view',view);
  const snapshot=await page.evaluate(()=>window.__emyReview.snapshot());assert(snapshot.equal);
  const pixels=await page.evaluate(()=>{const a=document.querySelector('#original'),b=document.querySelector('#candidate');return a.toDataURL()===b.toDataURL();});assert(pixels,view+' identical pixels');
  await page.screenshot({path:'output/emy-face-baseline/lab/'+view+'.png'});
 }
 await page.selectOption('#pose','sleep');await page.check('#lod');assert((await page.evaluate(()=>window.__emyReview.snapshot())).equal);
 await page.setViewportSize({width:844,height:390});await page.selectOption('#pose','groom');await page.screenshot({path:'output/emy-face-baseline/lab/mobile.png'});
 await page.setViewportSize({width:1240,height:900});await page.uncheck('#lod');await page.selectOption('#pose','idle');
 for(const variant of ['soft','refined']){await page.selectOption('#variant',variant);for(const view of ['front','three','left','right','back','top']){await page.selectOption('#view',view);const snap=await page.evaluate(()=>window.__emyReview.snapshot());assert(!snap.equal,variant+' actually differs');await page.screenshot({path:'output/emy-face-baseline/lab/'+variant+'-'+view+'.png'});}}
 await page.selectOption('#variant','refined');await page.selectOption('#view','front');await page.selectOption('#pose','idle');await page.uncheck('#eyes');
 const beforeEye=await page.locator('#candidate').evaluate(c=>c.toDataURL());
 await page.screenshot({path:'output/emy-face-baseline/lab/eyes-off.png'});await page.check('#eyes');
 const afterEye=await page.locator('#candidate').evaluate(c=>c.toDataURL());assert.notEqual(beforeEye,afterEye,'eye style must change rendered pixels');
 for(const [name,mode,blink,alarm] of [['neutral','idle',false,0],['sleep','sleep',true,0],['fear','alert',false,.85],['purr','purr',false,0]]){
  await page.selectOption('#pose',mode);await page.locator('#alarm').evaluate((el,v)=>{el.value=v;el.dispatchEvent(new Event('input'));},alarm);await page.locator('#blink').setChecked(blink);
  await page.screenshot({path:'output/emy-face-baseline/lab/eyes-'+name+'.png'});
 }
 assert.deepEqual(errors,[]);console.log('PASS actual WebGL: baseline six views, identical pixels, low LOD, poses and mobile viewport; 12 candidate views');
}finally{await browser?.close();await server.close();}
