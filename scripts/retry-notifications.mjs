import 'dotenv/config';
import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {notify} from '../server/notifications.js';
const root=path.resolve(process.env.DATA_DIR||'.data','enquiries');
for(const dir of await readdir(root).catch(()=>[])) {
 const directory=path.join(root,dir);const record=JSON.parse(await readFile(path.join(directory,'enquiry.json'),'utf8'));
 if(!record.preview){await notify(record,directory);console.log(record.requestId,Object.fromEntries(Object.entries(record.notifications).map(([k,v])=>[k,v.status])));}
}
