import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { mkdir, readFile, writeFile, rm, rename, chmod } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { config } from '../src/content/config.js';
import { enquirySchema, imageType } from '../src/domain/validation.js';
import { calculateEstimate } from '../src/domain/pricing.js';
import { notify, writeRecord } from './notifications.js';
export async function createApp(options={}) {
 const app=express(); app.disable('x-powered-by');
 const dataDir=path.resolve(options.dataDir||process.env.DATA_DIR||'.data');
 const tempDir=path.join(dataDir,'pending');await mkdir(tempDir,{recursive:true,mode:0o700});await chmod(dataDir,0o700);
 let legal=null;
 if(process.env.LEGAL_NOTICE_FILE){try{legal=JSON.parse(await readFile(process.env.LEGAL_NOTICE_FILE,'utf8'));if(!['privacy','terms','company','cookies'].every(k=>Array.isArray(legal[k])&&typeof legal[k][0]==='string'&&Array.isArray(legal[k][1])&&legal[k][1].every(p=>typeof p==='string')))legal=null;}catch{legal=null;}}
 const live=options.live??(process.env.ENQUIRIES_ENABLED==='true'&&Boolean(legal)&&Boolean(process.env.PUBLIC_ORIGIN));
 app.use((req,res,next)=>{res.set({'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});next();});
 app.get('/api/config',(req,res)=>res.json({live,legalApproved:Boolean(legal),legal:live?legal:null}));
 const requests=new Map();const locks=new Set();
 const limiter=setInterval(()=>{const now=Date.now();for(const [key,value]of requests)if(now>value.reset)requests.delete(key);},60000);limiter.unref();
 app.use('/api/enquiries',(req,res,next)=>{
  if(req.method!=='POST')return next();
  const expected=process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`;
  if(req.headers.origin&&req.headers.origin!==expected)return res.status(403).json({error:'Please submit from this website.'});
  if(process.env.NODE_ENV==='production'&&!live)return res.status(503).json({error:'Public enquiries are not open yet. Please check back after studio setup is complete.'});
  const ip=req.ip;const now=Date.now();let bucket=requests.get(ip);if(!bucket||now>bucket.reset){bucket={count:0,reset:now+15*60*1000};requests.set(ip,bucket);}
  if(++bucket.count>(options.rateLimit??10))return res.status(429).json({error:'Too many attempts. Please retry in 15 minutes.'});
  next();
 });
 const upload=multer({dest:tempDir,limits:{fileSize:config.uploads.maxFileBytes,files:config.uploads.maxFiles,fields:1,fieldSize:200000,parts:config.uploads.maxFiles+1},fileFilter:(req,file,callback)=>{
  if(!config.uploads.mimeTypes.includes(file.mimetype))return callback(new Error('Use JPG, PNG or WebP photos only.'));callback(null,true);
 }}).any();
 app.post('/api/enquiries',(req,res)=>upload(req,res,async uploadError=>{
  const clean=()=>Promise.all((req.files||[]).map(f=>rm(f.path,{force:true}).catch(()=>{})));
  if(uploadError){await clean();return res.status(400).json({error:uploadError.code==='LIMIT_FILE_SIZE'?'A file exceeds the 10 MB limit.':uploadError.code?'Upload limits exceeded. Maximum 6 files per product, 24 overall, 10 MB each.':uploadError.message});}
  let dir;let lockedKey;let saved=false;
  try {
   let raw;try{raw=JSON.parse(req.body.payload||'');}catch{await clean();return res.status(400).json({error:'The project brief was missing or invalid. Please submit using the project form.'});}
   const parsed=enquirySchema.safeParse(raw);if(!parsed.success){await clean();return res.status(400).json({error:parsed.error.issues.map(i=>`${i.path.join(' / ')}: ${i.message}`).join('\n')});}
   const enquiry=parsed.data;
   const key=createHash('sha256').update(enquiry.submissionKey).digest('hex');
   dir=path.join(dataDir,'enquiries',key);
   try { const existing=JSON.parse(await readFile(path.join(dir,'enquiry.json'),'utf8'));await clean();return res.json({requestId:existing.requestId,preview:existing.preview,confirmationSent:existing.notifications.clientEmail?.status==='sent',duplicate:true}); } catch(error){if(error.code!=='ENOENT')throw error;}
   if(locks.has(key)){await clean();return res.status(409).json({error:'This enquiry is still saving. Please wait a moment and retry.'});}
   locks.add(key);lockedKey=key;
   const fields=new Set(enquiry.products.map(p=>`files-${p.id}`));
   if(req.files.some(f=>!fields.has(f.fieldname)))throw new Error('A photo did not match a product. Please select it again.');
   for(const product of enquiry.products){const files=req.files.filter(f=>f.fieldname===`files-${product.id}`);if(files.length<1||files.length>config.uploads.maxFilesPerProduct)throw new Error(`Add 1–6 product photos for SKU ${product.sku}.`);}
   for(const file of req.files){const buffer=await readFile(file.path);if(imageType(buffer)!==file.mimetype)throw new Error('A file does not contain a supported image. Please use genuine JPG, PNG or WebP photos.');try{await sharp(buffer,{limitInputPixels:40000000}).stats();}catch{throw new Error('An image could not be read. Please export it again as JPG, PNG or WebP.');}}
   await mkdir(dir,{recursive:true,mode:0o700});
   const requestId=`NO-${new Date().toISOString().slice(0,10).replaceAll('-','')}-${randomUUID().slice(0,8).toUpperCase()}`;
   const estimate=calculateEstimate(enquiry.products,enquiry.rushRequested);
   for(const product of enquiry.products){
    const sku=product.sku.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,60)||'product';const productDir=path.join(dir,`${sku}-${product.id.slice(0,8)}`,'Images');await mkdir(productDir,{recursive:true,mode:0o700});await mkdir(path.join(productDir,'..','SEO Description'),{mode:0o700});
    product.files=[];
    for(const file of req.files.filter(f=>f.fieldname===`files-${product.id}`)){
     const ext={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'}[file.mimetype];
     const originalName=path.basename(file.originalname).replace(/[^a-zA-Z0-9._ -]/g,'_').slice(0,140);
     const target=path.join(productDir,randomUUID()+ext);await rename(file.path,target);await chmod(target,0o600);
     product.files.push({originalName,storageKey:path.relative(dir,target),mimeType:file.mimetype,sizeBytes:file.size,productSku:product.sku,uploadedAt:new Date().toISOString()});
    }
   }
   const record={...enquiry,submissionKey:undefined,website:undefined,requestId,createdAt:new Date().toISOString(),status:'new',preview:!live,estimate,notifications:{}};
   await writeRecord(dir,record);saved=true;
   // Preview saves never send messages. Live notifications run after durable persistence.
   if(live) {await notify(record,dir).catch(()=>{});}
   res.status(201).json({requestId,preview:!live,confirmationSent:record.notifications.clientEmail?.status==='sent'});
  } catch(error) {
   await clean();if(dir&&!saved&&lockedKey)await rm(dir,{recursive:true,force:true}).catch(()=>{});
   const clientMessage=/photo|image|file|SKU/.test(error.message)?error.message:'Could not save your brief. Your files remain selected; please retry.';
   res.status(400).json({error:clientMessage});
  } finally {if(lockedKey)locks.delete(lockedKey);await clean();}
 }));
 app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint not found.'}));
 return app;
}
