import { importGameEye } from './import-core.mjs';
const LIBRETRO_BASE='https://raw.githubusercontent.com/libretro-thumbnails/Nintendo_-_Nintendo_Entertainment_System/4d21463bf5d553afc34d99183c9ad5833f773b93/Named_Boxarts/';
const LAUNCHBOX_BASE='https://images.launchbox-app.com/';
const CORE_FETCHES=[
  fetch('./nes-census.json').then(r=>r.json()),
  fetch('./nes-tracked-non-core.json').then(r=>r.json()),
  fetch('./pricecharting-unmapped.json').then(r=>r.json()),
  fetch('./pricecharting-alias-map.json').then(r=>r.json()),
  fetch('./covers-001-100.json').then(r=>r.json()).catch(()=>({})),
  ...['101-200','201-300','301-400','401-500','501-600','601-700','701-800','801-815'].map(n=>fetch(`./covers-${n}.json`).then(r=>r.json()).catch(()=>[]))
];
const loaded=await Promise.all(CORE_FETCHES);
const [census,tracked,pcu,pcAlias,first100,...coverChunks]=loaded;
const covers={...first100};
for(const rows of coverChunks){
  for(const [id,src,val,label] of rows){
    const u=src===0?LIBRETRO_BASE+val:src===1?LAUNCHBOX_BASE+val:val;
    covers[id]={u,l:label||null};
  }
}
const DATA={census,tracked,pcu,pcAlias,covers};

const STORAGE='shelfcheck-nes-matty-v1';
const el=id=>document.getElementById(id);
const allIds=Object.values(DATA.census.identities).flat();
let state={owned:new Set(), imported:false, summary:null, filter:'ALL', q:''};
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved){state.owned=new Set(saved.owned||[]);state.imported=!!saved.imported;state.summary=saved.summary||null;}}catch{}
function save(){localStorage.setItem(STORAGE,JSON.stringify({owned:[...state.owned],imported:state.imported,summary:state.summary}));}
function coverInfo(id){
  const row=DATA.covers[id];
  if(!row)return null;
  if(Array.isArray(row))return {u:row[0].startsWith('http')?row[0]:LIBRETRO_BASE+row[0],l:row[1]||null};
  return row;
}
function render(){
  const owned=state.owned.size,total=allIds.length,pct=(owned/total*100).toFixed(1);
  el('ownedCount').textContent=owned; el('totalCount').textContent=total; el('pct').textContent=pct+'%'; el('barFill').style.width=pct+'%';
  if(el('headerProgress')) el('headerProgress').textContent=`${owned} / ${total}`;
  el('importStatus').textContent=state.imported?`${state.summary?.nes_famicom_game_rows||0} NES/Famicom rows imported • ${state.summary?.matched_non_core_rows||0} tracked outside CORE • ${state.summary?.unmatched_or_reconcile_rows||0} reconcile`:'No GameEye file imported yet';
  if(state.summary&&el('details')) el('details').textContent=JSON.stringify(state.summary,null,2);
  let list=allIds.filter(x=>{const o=state.owned.has(x.identity_id);if(state.filter==='OWNED'&&!o)return false;if(state.filter==='NEEDED'&&o)return false;const q=state.q.trim().toLowerCase();return !q||x.canonical_title.toLowerCase().includes(q)||(x.aliases||[]).some(a=>a.toLowerCase().includes(q));});
  el('gameList').innerHTML=list.slice(0,500).map(x=>{
    const o=state.owned.has(x.identity_id);
    const name=x.canonical_title+(x.display_disambiguator?` ${x.display_disambiguator}`:'');
    const cover=coverInfo(x.identity_id);
    const art=cover?.u?`<button class="cover-button" type="button" data-cover="${escapeHTML(cover.u)}" data-title="${escapeHTML(name)}" aria-label="Enlarge ${escapeHTML(name)} cover"><img class="cover" src="${escapeHTML(cover.u)}" alt="${escapeHTML(name)} NES box art" loading="lazy" decoding="async"></button>`:`<div class="cover cover-missing" aria-hidden="true"><span>NES</span></div>`;
    const label=cover?.l?`<em class="product-note">${escapeHTML(cover.l)}</em>`:'';
    return `<article class="game ${o?'owned':''}">${art}<div class="game-copy"><strong>${escapeHTML(name)}</strong><small>${x.license_class==='UNLICENSED'?'UNLICENSED • ':''}${x.availability.replaceAll('_',' ')}</small>${label}</div><span class="status">${o?'OWNED':'NEEDED'}</span></article>`;
  }).join('')+(list.length>500?`<p class="limit">Showing first 500 of ${list.length} matches.</p>`:'');
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
el('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const result=importGameEye(await f.text(),DATA);state.owned=new Set(result.owned_core_identities.map(x=>x.identity_id));state.imported=true;state.summary=result.summary;save();render();});
el('search').addEventListener('input',e=>{state.q=e.target.value;render();});
for(const b of document.querySelectorAll('[data-filter]')) b.addEventListener('click',()=>{state.filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render();});
el('reset').addEventListener('click',()=>{if(confirm('Clear the local NES ownership import on this device?')){localStorage.removeItem(STORAGE);state={owned:new Set(),imported:false,summary:null,filter:'ALL',q:''};el('search').value='';document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter==='ALL'));if(el('details'))el('details').textContent='Import Matty\'s GameEye file to test ownership matching.';render();}});
document.addEventListener('click',e=>{const b=e.target.closest('.cover-button');if(!b)return;const d=el('coverDialog');el('coverDialogImg').src=b.dataset.cover;el('coverDialogImg').alt=`${b.dataset.title} NES box art`;el('coverDialogTitle').textContent=b.dataset.title;d.showModal();});
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
