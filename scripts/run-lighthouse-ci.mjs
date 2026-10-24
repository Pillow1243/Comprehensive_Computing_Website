import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import lighthouse from 'lighthouse';
import {launch} from 'chrome-launcher';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(await readFile(path.join(root,'.lighthouserc.json'),'utf8'));
const collect=config.ci.collect;
const url=collect.url?.[0];
if(!url)throw new Error('Lighthouse config must include at least one collect.url.');
const outDir=path.resolve(root,config.ci.upload?.outputDir||'artifacts/lighthouse');
await mkdir(outDir,{recursive:true});

const server=spawn(process.execPath,['scripts/serve-static.mjs'],{cwd:root,stdio:['ignore','pipe','pipe']});
let serverLog='';
const waitForServer=new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>reject(new Error(`Static preview server did not start. ${serverLog}`)),30_000);
  server.stdout.on('data',chunk=>{serverLog+=chunk.toString();if(serverLog.includes('Static export at')){clearTimeout(timer);resolve();}});
  server.stderr.on('data',chunk=>{serverLog+=chunk.toString();});
  server.once('error',error=>{clearTimeout(timer);reject(error);});
  server.once('exit',code=>{if(code!==null&&code!==0){clearTimeout(timer);reject(new Error(`Static preview server exited (${code}). ${serverLog}`));}});
});

let chrome;
try{
  await waitForServer;
  const flags=(collect.settings?.chromeFlags||'--no-sandbox --headless=new').split(/\s+/).filter(Boolean);
  const formFactor=collect.settings?.emulatedFormFactor||'mobile';
  const runs=Math.max(1,Number(collect.numberOfRuns)||1);
  for(let i=1;i<=runs;i++){
    chrome=await launch({chromePath:process.env.CHROME_PATH,chromeFlags:flags});
    const result=await lighthouse(url,{port:chrome.port,output:['html','json'],logLevel:'error'}, {
      extends:'lighthouse:default',
      settings:{emulatedFormFactor:formFactor,onlyCategories:['performance','accessibility','best-practices','seo'],throttlingMethod:'simulate'},
    });
    const timestamp=new Date().toISOString().replace(/[:.]/g,'-');
    const html=Array.isArray(result.report)?result.report[0]:result.report;
    const json=Array.isArray(result.report)?result.report[1]:JSON.stringify(result.lhr,null,2);
    await writeFile(path.join(outDir,`run-${i}-${timestamp}.html`),html);
    await writeFile(path.join(outDir,`run-${i}-${timestamp}.json`),json);
    const scores=Object.fromEntries(Object.entries(result.lhr.categories).map(([key,value])=>[key,value.score]));
    console.log(`Lighthouse run ${i}/${runs}:`,Object.fromEntries(Object.entries(scores).map(([key,value])=>[key,`${Math.round(value*100)}%`])));
    const assertions=config.ci.assert?.assertions||{};
    for(const [key,rule] of Object.entries(assertions)){
      if(!key.startsWith('categories:')||!Array.isArray(rule))continue;
      const category=key.slice('categories:'.length),minimum=rule[1]?.minScore;
      if(typeof minimum==='number'&&typeof scores[category]==='number'&&scores[category]<minimum){
        const message=`${category} score ${scores[category].toFixed(2)} is below configured warn threshold ${minimum.toFixed(2)}.`;
        if(rule[0]==='error')throw new Error(message);
        console.warn(`WARNING: ${message}`);
      }
    }
    await chrome.kill();chrome=undefined;
  }
  console.log(`Lighthouse reports saved in ${path.relative(root,outDir)}/`);
}finally{
  if(chrome)await chrome.kill().catch(()=>{});
  server.kill('SIGTERM');
}
