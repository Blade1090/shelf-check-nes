const CACHE='shelfcheck-nes-matty-v40';
const ASSETS=["./index.html","./manifest.webmanifest","./styles.css?v=5","./owned-green.css?v=1","./sort.css?v=1","./my-shelf.css?v=2","./roulette.css?v=1","./roulette-v2.css?v=1","./wishlist-buy.css?v=1","./pricing.css?v=3","./dossier.css?v=5","./performance.css?v=3","./parity.css?v=1","./ps4-look.css?v=3","./collection-tools-v2.css?v=1","./quickmark-hotfix.css?v=1","./famicom.css?v=5","./regional-skins.css?v=8","./app.js?v=28","./wishlist-buy.js?v=4","./pricing.js?v=5","./dossier-wishlist-bridge.js?v=1","./dossier.js?v=7","./famicom-dossier.js?v=5","./collection-tools-v2.js?v=1","./collection-legacy-shim.js?v=1","./quickmark-hotfix.js?v=1","./wishlist-parity.js?v=1","./backup-restore.js?v=4","./famicom-tools.js?v=3","./regional-hunt-tools.js?v=4","./import-core.mjs?v=4","./nes-census.json","./nes-tracked-non-core.json","./pricecharting-unmapped.json","./pricecharting-alias-map.json","./prices-nes.json","./covers-001-100.json","./covers-101-200.json","./covers-201-300.json","./covers-301-400.json","./covers-401-500.json","./covers-501-600.json","./covers-601-700.json","./covers-701-800.json","./covers-801-815.json","./dossiers-manifest.json","./dossiers-001-100.json","./dossiers-101-200.json","./dossiers-201-300.json","./dossiers-301-400.json","./dossiers-401-500.json","./dossiers-501-600.json","./dossiers-601-700.json","./dossiers-701-800.json","./dossiers-801-816.json","./famicom-census.json","./famicom-artwork.json","./prices-famicom.json","./famicom-cart-colors-manifest.json","./famicom-cart-colors-0001-0130.json","./famicom-cart-colors-0131-0260.json","./famicom-cart-colors-0261-0390.json","./famicom-cart-colors-0391-0520.json","./famicom-cart-colors-0521-0650.json","./famicom-cart-colors-0651-0780.json","./famicom-cart-colors-0781-0910.json","./famicom-cart-colors-0911-1040.json","./famicom-dossiers-manifest.json","./famicom-dossiers-0001-0100.json","./famicom-dossiers-0101-0200.json","./famicom-dossiers-0201-0300.json","./famicom-dossiers-0301-0400.json","./famicom-dossiers-0401-0500.json","./famicom-dossiers-0501-0600.json","./famicom-dossiers-0601-0700.json","./famicom-dossiers-0701-0800.json","./famicom-dossiers-0801-0900.json","./famicom-dossiers-0901-1000.json","./famicom-dossiers-1001-1040.json","./famicom-relationships.json","./famicom-releases.json","./famicom-search-index.json"];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.allSettled(ASSETS.map(asset=>cache.add(asset)));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('shelfcheck-nes-')&&k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(async r=>{
      if(r&&r.ok){const c=await caches.open(CACHE);c.put('./index.html',r.clone())}
      return r;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(async r=>{
    if(r&&r.ok){const c=await caches.open(CACHE);c.put(event.request,r.clone())}
    return r;
  }).catch(()=>caches.match(event.request)));
});