// SolveEverything Service Worker — offline-first, but always prefers fresh same-origin files.
// Strategy:
//   • same-origin app files  → network-first (new deploys show up on the next load), cache as offline fallback
//   • cross-origin CDN assets (KaTeX) → cache-first (versioned URLs, safe to cache)
// Bump CACHE whenever the precached list changes so old caches are purged on activate.
const CACHE='solveeverything-v4';
const ASSETS=['./','./index.html','./styles.css','./app.js','./registry.js','./phase1-formulas.js','./phase2-formulas.js','./engine.js','./plot.js','./api.js','./runtime-config.js','./manifest.webmanifest','./icon.svg','./catalog.json'];

self.addEventListener('install',e=>{
  // Cache each asset separately: one missing file must not stop the whole worker from installing.
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(url=>c.add(url).catch(()=>{})))).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin){
    e.respondWith(
      fetch(req).then(res=>{
        if(res.ok){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
        return res;
      }).catch(()=>caches.match(req).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit=>hit||fetch(req).then(res=>{
      if(res.ok||res.type==='opaque'){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
      return res;
    }))
  );
});

