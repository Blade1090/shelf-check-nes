const CACHE='shelfcheck-nes-matty-v4';
const ASSETS=['./styles.css?v=3','./app.js?v=3','./import-core.mjs','./manifest.webmanifest','./nes-census.json','./nes-tracked-non-core.json','./pricecharting-unmapped.json','./pricecharting-alias-map.json','./covers-001-010.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shelfcheck-nes-')&&k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});