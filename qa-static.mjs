import fs from 'node:fs';

const read=p=>fs.readFileSync(new URL(`./${p}`,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};

const census=json('nes-census.json');
const identities=Object.values(census.identities).flat();
const ids=identities.map(x=>x.identity_id);
const idSet=new Set(ids);
assert(ids.length===816,`census count ${ids.length} != 816`);
assert(idSet.size===816,`census unique IDs ${idSet.size} != 816`);

const dossierFiles=['001-100','101-200','201-300','301-400','401-500','501-600','601-700','701-800','801-816'];
const dossiers=dossierFiles.flatMap(n=>json(`dossiers-${n}.json`).entries||[]);
const dossierIds=new Set(dossiers.map(x=>x.identity_id));
assert(dossiers.length===816,`dossier count ${dossiers.length} != 816`);
assert(dossierIds.size===816,`dossier unique IDs ${dossierIds.size} != 816`);
assert(ids.every(id=>dossierIds.has(id)),'dossier set does not exactly cover census IDs');
const manifest=json('dossiers-manifest.json');
assert(manifest.validation?.passed===true,'dossier manifest validation is not passing');
assert(manifest.identity_count===816,'dossier manifest identity_count != 816');
assert((manifest.hltb_status?.VERIFIED||0)+(manifest.hltb_status?.ESTIMATED||0)+(manifest.hltb_status?.NO_DATA||0)===816,'HLTB status totals do not equal 816');

const coverIds=new Set();
const first=json('covers-001-100.json');
for(const id of Object.keys(first)){assert(idSet.has(id),`cover ID not in census: ${id}`);assert(!coverIds.has(id),`duplicate cover ID: ${id}`);coverIds.add(id)}
for(const n of ['101-200','201-300','301-400','401-500','501-600','601-700','701-800','801-815']){
  for(const row of json(`covers-${n}.json`)){
    const id=row[0];assert(idSet.has(id),`cover ID not in census: ${id}`);assert(!coverIds.has(id),`duplicate cover ID: ${id}`);coverIds.add(id);
  }
}
assert(coverIds.size===815,`cover count ${coverIds.size} != 815`);
const missing=ids.filter(id=>!coverIds.has(id));
assert(missing.length===1&&missing[0]==='nes-na-metal-mech-man-and-machine',`unexpected cover gap: ${missing.join(', ')}`);
assert(coverIds.has('nes-na-dizzy-adventurer'),'Dizzy audited cover is missing');

const prices=json('prices-nes.json');
assert(prices.snapshot==='2026-09-25','unexpected price snapshot');
assert(prices.basis==='loose','price basis must remain loose');
assert(Array.isArray(prices.rows)&&prices.rows.length>0,'price rows missing');

const app=read('app.js');
assert(!app.includes('slice(0,500)'),'500-card render cap returned');
assert(!app.includes('Showing first 500'),'500-card limit message returned');
assert(app.includes("shelfcheck-nes-matty-v1"),'NES ownership storage key changed unexpectedly');
assert(app.includes("list.map(x=>cardHTML(x)).join('')"),'full-list render path missing');

const index=read('index.html');
for(const id of ['rouletteBtn','myShelfBtn','buyBtn','wishlistBtn','dossierDialog','randomWishlistBtn','backupBtn','restoreBtn'])assert(index.includes(`id=\"${id}\"`),`missing UI control ${id}`);
assert(index.includes('app.js?v=11'),'index is not loading app.js v11');
assert(index.includes('dossier.js?v=4'),'index is not loading dossier.js v4');
assert(index.includes('wishlist-parity.js?v=1'),'wishlist parity script missing');
assert(index.includes('backup-restore.js?v=1'),'backup/restore script missing');
assert(index.includes('performance.css?v=1'),'performance stylesheet missing');
assert(index.includes('parity.css?v=1'),'parity stylesheet missing');
assert(index.includes('ps4-look.css?v=2'),'utility-button stylesheet missing');
assert(index.includes('PHYSICAL NES COLLECTION COMPANION'),'NES hero identity missing');
assert(index.includes('Check the cart before you buy the cart.'),'NES hero subtitle missing');
assert(index.includes('name="theme-color" content="#0d1016"'),'NES dark/red theme color changed unexpectedly');

const look=read('ps4-look.css');
for(const token of ['.roulette-btn','.my-shelf-btn','.buy-btn','.wishlist-btn'])assert(look.includes(token),`PS4-style utility control missing ${token}`);
assert(!look.includes('body{background'),'utility controls must not recolor the NES page');
assert(!look.includes('.eyebrow{color'),'utility controls must not recolor NES accents');
assert(!look.includes('.collection-summary{display:none'),'NES progress summary must stay visible');

const dossier=read('dossier.js');
assert(dossier.includes('window.openNESDossier=dRender'),'dossier opener is not exposed to parity tools');
const wishlistParity=read('wishlist-parity.js');
assert(wishlistParity.includes('RANDOM WISHLIST GAME'),'random wishlist control missing');
assert(wishlistParity.includes("shelfcheck-nes-matty-wishlist-v1"),'wishlist storage key changed unexpectedly');
const backup=read('backup-restore.js');
assert(backup.includes("shelfcheck-nes-matty-v1")&&backup.includes("shelfcheck-nes-matty-wishlist-v1"),'backup does not cover both NES storage keys');
assert(backup.includes("app:'ShelfCheck NES'"),'backup identity guard missing');

const sw=read('sw.js');
assert(sw.includes("shelfcheck-nes-matty-v24"),'unexpected service-worker cache version');
for(const f of ['performance.css?v=1','parity.css?v=1','ps4-look.css?v=2','app.js?v=11','dossier.js?v=4','wishlist-parity.js?v=1','backup-restore.js?v=1','dossiers-001-100.json','dossiers-801-816.json','covers-001-100.json'])assert(sw.includes(f),`service worker missing ${f}`);

console.log('PASS: Shelf Check NES static regression suite');
console.log(JSON.stringify({census:816,dossiers:816,covers:815,cover_gap:missing[0],hltb:manifest.hltb_status,price_snapshot:prices.snapshot,parity:['backup_restore','random_wishlist','ps4_style_controls'],theme:'nes_red'},null,2));
