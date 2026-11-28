import {chromium} from 'playwright';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const server=await createServer({configFile:false,logLevel:'silent',server:{host:'127.0.0.1',port:0}});let browser;
try{
 await server.listen();browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1,reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.message);});page.on('console',m=>{if(m.type()==='error')console.error(m.text());});
 await page.goto('http://127.0.0.1:'+server.httpServer.address().port+'/emy-preview.html');
 await page.getByRole('button',{name:'Ver modelo 3D'}).click();
 fs.mkdirSync('output/emy-face-baseline/house',{recursive:true});
 for(const variant of ['original','soft','refined','original']){
  await page.getByLabel('Modelo de Emy',{exact:true}).selectOption(variant);
  await page.waitForFunction(()=>/Paseando|Descansando|Limpiando|Estirándose|Durmiendo|Ronroneando/.test(document.querySelector('.emy-model-label [role=status]')?.textContent),undefined,{timeout:60000});
  const size=await page.locator('canvas').evaluate(c=>[c.width,c.height]);assert(size[0]>300&&size[1]>200);
  await page.screenshot({path:'output/emy-face-baseline/house/'+variant+'.png'});
  await page.getByRole('button',{name:'Acariciar a Emy'}).click();
  await page.waitForFunction(()=>document.querySelector('.emy-model-label [role=status]')?.textContent.includes('Ronroneando'),undefined,{timeout:30000});
 }
 assert.deepEqual(errors,[]);console.log('PASS actual house preview: all variants, pet interaction and switching back');
}finally{await browser?.close();await server.close();}
