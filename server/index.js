import 'dotenv/config';
import express from 'express';
import {createServer as createHttpServer} from 'node:http';
import path from 'node:path';
import { createApp } from './app.js';
const app=await createApp();
const httpServer=createHttpServer(app);
const root=process.cwd();
if(process.env.NODE_ENV==='production'){
 app.use(express.static(path.join(root,'dist'),{index:'index.html'}));
 app.use((req,res)=>res.status(404).send('Page not found.'));
}else{
 const {createServer}=await import('vite');
 const vite=await createServer({server:{middlewareMode:true,hmr:{server:httpServer},fs:{deny:['**/.env*','**/.data/**','**/server/**','**/tests/**','**/docs/**','**/scripts/**','**/*.pem']}},appType:'spa'});
 app.use(vite.middlewares);
}
const port=Number(process.env.PORT||5173);
httpServer.listen(port,process.env.HOST||'127.0.0.1',()=>console.log(`NONOBJECT is running at http://localhost:${port}`));
