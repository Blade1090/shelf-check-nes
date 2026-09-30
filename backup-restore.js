(()=>{
const OWNED='shelfcheck-nes-matty-v1';
const WISHLIST='shelfcheck-nes-matty-wishlist-v1';
const backupBtn=document.getElementById('backupBtn');
const restoreBtn=document.getElementById('restoreBtn');
const restoreFile=document.getElementById('restoreFile');
function backup(){
  const payload={app:'ShelfCheck NES',schema:1,created_at:new Date().toISOString(),storage:{[OWNED]:localStorage.getItem(OWNED),[WISHLIST]:localStorage.getItem(WISHLIST)}};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`shelfcheck-nes-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
}
async function restore(file){
  let data;try{data=JSON.parse(await file.text())}catch{alert('That backup file is not valid JSON.');return}
  if(data?.app!=='ShelfCheck NES'||data?.schema!==1||!data.storage||typeof data.storage!=='object'){alert('That is not a compatible Shelf Check NES backup.');return}
  if(!confirm('Restore this Shelf Check NES backup on this device? Current local ownership and wishlist data will be replaced.'))return;
  for(const key of [OWNED,WISHLIST]){const value=data.storage[key];if(value==null)localStorage.removeItem(key);else if(typeof value==='string')localStorage.setItem(key,value);else{alert('Backup data is malformed. Nothing was restored.');return}}
  location.reload();
}
backupBtn?.addEventListener('click',backup);
restoreBtn?.addEventListener('click',()=>restoreFile?.click());
restoreFile?.addEventListener('change',e=>{const f=e.target.files?.[0];if(f)restore(f);e.target.value='';});
})();
