import { config } from './content/config.js';
import { enquirySchema } from './domain/validation.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let attachments = [];
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
 sieve: { title: 'Precision in the details', category: 'KITCHEN / AMAZON LISTING', image: 'sieve', count: 8, description: 'An eight-frame product gallery for a 20 cm stainless-steel sieve, balancing material details, practical use and clear product information.', direction: 'Detail' },
 baking: { title: 'Made for every bake', category: 'KITCHEN / PRODUCT LISTING', image: 'baking', count: 9, description: 'A nine-frame listing set for a 30 cm baking dish, showing the product in use alongside its form, size and everyday versatility.', direction: 'Context' },
 tray: { title: 'Everyday, served beautifully', category: 'KITCHEN / PRODUCT LISTING', image: 'tray', count: 6, description: 'A six-frame product story for a serving tray, moving between a calm home setting, product details and serving moments.', direction: 'Context' },
};
let selectedStudy;
let selectedStudyImage = 0;
function showStudyImage() {
 const project = selectedStudy.image;
 const index = selectedStudyImage + 1;
 $('#study-image').src = siteUrl(`assets/portfolio/${project}/${String(index).padStart(2, '0')}.webp`);
 $('#study-image').alt = `${selectedStudy.title}, product listing image ${index} of ${selectedStudy.count}`;
 $('#study-count').textContent = `${String(index).padStart(2, '0')} / ${String(selectedStudy.count).padStart(2, '0')}`;
}
$$('[data-study]').forEach(button => button.addEventListener('click', () => {
 selectedStudy = studies[button.dataset.study];
 selectedStudyImage = 0;
 $('#study-title').textContent = selectedStudy.title;
 $('#study-category').textContent = selectedStudy.category;
 $('#study-description').textContent = selectedStudy.description;
 showStudyImage();
 $('#study-dialog').showModal();
}));
$('#study-prev').addEventListener('click', () => { selectedStudyImage = (selectedStudyImage - 1 + selectedStudy.count) % selectedStudy.count; showStudyImage(); });
$('#study-next').addEventListener('click', () => { selectedStudyImage = (selectedStudyImage + 1) % selectedStudy.count; showStudyImage(); });
$('#study-dialog').addEventListener('keydown', event => {
 if (event.key === 'ArrowLeft') { event.preventDefault(); $('#study-prev').click(); }
 if (event.key === 'ArrowRight') { event.preventDefault(); $('#study-next').click(); }
});
$('#study-enquire').addEventListener('click', () => { $('#visual-direction').value = selectedStudy.direction; $('#study-dialog').close(); $('#project').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
$$('.dialog-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', e => { if(e.target === dialog) { const r = dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));
const legal = {
 privacy: ['Data notice (preview)', ['This website is a local preview. Saving a preview enquiry stores the contact details, project brief and any attachments on the machine running this site. It does not send the brief to the studio or send a confirmation email.', 'Provide test details while preview mode is active. Files are kept in private storage under the request. They are not exposed as public downloads. No advertising analytics or tracking cookies are used.', 'Before public enquiries can open, the business owner must supply the data-controller identity, contact address, lawful basis, enquiry retention period and applicable privacy rights. This notice is a transparent preview disclosure, not an approved production privacy policy.'] ],
 cookies: ['Cookies', ['The current website does not use advertising, tracking or analytics cookies. Form data stays in page memory until you submit it. Reloading the page clears an unsaved brief.', 'Any future analytics or third-party integrations must be assessed and this notice updated before they are enabled.'] ],
 terms: ['Project terms (draft)', ['Published service terms: minimum 3 images per product, a €65 set for exactly 9 images, and a €200 minimum for the full order. All estimates require personal scope, availability and price confirmation. Rush work is provisional at +30%.', 'Payment is 50% before work and 50% after approval, before delivery of original files. Two consolidated revision rounds are included per order. Additional rounds or a new concept are quoted separately. Target delivery is up to 5 working days, subject to scope and capacity.', 'Original files are delivered after full payment, preferably via Google Drive, and kept available for one month after completion. Longer retention is agreed separately. Formal terms, legal entity, taxes and governing law still require owner and professional review.'] ],
 company: ['Company & contact', ['NONOBJECT is the selected studio name for this website concept. Official legal entity details, registered address, company identifiers and contact email have not yet been supplied.', 'The project form offers a short enquiry and a Polish contact entry. Public contact details and production submissions must be configured before launch. No company registration or trademark status is claimed.'] ],
};
$$('[data-legal]').forEach(button => button.addEventListener('click', () => {
 const [title, paragraphs] = legal[button.dataset.legal]; $('#legal-title').textContent = title;
 $('#legal-copy').replaceChildren(...paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; })); $('#legal-dialog').showModal();
}));

const fileInput = $('#brief-files');
const fileList = $('#brief-file-list');
function renderFiles() {
 fileList.replaceChildren();
 attachments.forEach((file, index) => {
  const item = document.createElement('li');
  const label = document.createElement('span');
  label.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  const remove = document.createElement('button');
  remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', `Remove ${file.name}`);
  remove.addEventListener('click', () => { attachments.splice(index, 1); renderFiles(); });
  item.append(label, remove); fileList.append(item);
 });
}
fileInput.addEventListener('change', event => {
 const errors = [];
 for (const file of event.target.files) {
  if (!config.uploads.mimeTypes.includes(file.type)) errors.push(`${file.name}: use JPG, PNG, WebP or PDF.`);
  else if (file.size > config.uploads.maxFileBytes) errors.push(`${file.name}: maximum size is 10 MB.`);
  else if (attachments.length >= config.uploads.maxFiles) errors.push('Maximum 6 files per request.');
  else if (!attachments.some(saved => saved.name === file.name && saved.size === file.size && saved.lastModified === file.lastModified)) attachments.push(file);
 }
 $('#brief-file-error').textContent = [...new Set(errors)].join(' ');
 fileInput.value = ''; renderFiles();
});

$$('[data-package]').forEach(link => link.addEventListener('click', () => {
 const need = link.dataset.package === '9' ? 'Complete listing visuals' : 'Individual visuals';
 const option = $$('input[name="projectNeed"]').find(input => input.value === need);
 if (option) option.checked = true;
}));
$('#project-fields').disabled = false;
if (githubPagesDemo) {
 $('#preview-notice').textContent = 'GitHub Pages preview. SEND PROJECT prepares a brief to download on your device. Nothing is sent to the studio.';
 legal.privacy[0] = 'Data notice (GitHub Pages demo)';
 legal.privacy[1][0] = 'This static GitHub Pages demo sends no contact information or files anywhere. Values remain in this browser tab. SEND PROJECT prepares a downloadable brief on your device; selected attachments are listed by name but their contents are not included.';
} else fetch('/api/config').then(response => {
 if (!response.ok) throw new Error(); return response.json();
}).then(settings => {
 live = settings.live; legalApproved = settings.legalApproved;
 if (live && settings.legal) Object.assign(legal, settings.legal);
 if (live && legalApproved) $('#preview-notice').textContent = 'Your project request is reviewed personally. Submitting does not place an order.';
}).catch(() => { $('#preview-notice').textContent = 'The enquiry service is unavailable. You can fill in your brief, then retry when connected.'; });

function formError(message) {
 const el = $('#form-errors'); el.hidden = false; el.textContent = message;
 el.scrollIntoView({ block: 'center', behavior: 'auto' });
}
function readBrief() {
 const values = new FormData(form);
 return {
  submissionKey, contactName: values.get('contactName') || '', email: values.get('email') || '',
  companyName: values.get('companyName') || '', projectUrl: values.get('projectUrl') || '',
  projectNeed: values.get('projectNeed') || '', productCount: values.get('productCount') || '',
  platforms: values.getAll('platforms'), materialsStatus: values.get('materialsStatus') || '',
  timeline: values.get('timeline') || '', notes: values.get('notes') || '',
  materialsLink: values.get('materialsLink') || '', visualDirection: values.get('visualDirection') || '',
  consent: values.get('consent') === 'on', website: values.get('website') || '',
 };
}
function downloadBrief(requestId, summary) {
 const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
 anchor.href = url; anchor.download = `NONOBJECT-${requestId}.json`; anchor.click();
 setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function resetBrief() {
 form.reset(); attachments = []; renderFiles(); $('#brief-file-error').textContent = '';
 submissionKey = crypto.randomUUID(); pendingFingerprint = '';
 $('#form-success').hidden = true; form.hidden = false; $('#contact-name').focus();
}
function showSuccess(result, payload, demo = false) {
 const panel = $('#form-success'); panel.hidden = false; form.hidden = true;
 const title = demo ? 'Your brief is ready to download.' : result.preview ? 'Your preview brief is saved.' : 'Your project enquiry is received.';
 const message = demo ? 'This GitHub Pages demo has not sent or saved your details. The downloaded brief stays on your device; attached files are listed by name only.' : result.preview ? 'Your information is stored on this machine; it has not been sent to the studio.' : result.confirmationSent ? 'A confirmation email has been sent. We’ll review your brief and contact you personally.' : 'Your enquiry is safely stored. Email confirmation is pending; keep the request ID below.';
 panel.innerHTML = `<span class="small-star" aria-hidden="true">✳</span><h3>${title}</h3><p>${message}</p><p><strong>Request ${escape(result.requestId)}</strong><br>${escape(payload.productCount)} ${payload.productCount === '1' ? 'product' : 'products'} · ${escape(payload.email)}</p><p>Scope and price are confirmed personally after review.</p><button class="button button-dark" type="button" id="download-summary">Download brief summary <span aria-hidden="true">↗</span></button><br><button class="text-link inline-button" type="button" id="new-enquiry">Start another brief</button>`;
 const summary = { studio: 'NONOBJECT', requestId: result.requestId, mode: demo ? 'GitHub Pages demo: not sent to the studio.' : result.preview ? 'Local preview: saved on this machine only.' : 'Submitted', submittedAt: new Date().toISOString(), ...payload, submissionKey: undefined, website: undefined, attachments: attachments.map(file => ({ name: file.name, sizeBytes: file.size, type: file.type })) };
 $('#download-summary').addEventListener('click', () => downloadBrief(result.requestId, summary));
 $('#new-enquiry').addEventListener('click', resetBrief); panel.focus();
}
form.addEventListener('submit', event => {
 event.preventDefault(); if (busy) return; $('#form-errors').hidden = true;
 const payload = readBrief(); const validation = enquirySchema.safeParse(payload);
 if (!validation.success) { formError(validation.error.issues.map(issue => `${issue.path.join(' / ')}: ${issue.message}`).join('\n')); return; }
 const fingerprint = JSON.stringify({ ...payload, submissionKey: null, files: attachments.map(file => [file.name, file.size, file.lastModified]) });
 if (pendingFingerprint && pendingFingerprint !== fingerprint) { submissionKey = crypto.randomUUID(); payload.submissionKey = submissionKey; }
 pendingFingerprint = fingerprint;
 if (githubPagesDemo) {
  const requestId = `NO-DEMO-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  showSuccess({ requestId }, payload, true); return;
 }
 const data = new FormData(); data.append('payload', JSON.stringify(payload));
 attachments.forEach(file => data.append('attachments', file));
 busy = true; $('#project-fields').disabled = true; $('.upload-progress').hidden = false;
 $('#upload-status').textContent = 'Saving your project brief…'; $('#upload-progress').value = 0;
 const xhr = new XMLHttpRequest(); xhr.open('POST', '/api/enquiries'); xhr.timeout = 120000;
 xhr.upload.onprogress = progress => { if (progress.lengthComputable) { const percent = Math.round(progress.loaded / progress.total * 100); $('#upload-progress').value = percent; $('#upload-status').textContent = percent < 100 ? `Uploading: ${percent}%` : 'Saving your enquiry…'; } };
 const reset = () => { busy = false; $('#project-fields').disabled = false; $('.upload-progress').hidden = true; };
 xhr.onload = () => {
  reset(); let result; try { result = JSON.parse(xhr.responseText); } catch { formError('The server returned an unexpected response. Your brief is preserved. Please retry.'); return; }
  if (xhr.status < 200 || xhr.status >= 300) { formError(result.error || 'Could not save the enquiry. Your brief is preserved. Please retry.'); return; }
  showSuccess(result, payload);
 };
 xhr.onerror = () => { reset(); formError('Connection lost. Your brief and files are preserved. Please retry.'); };
 xhr.ontimeout = () => { reset(); formError('The upload timed out. Your brief and files are preserved. Please retry.'); };
 xhr.send(data);
});

function initScroll() {
 if(window.ScrollCraft) window.ScrollCraft.mount(document);
 const story=$('.story');const reduce=matchMedia('(prefers-reduced-motion: reduce)');let raf=false;
 function paint(){raf=false;const r=story.getBoundingClientRect();const p=reduce.matches?1:Math.max(0,Math.min(1,-r.top/Math.max(1,r.height-innerHeight)));const assembly=Math.max(0,Math.min(1,(p-.08)/.68));story.style.setProperty('--assembly',assembly.toFixed(4));}
 function schedule(){if(!raf){raf=true;requestAnimationFrame(paint);}}
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);reduce.addEventListener('change',schedule);paint();
}
if(document.readyState==='complete')initScroll();else addEventListener('load',initScroll,{once:true});
