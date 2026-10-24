import {createReadStream,statSync} from 'node:fs';
import {createServer} from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..','out');
const basePath='/Comprehensive_Computing_Website';
const port=Number(process.env.PORT||4173);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};

createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end('Bad Request');return;}
  if(pathname===basePath)pathname='/';
  else if(pathname.startsWith(`${basePath}/`))pathname=pathname.slice(basePath.length);
  else {res.writeHead(404).end('Project Pages base path not found');return;}
  let file=path.resolve(root,`.${pathname}`);
  if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end('Forbidden');return;}
  try{if(statSync(file).isDirectory())file=path.join(file,'index.html');if(!statSync(file).isFile())throw new Error('not file');}
  catch{res.writeHead(404).end('Not Found');return;}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});
  if(req.method==='HEAD'){res.end();return;}
  createReadStream(file).pipe(res);
}).listen(port,'0.0.0.0',()=>console.log(`Static export at http://0.0.0.0:${port}${basePath}/`));
