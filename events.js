/* 数える処理はここ1か所だけ（2026-11-10 公開判断の4）。
   送り先が決まったら ENDPOINT に URL を入れる。空のあいだは何も送らない。
   送るもの：イベント名・型番号・押した答え・押したボタン・どこから来たか（?from=）・時刻だけ。
   生年月日・生まれた時刻・名前・メールは絶対に送らない（data に入れない）。国は送り先の側で取る前提。
   Google フォームにする場合：ENDPOINT に「…/formResponse」を入れ、FORM_FIELDS に entry.番号 を入れる（下の送り方が自動でフォーム形式になる）。 */
const ENDPOINT = "https://docs.google.com/forms/d/e/1FAIpQLSfgEqFp3Pi4nzY_nm7SRyfqSJ1ENZ1w09RZ4dSTKu3DWm8TVQ/formResponse"; /* 2026-11-10 Google フォーム「BaZi Type events」→ 副業台帳「占いの声」 */
const FORM_FIELDS = {e:"entry.2028279721", data:"entry.1949004381", from:"entry.619926156", at:"entry.1932733859"}; /* 例 {e:"entry.111", data:"entry.222", from:"entry.333", at:"entry.444"} */

const FROM = (function(){ try{ return (new URLSearchParams(location.search).get("from")||"").slice(0,20); }catch(_){ return ""; } })();
const SENT_ONCE = {};

function sendEvent(name, data){
  if(!ENDPOINT) return;
  try{
    const d = data || {};
    if(d.once){ const k = name+":"+JSON.stringify(d); if(SENT_ONCE[k]) return; SENT_ONCE[k]=1; delete d.once; }
    const row = {e:name, data:JSON.stringify(d), from:FROM, at:new Date().toISOString()};
    let body;
    if(FORM_FIELDS){ body = new URLSearchParams(); for(const k in FORM_FIELDS) body.append(FORM_FIELDS[k], row[k]); }
    else body = JSON.stringify(row);
    if(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
    fetch(ENDPOINT, {method:"POST", body, mode:"no-cors", keepalive:true}).catch(function(){});
  }catch(_){}
}
