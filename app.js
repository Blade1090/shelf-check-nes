import { importGameEye } from './import-core.mjs';
const DATA = await Promise.all([
  fetch('./data/nes-census.json').then(r=>r.json()),
  fetch('./data/nes-tracked-non-core.json').then(r=>r.json()),
  fetch('./data/pricecharting-unmapped.json').then(r=>r.json()),
  fetch('./data/pricecharting-alias-map.json').then(r=>r.json())
]).then(([census,tracked,pcu,pcAlias])=>({census,tracked,pcu,pcAlias}));

const STORAGE='shelfcheck-nes-matty-v1';
const el=id=>document.getElementById(id);
const allIds=Object.values(DATA.census.identities).flat();
let state={owned:new Set(), imported:false, summary:null, filter:'ALL', q:''};
try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'null');if(saved){state.owned=new Set(saved.owned||[]);state.imported=!!saved.imported;state.summary=saved.summary||null;}}catch{}
function save(){localStorage.setItem(STORAGE,JSON.stringify({owned:[...state.owned],imported:state.imported,summary:state.summary}));}
function render(){
  const owned=state.owned.size,total=allIds.length,pct=(owned/total*100).toFixed(1);
  el('ownedCount').textContent=owned; el('totalCount').textContent=total; el('pct').textContent=pct+'%'; el('barFill').style.width=pct+'%';
  el('importStatus').textContent=state.imported?`${state.summary?.nes_famicom_game_rows||0} NES/Famicom rows imported • ${state.summary?.matched_non_core_rows||0} tracked outside CORE • ${state.summary?.unmatched_or_reconcile_rows||0} reconcile`:'No GameEye file imported yet';
  let list=allIds.filter(x=>{const o=state.owned.has(x.identity_id);if(state.filter==='OWNED'&&!o)return false;if(state.filter==='NEEDED'&&o)return false;const q=state.q.trim().toLowerCase();return !q||x.canonical_title.toLowerCase().includes(q)||(x.aliases||[]).some(a=>a.toLowerCase().includes(q));});
  el('gameList').innerHTML=list.slice(0,500).map(x=>{const o=state.owned.has(x.identity_id);const name=x.canonical_title+(x.display_disambiguator?` ${x.display_disambiguator}`:'');return `<article class="game ${o?'owned':''}"><div><strong>${escapeHTML(name)}</strong><small>${x.license_class==='UNLICENSED'?'UNLICENSED • ':''}${x.availability.replaceAll('_',' ')}</small></div><span>${o?'OWNED':'NEEDED'}</span></article>`}).join('')+(list.length>500?`<p class="limit">Showing first 500 of ${list.length} matches.</p>`:'');
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
el('file').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const result=importGameEye(await f.text(),DATA);state.owned=new Set(result.owned_core_identities.map(x=>x.identity_id));state.imported=true;state.summary=result.summary;save();render();el('details').textContent=JSON.stringify(result.summary,null,2);});
el('search').addEventListener('input',e=>{state.q=e.target.value;render();});
for(const b of document.querySelectorAll('[data-filter]')) b.addEventListener('click',()=>{state.filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===b));render();});
el('reset').addEventListener('click',()=>{if(confirm('Clear the local NES ownership import on this device?')){localStorage.removeItem(STORAGE);state={owned:new Set(),imported:false,summary:null,filter:'ALL',q:''};render();}});
render();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
