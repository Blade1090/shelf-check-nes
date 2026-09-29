const CACHE='shelfcheck-nes-matty-v8';
const ASSETS=['./styles.css?v=4','./owned-green.css?v=1','./sort.css?v=1','./app.js?v=6','./import-core.mjs','./manifest.webmanifest','./nes-census.json','./nes-tracked-non-core.json','./pricecharting-unmapped.json','./pricecharting-alias-map.json','./covers-001-100.json','./covers-101-200.json','./covers-201-300.json','./covers-301-400.json','./covers-401-500.json','./covers-501-600.json','./covers-601-700.json','./covers-701-800.json','./covers-801-815.json'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>e.waitUntil(Promise.all([self.clients.claim(),caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('shelfcheck-nes-')&&k!==CACHE).map(k=>caches.delete(k))))])));
self.addEventListener('fetch',e=>{
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));
    return;
  }
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});