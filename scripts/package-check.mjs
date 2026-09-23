import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(path.join(os.tmpdir(),'nonobject-package-'));
const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5175',DATA_DIR:dir,ENQUIRIES_ENABLED:'false',NODE_ENV:'production'},stdio:'pipe'});
let browser;
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://localhost:5175/api/config')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};});
 const page=await context.newPage();const errors=[];const failures=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failures.push(r.url()));await page.goto('http://localhost:5175',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('img[src]').evaluateAll(es=>Promise.all(es.map(e=>{e.loading='eager';return e.decode();})));
 assert.equal(await page.locator('.product-block').count(),1);assert.equal(await page.locator('h1').count(),1);
 await page.screenshot({path:'docs/screenshots/production-hero.png'});
 await page.locator('footer').evaluate(e=>window.scrollTo({top:e.offsetTop,behavior:'instant'}));await page.waitForTimeout(200);await page.screenshot({path:'docs/screenshots/production-ending.png'});
 for(const url of ['/.env','/.data/enquiries','/server/app.js'])assert.equal((await fetch('http://localhost:5175'+url)).status,404);
 assert.equal((await fetch('http://localhost:5175/api/enquiries',{method:'POST'})).status,503);
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};});const p=await nojs.newPage();await p.goto('http://localhost:5175');assert.equal(await p.locator('#submit-enquiry').isDisabled(),true);assert.equal(await p.locator('body').evaluate(e=>getComputedStyle(e).backgroundColor),'rgb(242, 241, 236)');await p.screenshot({path:'docs/screenshots/nojs-hero.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);const report={passed:true,errors,failures,checks:['production assets loaded','production form initialized','private paths return 404','unconfigured production enquiries return 503','no-JavaScript layout styled and form disabled']};await writeFile('docs/package-check.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser?.close();child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}
