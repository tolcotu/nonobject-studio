import { z } from 'zod';
import { config } from '../content/config.js';
const required = (max = 200) => z.string().trim().min(1, 'This field is required.').max(max);
const optional = (max = 500) => z.string().trim().max(max).optional().default('');
const productSchema = z.object({
  id: z.string().regex(/^[a-zA-Z0-9-]{1,50}$/), productName: required(), sku: required(80), ean: optional(30),
  listingUrl: optional(2000).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), 'Enter a full http or https URL.'),
  platforms: z.array(z.enum(config.platforms)).min(1, 'Select at least one platform.'),
  productInformation: required(10000), imageCount: z.number().int().min(3).max(100),
  imageFormatsAndSizes: required(500), additionalNotes: optional(5000),
});
export const enquirySchema = z.object({
  submissionKey: z.uuid(), contactName: required(120), companyName: optional(200), email: z.email().max(254), country: required(100),
  vatNumber: optional(80), phoneOrMessenger: optional(160), rushRequested: z.boolean(), generalNotes: optional(10000),
  visualDirection: optional(120), consent: z.literal(true, { error: 'Please acknowledge the data notice.' }), website: z.literal(''),
  products: z.array(productSchema).min(1).max(config.maxProducts),
}).superRefine((v, ctx) => {
  if (new Set(v.products.map(p => p.id)).size !== v.products.length) ctx.addIssue({code:'custom', path:['products'], message:'Product IDs must be unique.'});
  if (new Set(v.products.map(p => p.sku.toLowerCase())).size !== v.products.length) ctx.addIssue({code:'custom', path:['products'], message:'Each product needs a unique SKU.'});
});
export function imageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp';
  return null;
}
