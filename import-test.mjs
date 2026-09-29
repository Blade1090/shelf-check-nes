import fs from 'node:fs';import {importGameEye} from '../import-core.mjs';
const ROOT=new URL('../',import.meta.url);
const j=p=>JSON.parse(fs.readFileSync(new URL(p,ROOT),'utf8'));
const data={census:j('data/nes-census.json'),tracked:j('data/nes-tracked-non-core.json'),pcu:j('data/pricecharting-unmapped.json'),pcAlias:j('data/pricecharting-alias-map.json')};
const csv=fs.readFileSync(process.argv[2],'utf8');const r=importGameEye(csv,data);console.log(JSON.stringify(r.summary,null,2));
const exp={nes_famicom_game_rows:363,matched_core_rows:298,matched_non_core_rows:65,unmatched_or_reconcile_rows:0,identities_with_duplicate_copies:23,distinct_core_identities_owned:276,census_core_total:816};
for(const [k,v] of Object.entries(exp))if(r.summary[k]!==v)throw new Error(`${k}: expected ${v}, got ${r.summary[k]}`);
if(r.summary.provisional_core_completion_pct!==33.82)throw new Error('completion mismatch');
console.log('PASS: Matty GameEye baseline matches reference importer exactly.');
