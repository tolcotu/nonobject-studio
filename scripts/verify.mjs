import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const results=[];
for(const [name,width,height,reducedMotion] of [['desktop',1440,1000,'no-preference'],['large',1920,1080,'no-preference'],['tablet',834,1112,'no-preference'],['mobile',390,844,'no-preference'],['compact',360,640,'no-preference'],['reduced',390,844,'reduce']]){
 const context=await browser.newContext({viewport:{width,height},reducedMotion});
 await context.addInitScript(()=>{Element.prototype.requestPointerLock=()=>{};Element.prototype.setPointerCapture=()=>{};});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.VERIFY_URL||'http://localhost:5173',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
 await page.locator('img[src]').evaluateAll(es=>Promise.all(es.map(e=>{e.loading='eager';return e.decode().catch(()=>{});})));
 await page.waitForTimeout(500);
 await page.screenshot({path:`docs/screenshots/${name}-hero.png`});
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
 const broken=await page.locator('img[src]').evaluateAll(es=>es.filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src));
 for(const p of [0,.35,.72,1]){await page.locator('.story').evaluate((el,p)=>window.scrollTo(0,el.offsetTop+(el.offsetHeight-innerHeight)*p),p);await page.waitForTimeout(450);await page.screenshot({path:`docs/screenshots/${name}-story-${p}.png`});}
 await page.locator('#work').evaluate(el=>window.scrollTo({top:el.offsetTop,behavior:'instant'}));await page.waitForTimeout(700);await page.screenshot({path:`docs/screenshots/${name}-work.png`});
 await page.locator('#pricing').evaluate(el=>window.scrollTo({top:el.offsetTop,behavior:'instant'}));await page.waitForTimeout(1200);await page.screenshot({path:`docs/screenshots/${name}-pricing.png`});
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 results.push({name,overflow,broken,errors,accessibility:axe.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
 await context.close();
}
await writeFile('docs/verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
