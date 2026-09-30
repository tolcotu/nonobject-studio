import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile,readdir,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=await mkdtemp(path.join(os.tmpdir(),'nonobject-browser-'));
const child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:'5174',DATA_DIR:dir,ENQUIRIES_ENABLED:'false',PUBLIC_ORIGIN:'http://localhost:5174',NODE_ENV:'development'},stdio:'pipe'});
let browser;
try {
 for(let i=0;i<50;i++){try{if((await fetch('http://localhost:5174/api/config')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://localhost:5174',{waitUntil:'networkidle'});
 await page.locator('[data-study=sieve]').click();assert.equal(await page.locator('#study-dialog').evaluate(d=>d.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('#study-dialog').evaluate(d=>d.open),false);
 assert.equal(await page.locator('.product-block,[data-field=sku],#add-product').count(),0);
 await page.locator('#contact-name').fill('Preview Tester');await page.locator('[name=email]').fill('preview@example.com');
 await page.getByRole('radio',{name:'Complete listing visuals'}).check();await page.getByRole('radio',{name:'100+'}).check();await page.getByRole('checkbox',{name:'Amazon'}).check();await page.locator('input[name=materialsStatus][value="Not sure yet"]').check();await page.getByRole('radio',{name:'Flexible'}).check();await page.locator('[name=consent]').check();
 await page.route('**/api/enquiries',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test connection interruption. Please retry.'})}),{times:1});
 await page.locator('#submit-enquiry').click();await page.locator('#form-errors').filter({hasText:'Test connection interruption'}).waitFor();assert.equal(await page.locator('#contact-name').inputValue(),'Preview Tester');
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 await page.locator('#submit-enquiry').click();await page.locator('#form-success').waitFor();assert.match(await page.locator('#form-success').textContent(),/preview brief is saved/);assert.match(await page.locator('#form-success').textContent(),/not been sent/);
 const downloadPromise=page.waitForEvent('download');await page.locator('#download-summary').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/NONOBJECT-NO-/);
 const dirs=await readdir(path.join(dir,'enquiries'));assert.equal(dirs.length,1);const record=JSON.parse(await readFile(path.join(dir,'enquiries',dirs[0],'enquiry.json'),'utf8'));assert.equal(record.productCount,'100+');assert.deepEqual(record.attachments,[]);assert.equal(record.visualDirection,'');
 await page.screenshot({path:'docs/screenshots/form-success.png'});
 await page.locator('#new-enquiry').click();assert.equal(await page.locator('#contact-name').inputValue(),'');
 await page.locator('[data-legal=privacy]').last().click();assert.equal(await page.locator('#legal-dialog').evaluate(d=>d.open),true);await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.locator('#project').evaluate(el=>window.scrollTo({top:el.offsetTop,behavior:'instant'}));await page.screenshot({path:'docs/screenshots/mobile-form.png'});
 const mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(mobileOverflow,false);
 const nojs=await browser.newContext({javaScriptEnabled:false});const p=await nojs.newPage();await p.goto('http://localhost:5174');assert.equal(await p.locator('#submit-enquiry').isDisabled(),true);await nojs.close();
 const results={passed:errors.length===0&&axe.violations.length===0&&!mobileOverflow,checks:['no per-product fields','100+ product enquiry without uploads','failure preserves brief','retry saves exactly one enquiry','summary downloads','preview correctly reports no delivery','new brief resets','privacy dialog','mobile width','no-JavaScript disabled'],errors,accessibility:axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))};
 await writeFile('docs/interactions.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));assert.equal(errors.length,0);assert.equal(results.accessibility.length,0);
} finally {await browser?.close();child.kill('SIGTERM');await new Promise(r=>child.once('exit',r));await rm(dir,{recursive:true,force:true});}
