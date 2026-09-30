import { z } from 'zod';
import { config } from '../content/config.js';
const required = (max = 200) => z.string().trim().min(1, 'This field is required.').max(max);
const optional = (max = 500) => z.string().trim().max(max).optional().default('');
const optionalUrl = optional(2000).refine(v => !v || /^https?:\/\//i.test(v) && URL.canParse(v), 'Enter a full http or https URL.');
export const enquirySchema = z.object({
  submissionKey: z.uuid(), contactName: required(120), email: z.email().max(254), companyName: optional(200),
  projectUrl: optionalUrl, projectNeed: z.enum(config.projectNeeds), productCount: z.enum(config.productRanges),
  platforms: z.array(z.enum(config.platforms)).min(1, 'Select at least one platform.'),
  materialsStatus: z.enum(config.materialStatuses), timeline: z.enum(config.timelines),
  notes: optional(5000), materialsLink: optionalUrl, visualDirection: optional(120),
  consent: z.literal(true, { error: 'Please acknowledge the data notice.' }), website: z.literal(''),
});
export function imageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP') return 'image/webp';
  return null;
}
export function attachmentType(buffer) {
 if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
 return imageType(buffer);
}
