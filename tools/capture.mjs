// Run in GitHub Actions with Playwright and Chromium's software WebGL renderer.
import {chromium} from 'playwright';
import {mkdir,copyFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';
const root=process.cwd();
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const relative=normalize(decodeURIComponent(new URL(req.url,'http://localhost').pathname)).replace(/^\/+/, '')||'index.html';if(relative.startsWith('..'))throw Error('Bad path');const body=await readFile(join(root,relative));res.writeHead(200,{'Content-Type':types[extname(relative)]||'application/octet-stream'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}});
await new Promise(resolve=>server.listen(8080,'127.0.0.1',resolve));await mkdir('media',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
 const desktop=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:'media',size:{width:1280,height:800}}});
 const page=await desktop.newPage();await page.goto('http://127.0.0.1:8080/#date=1969-07-20&body=earth');
 await page.locator('#loading').waitFor({state:'hidden',timeout:30000});
 if(await page.locator('#webgl-error').isVisible()||await page.locator('canvas').count()===0)throw Error('WebGL2 did not initialize; refusing to publish misleading captures');
 await page.waitForTimeout(1000);await page.screenshot({path:'media/desktop.png'});
 await page.locator('#focus-body').click();await page.waitForTimeout(1100);
 await page.locator('#overview').click();await page.waitForTimeout(1100);
 await page.locator('#date-preset').selectOption('1989-08-25');await page.waitForTimeout(900);
 await page.locator('#play').click();await page.waitForTimeout(1600);await page.locator('#play').click();
 const video=await page.video().path();await desktop.close();await copyFile(video,'media/demo.webm');
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const small=await mobile.newPage();await small.goto('http://127.0.0.1:8080/#date=1989-08-25&body=neptune');await small.locator('#loading').waitFor({state:'hidden',timeout:30000});
 if(await small.locator('#webgl-error').isVisible()||await small.locator('canvas').count()===0)throw Error('Mobile WebGL2 did not initialize');
 await small.waitForTimeout(900);await small.screenshot({path:'media/mobile.png'});await mobile.close();
}finally{await browser.close();server.close();}
