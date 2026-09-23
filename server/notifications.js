import nodemailer from 'nodemailer';
import { writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
export async function writeRecord(directory, record) {
 const temp=path.join(directory,`enquiry-${crypto.randomUUID()}.tmp`);
 await writeFile(temp,JSON.stringify(record,null,2),{mode:0o600});
 await rename(temp,path.join(directory,'enquiry.json'));
}
export async function notify(record,directory) {
 if(record.preview)return;
 const env=process.env;
 const products=record.products.map(p=>`${p.productName} / ${p.sku}: ${p.imageCount} images, ${p.platforms.join(', ')}`).join('\n');
 const summary=`Request ID: ${record.requestId}\n${products}\nRush requested: ${record.rushRequested?'Yes':'No'}\nAll scope and pricing subject to personal confirmation.`;
 const smtpReady=env.SMTP_HOST&&env.MAIL_FROM&&env.OWNER_EMAIL;
 const transport=smtpReady?nodemailer.createTransport({host:env.SMTP_HOST,port:Number(env.SMTP_PORT||587),secure:env.SMTP_SECURE==='true',auth:env.SMTP_USER?{user:env.SMTP_USER,pass:env.SMTP_PASS}:undefined,connectionTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true}):null;
 async function attempt(channel, configured, send) {
  const existing=record.notifications[channel];
  if(existing?.status==='sent')return;
  if(!configured){record.notifications[channel]={status:'unconfigured',action:`Configure ${channel==='telegram'?'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID':'SMTP_HOST, MAIL_FROM and OWNER_EMAIL'}.`};await writeRecord(directory,record);return;}
  try {await send();record.notifications[channel]={status:'sent',sentAt:new Date().toISOString()};}
  catch {record.notifications[channel]={status:'failed',attemptedAt:new Date().toISOString(),action:'Check provider credentials and delivery logs, then run npm run retry-notifications.'};}
  await writeRecord(directory,record);
 }
 await attempt('ownerEmail',smtpReady,()=>transport.sendMail({from:env.MAIL_FROM,to:env.OWNER_EMAIL,replyTo:record.email,subject:`NONOBJECT enquiry ${record.requestId}`,text:`${record.contactName}\n${record.email}\n\n${summary}`,messageId:`<${record.requestId}-owner@nonobject.local>`}));
 await attempt('clientEmail',smtpReady,()=>transport.sendMail({from:env.MAIL_FROM,to:record.email,subject:`We received your project request — #${record.requestId}`,text:`Hi ${record.contactName},\n\nThank you for sending your project request to NONOBJECT.\n\nWe have received your materials. Our designer will review your product information and files, then contact you personally to confirm the final scope, availability and price.\n\n${summary}\n\nBest regards,\nNONOBJECT\n${env.OWNER_EMAIL}`,messageId:`<${record.requestId}-client@nonobject.local>`}));
 await attempt('telegram',env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_CHAT_ID,async()=>{
  const response=await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:env.TELEGRAM_CHAT_ID,text:`New NONOBJECT enquiry ${record.requestId}. ${record.products.length} product(s). Review private enquiry storage for details.`}),signal:AbortSignal.timeout(10000)});
  const data=await response.json();if(!response.ok||!data.ok)throw new Error('Notification failed');
 });
 transport?.close();
}
