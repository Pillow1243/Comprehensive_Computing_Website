import {cp, mkdir, rm, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.join(root,'apps','web');
const target=path.join(root,'public','app');
const catalog=path.join(root,'packages','formula-registry','catalog.json');
const apiUrl=(process.env.NEXT_PUBLIC_API_URL||'').trim().replace(/\/$/,'');

await mkdir(path.dirname(target),{recursive:true});
await rm(target,{recursive:true,force:true});
await cp(source,target,{recursive:true});
await cp(catalog,path.join(target,'catalog.json'));
await writeFile(path.join(target,'runtime-config.js'),
  `// Generated at build time. This value is public; never put secrets here.\n`+
  `globalThis.SOLVE_EVERYTHING_API_URL = ${JSON.stringify(apiUrl)};\n`,
  'utf8');
console.log(`Prepared static PWA at public/app (API ${apiUrl?'configured':'disabled'}).`);
