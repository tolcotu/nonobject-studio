import { config } from './content/config.js';
import { calculateEstimate } from './domain/pricing.js';
import { enquirySchema } from './domain/validation.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(n);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let products = [];
let submissionKey = crypto.randomUUID();
let live = false;
let busy = false;
let legalApproved = false;
let pendingFingerprint = '';
const form = $('#project-form');
const githubPagesDemo = import.meta.env.VITE_GITHUB_PAGES_DEMO === 'true';
const siteUrl = path => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`;

$('#year').textContent = new Date().getFullYear();
$('.menu-toggle').addEventListener('click', () => {
 const open = $('.menu-toggle').getAttribute('aria-expanded') !== 'true';
 $('.menu-toggle').setAttribute('aria-expanded', String(open)); $('#main-nav').classList.toggle('is-open', open);
});
$$('#main-nav a').forEach(a => a.addEventListener('click', () => { $('.menu-toggle').setAttribute('aria-expanded', 'false'); $('#main-nav').classList.remove('is-open'); }));
document.addEventListener('keydown', e => { if(e.key === 'Escape') { $('.menu-toggle').setAttribute('aria-expanded','false'); $('#main-nav').classList.remove('is-open'); } });
$('#polish-contact').addEventListener('click', () => { setTimeout(() => $('#contact-name').focus({preventScroll:true}), 350); });

const directions = { Detail: 'Bring materials, finishes and meaningful details into focus.', Context: 'Show the product in a setting your buyer can picture themselves in.', Clarity: 'Turn product information into clear, useful reasons to choose it.' };
$$('[data-direction]').forEach(button => button.addEventListener('click', () => {
 $$('[data-direction]').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
 $('#direction-caption').textContent = directions[button.dataset.direction];
 $('#visual-direction').value = button.dataset.direction;
 $('.story').dataset.direction = button.dataset.direction;
}));
$('#direction-cta').addEventListener('click', () => { $('#visual-direction').value = $('[data-direction][aria-pressed=true]').dataset.direction; });

const studies = {
 blue: { title: 'Material matters', image: 'blue-study', description: 'A study in contrast: deep cobalt, sharp folds and reflective surfaces. An exploration of how light and material can give a simple product a distinctive visual presence.', direction: 'Detail' },
 sound: { title: 'Quietly distinctive', image: 'sound-study', description: 'Soft forms meet rough stone. A product-in-context exploration of texture, balance and the relationship between an everyday object and its surroundings.', direction: 'Context' },
 object: { title: 'Everyday, reframed', image: 'hero-object', description: 'One familiar object, viewed through a sculptural lens. A visual identity experiment in orange and chrome, made to challenge how ordinary products are presented.', direction: 'Clarity' },
};
let selectedStudy;
$$('[data-study]').forEach(button => button.addEventListener('click', () => {
 selectedStudy = studies[button.dataset.study];
 $('#study-title').textContent = selectedStudy.title;
 $('#study-description').textContent = selectedStudy.description;
 $('#study-image').src = siteUrl(`assets/${selectedStudy.image}.webp`);
 $('#study-image').alt = selectedStudy.title + ', AI-generated studio concept';
 $('#study-image').style.objectFit = button.dataset.study === 'object' ? 'contain' : 'cover';
 $('#study-dialog').showModal();
}));
$('#study-enquire').addEventListener('click', () => { $('#visual-direction').value = selectedStudy.direction; $('#study-dialog').close(); $('#project').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
$$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', e => { if(e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));
const legal = {
 privacy: ['Data notice (preview)', ['This website is a local preview. Saving a preview enquiry stores the contact details, product information and selected photos on the machine running this site. It does not send the brief to the studio or send a confirmation email.', 'Provide test details while preview mode is active. Files are kept in private server storage, grouped by request and product. They are not exposed as public downloads. No advertising analytics or tracking cookies are used.', 'Before public enquiries can open, the business owner must supply the data-controller identity, contact address, lawful basis, enquiry retention period and applicable privacy rights. This notice is a transparent preview disclosure, not an approved production privacy policy.'] ],
 cookies: ['Cookies', ['The current website does not use advertising, tracking or analytics cookies. Form data stays in page memory until you submit it. Reloading the page clears an unsaved brief.', 'Any future analytics or third-party integrations must be assessed and this notice updated before they are enabled.'] ],
 terms: ['Project terms (draft)', ['Published service terms: minimum 3 images per product, a €65 set for exactly 9 images, and a €200 minimum for the full order. All estimates require personal scope, availability and price confirmation. Rush work is provisional at +30%.', 'Payment is 50% before work and 50% after approval, before delivery of original files. Two consolidated revision rounds are included per order. Additional rounds or a new concept are quoted separately. Target delivery is up to 5 working days, subject to scope and capacity.', 'Original files are delivered after full payment, preferably via Google Drive, and kept available for one month after completion. Longer retention is agreed separately. Formal terms, legal entity, taxes and governing law still require owner and professional review.'] ],
 company: ['Company & contact', ['NONOBJECT is the selected studio name for this website concept. Official legal entity details, registered address, company identifiers, contact email and messenger destinations have not yet been supplied.', 'The project form supports a phone or messenger preference and a Polish contact entry. Public contact details and production submissions must be configured before launch. No company registration or trademark status is claimed.'] ],
};
$$('[data-legal]').forEach(button => button.addEventListener('click', () => {
 const [title, paragraphs] = legal[button.dataset.legal]; $('#legal-title').textContent = title;
 $('#legal-copy').replaceChildren(...paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; })); $('#legal-dialog').showModal();
}));

function addProduct(count = 9) {
 if(products.length >= config.maxProducts) return;
 const id = crypto.randomUUID(); const product = { id, files: [] }; products.push(product);
 const block = document.createElement('section'); block.className = 'product-block'; block.dataset.id = id;
 block.innerHTML = `<div class="product-top"><h4>Product <span class="product-number">${products.length}</span></h4><button class="remove-product" type="button">Remove product</button></div>
 <div class="field-grid">
 <label>Product name *<input name="productName-${id}" data-field="productName" required maxlength="200" placeholder="What’s the product?"></label>
 <label>SKU *<input name="sku-${id}" data-field="sku" required maxlength="80" placeholder="Your product code"></label>
 <label>EAN (optional)<input name="ean-${id}" data-field="ean" maxlength="30" placeholder="Barcode number"></label>
 <label>Existing listing URL<input name="listingUrl-${id}" data-field="listingUrl" type="url" maxlength="2000" placeholder="https://"></label>
 <fieldset class="platform-field"><legend>Selling platforms *</legend><div class="platform-options">${config.platforms.map((platform, i) => `<label><input type="checkbox" data-platform="${platform}" name="platform-${id}-${i}" ${i === 0 ? 'checked' : ''}>${platform}</label>`).join('')}</div></fieldset>
 <label class="wide">Tell us about the product *<textarea name="information-${id}" data-field="productInformation" required maxlength="10000" rows="3" placeholder="Materials, dimensions, features and what makes it different."></textarea></label>
 <label>Image quantity *<input name="count-${id}" data-field="imageCount" type="number" min="3" max="100" step="1" value="${count}" required></label>
 <label>Format and size *<select name="format-${id}" data-field="imageFormatsAndSizes" required><option value="Confirm for my selected platforms">Confirm for my selected platforms</option><option value="Square 2000 × 2000 px, JPG">Square 2000 × 2000 px, JPG</option><option value="Custom size, confirm with me">Custom size, confirm with me</option></select></label>
 <label class="wide">Product notes (optional)<textarea name="notes-${id}" data-field="additionalNotes" rows="2" maxlength="5000" placeholder="Any requirements for this SKU."></textarea></label>
 <div class="upload-area"><label for="files-${id}"><strong>Give us something to work with.</strong><small>Product photos required. JPG, PNG or WebP.<br>Up to 6 files per SKU, 10 MB each. 24 files per enquiry.</small></label><input id="files-${id}" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="file-error-${id}"><ul class="file-list" aria-live="polite"></ul><p class="file-error" id="file-error-${id}" role="alert"></p></div>
 </div>`;
 $('#products').append(block);
 $('.remove-product',block).addEventListener('click', () => {
  if(products.length === 1) return;
  products = products.filter(p=>p.id !== id); block.remove(); updateProducts(); updateEstimate(); $('#add-product').focus();
 });
 $('input[type=file]',block).addEventListener('change', e => {
  const incoming=[...e.target.files]; const errors=[];
  incoming.forEach(file=>{
   if(!config.uploads.mimeTypes.includes(file.type)) errors.push(`${file.name}: use JPG, PNG or WebP.`);
   else if(file.size > config.uploads.maxFileBytes) errors.push(`${file.name}: maximum size is 10 MB.`);
   else if(product.files.length >= config.uploads.maxFilesPerProduct) errors.push('Maximum 6 photos per product.');
   else if(products.reduce((n,p)=>n+p.files.length,0) >= config.uploads.maxFiles) errors.push('Maximum 24 photos per enquiry.');
   else if(!product.files.some(f=>f.name===file.name&&f.size===file.size&&f.lastModified===file.lastModified)) product.files.push(file);
  });
  $('.file-error',block).textContent=[...new Set(errors)].join(' '); e.target.value=''; renderFiles(product,block);
 });
 $('[data-field=imageCount]',block).addEventListener('input',updateEstimate);
 updateProducts(); updateEstimate(); return block;
}
function renderFiles(product, block) {
 const list=$('.file-list',block);list.replaceChildren();
 product.files.forEach((file,i)=>{
  const li=document.createElement('li');const text=document.createElement('span');text.textContent=`${file.name} (${(file.size/1024/1024).toFixed(1)} MB)`;
  const button=document.createElement('button');button.type='button';button.textContent='×';button.setAttribute('aria-label',`Remove ${file.name}`);
  button.addEventListener('click',()=>{product.files.splice(i,1);renderFiles(product,block);});li.append(text,button);list.append(li);
 });
}
function updateProducts() {
 $$('.product-block').forEach((block,i)=>{ $('.product-number',block).textContent=i+1;$('.remove-product',block).hidden=products.length===1; });
 $('#add-product').disabled=products.length>=config.maxProducts;
}
function readProducts() {
 return products.map(p=>{const block=$(`[data-id="${p.id}"]`); const values={id:p.id};$$('[data-field]',block).forEach(input=>values[input.dataset.field]=input.dataset.field==='imageCount'?Number(input.value):input.value);values.platforms=$$('[data-platform]:checked',block).map(c=>c.dataset.platform);return values;});
}
function updateEstimate() {
 try {
  const estimate=calculateEstimate(readProducts(),$('#rush').checked);
  $('#estimate-total').textContent=estimate.manual?'Custom quote':money(estimate.total);
  $('#estimate-detail').textContent=estimate.manual?`10+ images need a personal quote. Known image subtotal: ${money(estimate.knownSubtotal)}.`:`${products.length} product${products.length===1?'':'s'} · Image subtotal ${money(estimate.subtotal)}${$('#rush').checked?` · Provisional rush ${money(estimate.rushAmount)}`:''}`;
  $('#estimate-minimum').textContent=estimate.belowMinimum?`€200 order minimum. ${estimate.manual?'Your final scope will be reviewed.':`Add ${money(config.pricing.minimumOrder-estimate.knownSubtotal)} in image scope or discuss the project with us.`}`:'The image subtotal meets the €200 order minimum.';
 } catch(error) {$('#estimate-total').textContent='Check quantity';$('#estimate-detail').textContent=error.message;$('#estimate-minimum').textContent='Minimum 3 images per product. €200 minimum per order.';}
}
$('#add-product').addEventListener('click',()=>{const block=addProduct();if(block)$('input',block).focus();});
$('#rush').addEventListener('change',updateEstimate);
$$('[data-package]').forEach(link=>link.addEventListener('click',()=>{$('[data-field=imageCount]').value=link.dataset.package;updateEstimate();}));
addProduct();$('#project-fields').disabled=false;

if(githubPagesDemo){$('#preview-notice').textContent='GitHub Pages preview. This form stays in your browser and creates a brief file for you to download. Nothing is sent or saved to the studio.';$('#submit-enquiry').innerHTML='Download enquiry brief <span aria-hidden="true">↗</span>';legal.privacy[0]='Data notice (GitHub Pages demo)';legal.privacy[1][0]='This static GitHub Pages demo sends no contact information or product files anywhere. Values remain in this browser tab only. Choose Download your brief to create a file on your own device.';}else fetch('/api/config').then(r=>{if(!r.ok)throw new Error();return r.json();}).then(settings=>{
 live=settings.live;legalApproved=settings.legalApproved;
 if(live&&settings.legal) Object.assign(legal,settings.legal);
 if(live&&legalApproved) {$('#preview-notice').textContent='Your request is reviewed personally. Submitting does not place an order.';$('#submit-enquiry').innerHTML='Send project enquiry <span aria-hidden="true">↗</span>';}
}).catch(()=>{$('#preview-notice').textContent='The enquiry service is unavailable. You can fill in your brief, then retry saving when connected.';});

function formError(message) { const el=$('#form-errors');el.hidden=false;el.textContent=message;el.scrollIntoView({block:'center',behavior:'auto'}); }
form.addEventListener('submit', async e=>{
 e.preventDefault();if(busy)return;$('#form-errors').hidden=true;
 const values=Object.fromEntries(new FormData(form));
 const payload={submissionKey,contactName:values.contactName,companyName:values.companyName,email:values.email,country:values.country,vatNumber:values.vatNumber,phoneOrMessenger:values.phoneOrMessenger,rushRequested:$('#rush').checked,generalNotes:values.generalNotes,visualDirection:values.visualDirection,consent:values.consent==='on',website:values.website||'',products:readProducts()};
 const validation=enquirySchema.safeParse(payload);
 if(!validation.success){formError(validation.error.issues.map(i=>`${i.path.join(' / ')}: ${i.message}`).join('\n'));return;}
 const missing=products.find(p=>p.files.length===0);
 if(missing){formError('Please add at least one product photo for every SKU.');$(`[data-id="${missing.id}"] input[type=file]`).focus();return;}
 const fingerprint=JSON.stringify({...payload,submissionKey:null,files:products.map(p=>p.files.map(f=>[f.name,f.size,f.lastModified]))});
 if(pendingFingerprint && pendingFingerprint!==fingerprint){submissionKey=crypto.randomUUID();payload.submissionKey=submissionKey;}
 pendingFingerprint=fingerprint;
 if(githubPagesDemo){
  const requestId=`NO-DEMO-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  const summary={studio:'NONOBJECT',requestId,mode:'GitHub Pages demo: this brief was generated in the browser and has not been sent or saved.',submittedAt:new Date().toISOString(),contact:{name:payload.contactName,company:payload.companyName,email:payload.email,country:payload.country,vatNumber:payload.vatNumber,phoneOrMessenger:payload.phoneOrMessenger},rushRequested:payload.rushRequested,visualDirection:payload.visualDirection,generalNotes:payload.generalNotes,estimate:calculateEstimate(payload.products,payload.rushRequested),products:payload.products.map(p=>({...p,files:products.find(x=>x.id===p.id).files.map(f=>({name:f.name,sizeBytes:f.size,type:f.type}))}))};
  const panel=$('#form-success');panel.hidden=false;form.hidden=true;panel.innerHTML=`<span class="small-star" aria-hidden="true">✳</span><h3>Your brief is ready to download.</h3><p>This GitHub Pages demo has not sent or saved your details. The downloaded file stays on your device.</p><p><strong>Request ${escape(requestId)}</strong><br>${payload.products.length} product${payload.products.length===1?'':'s'}</p><button class="button button-dark" type="button" id="download-summary">Download enquiry brief <span aria-hidden="true">↗</span></button><br><button class="text-link inline-button" type="button" id="new-enquiry">Start another brief</button>`;
  $('#download-summary').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(summary,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`NONOBJECT-${requestId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('#new-enquiry').addEventListener('click',()=>{form.reset();products=[];$('#products').replaceChildren();addProduct();submissionKey=crypto.randomUUID();pendingFingerprint='';panel.hidden=true;form.hidden=false;$('#contact-name').focus();});panel.focus();return;
 }
 const data=new FormData();data.append('payload',JSON.stringify(payload));products.forEach(p=>p.files.forEach(file=>data.append(`files-${p.id}`,file)));
 busy=true;$('#project-fields').disabled=true;$('.upload-progress').hidden=false;$('#upload-status').textContent='Uploading your product materials…';$('#upload-progress').value=0;
 const xhr=new XMLHttpRequest();xhr.open('POST','/api/enquiries');xhr.timeout=120000;
 xhr.upload.onprogress=event=>{if(event.lengthComputable){const percent=Math.round(event.loaded/event.total*100);$('#upload-progress').value=percent;$('#upload-status').textContent=percent<100?`Uploading materials: ${percent}%`:'Materials uploaded. Saving your enquiry…';}};
 const reset=()=>{busy=false;$('#project-fields').disabled=false;$('.upload-progress').hidden=true;};
 xhr.onload=()=>{
  reset();let result;try{result=JSON.parse(xhr.responseText);}catch{formError('The server returned an unexpected response. Your files are still selected. Please retry.');return;}
  if(xhr.status<200||xhr.status>=300){formError(result.error||'Could not save the enquiry. Your files are still selected. Please retry.');return;}
  const panel=$('#form-success');panel.hidden=false;form.hidden=true;
  const title=result.preview?'Your preview brief is saved.':'Your project enquiry is received.';
  const message=result.preview?'This is a local preview. Your information is stored on this machine; it has not been sent to the studio.':result.confirmationSent?'A confirmation email has been sent. Your request will be reviewed personally.':'Your enquiry is safely stored. Email confirmation is pending; keep the request ID below.';
  panel.innerHTML=`<span class="small-star" aria-hidden="true">✳</span><h3>${title}</h3><p>${message}</p><p><strong>Request ${escape(result.requestId)}</strong><br>${products.length} product${products.length===1?'':'s'} · ${escape(values.email)}</p><p>This is an enquiry, not a confirmed order or final quote.</p><button class="button button-dark" type="button" id="download-summary">Download brief summary <span aria-hidden="true">↗</span></button><br><button class="text-link inline-button" type="button" id="new-enquiry">Start another brief</button>`;
  $('#download-summary').addEventListener('click',()=>{const blob=new Blob([JSON.stringify({requestId:result.requestId,preview:result.preview,...payload,submissionKey:undefined},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`NONOBJECT-${result.requestId}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  $('#new-enquiry').addEventListener('click',()=>{form.reset();products=[];$('#products').replaceChildren();addProduct();submissionKey=crypto.randomUUID();pendingFingerprint='';panel.hidden=true;form.hidden=false;$('#contact-name').focus();});panel.focus();
 };
 xhr.onerror=()=>{reset();formError('Connection lost. Your files and fields are preserved. Please retry saving; duplicate requests are prevented.');};
 xhr.ontimeout=()=>{reset();formError('The upload timed out. Your files and fields are preserved. Please retry.');};xhr.send(data);
});

function initScroll() {
 if(window.ScrollCraft) window.ScrollCraft.mount(document);
 const story=$('.story');const reduce=matchMedia('(prefers-reduced-motion: reduce)');let raf=false;
 function paint(){raf=false;const r=story.getBoundingClientRect();const p=reduce.matches?1:Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));const assembly=Math.max(0,Math.min(1,(p-.08)/.68));story.style.setProperty('--assembly',assembly.toFixed(4));}
 function schedule(){if(!raf){raf=true;requestAnimationFrame(paint);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduce.addEventListener('change',schedule);paint();
}
if(document.readyState==='complete')initScroll();else addEventListener('load',initScroll,{once:true});
