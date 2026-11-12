/* 数える処理はここ1か所だけ（2026-11-10 公開判断の4）。
   送り先が決まったら ENDPOINT に URL を入れる。空のあいだは何も送らない。
   送るもの：イベント名・型番号・押した答え・押したボタン・どこから来たか（?from=）・時刻だけ。
   生年月日・生まれた時刻・名前・メールは絶対に送らない（data に入れない）。国は送り先の側で取る前提。
   Google フォームにする場合：ENDPOINT に「…/formResponse」を入れ、FORM_FIELDS に entry.番号 を入れる（下の送り方が自動でフォーム形式になる）。 */
const ENDPOINT = "https://docs.google.com/forms/d/e/1FAIpQLSfgEqFp3Pi4nzY_nm7SRyfqSJ1ENZ1w09RZ4dSTKu3DWm8TVQ/formResponse"; /* 2026-11-10 Google フォーム「BaZi Type events」→ 副業台帳「占いの声」 */
const FORM_FIELDS = {e:"entry.2028279721", data:"entry.1949004381", from:"entry.619926156", at:"entry.1932733859"}; /* 例 {e:"entry.111", data:"entry.222", from:"entry.333", at:"entry.444"} */

/* 2026-11-13 入ってきた道（?from=pin / pin-07 / etsy / card / remind …）。どのページで受けても、同じタブの間は覚えておく
   （about などから戻っても道が消えないように）。URL に新しい from があればそちらを使う。 */
const FROM = (function(){
  let f = "";
  try{ const q = new URLSearchParams(location.search); f = (q.get("from")||q.get("utm_source")||"").slice(0,20); }catch(_){}
  try{ if(f && f!=="me") sessionStorage.setItem("bzt_from", f); else if(!f) f = sessionStorage.getItem("bzt_from")||""; }catch(_){}
  return f;
})();
const SENT_ONCE = {};
/* 2026-11-10 戦略役「測れるようにする」：端末の時間帯と言語を一緒に送る（個人の情報ではない。国の代わりにSGかを見る）。
   ?from=me で開いた端末は、それ以降ずっと何も送らない（中村さん・チームの閲覧を数に入れない）。 */
const ENV = (function(){ try{ return {tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||"").slice(0,40), lang:(navigator.language||"").slice(0,12)}; }catch(_){ return {}; } })();
const IS_ME = (function(){ try{ if(FROM==="me") localStorage.setItem("bzt_me","1"); return localStorage.getItem("bzt_me")==="1"; }catch(_){ return FROM==="me"; } })();
/* 2026-11-13 チームの試しに印を付ける：?test=1 で開いた端末は、以後ずっと data に "test":1 を付けて送る（?test=0 で外す）。
   ?from=me（何も送らない）と違い、記録には残る＝送れているかを確かめられる。台帳「占いの声」の「印」の列に「テスト」と出る。
   機械で開いた閲覧（navigator.webdriver が真）は "bot":1 を付ける（数から外せるように。消しはしない）。 */
const IS_TEST = (function(){ let t = false;
  try{ const v = new URLSearchParams(location.search).get("test");
    if(v==="1") localStorage.setItem("bzt_test","1"); else if(v==="0") localStorage.removeItem("bzt_test");
    t = localStorage.getItem("bzt_test")==="1"; }catch(_){ try{ t = new URLSearchParams(location.search).get("test")==="1"; }catch(__){} }
  return t; })();
const IS_BOT = (function(){ try{ return navigator.webdriver===true; }catch(_){ return false; } })();

function sendEvent(name, data){
  if(!ENDPOINT || IS_ME) return;
  try{
    const d = Object.assign({}, data || {});
    if(d.once){ const k = name+":"+JSON.stringify(d); if(SENT_ONCE[k]) return; SENT_ONCE[k]=1; delete d.once; }
    if(IS_TEST) d.test = 1;
    if(IS_BOT) d.bot = 1;
    const row = {e:name, data:JSON.stringify(Object.assign(d, ENV)), from:FROM, at:new Date().toISOString()};
    let body;
    if(FORM_FIELDS){ body = new URLSearchParams(); for(const k in FORM_FIELDS) body.append(FORM_FIELDS[k], row[k]); }
    else body = JSON.stringify(row);
    if(navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
    fetch(ENDPOINT, {method:"POST", body, mode:"no-cors", keepalive:true}).catch(function(){});
  }catch(_){}
}

/* 2026-11-13 Etsy の店・出品へのリンク（etsy.com・etsy.me）を押したら "etsy" を送る。リンクを足すだけで数に入る。
   data-type に型番号、data-where に置き場（例 result・notebook）を書いておけば一緒に送る。 */
document.addEventListener("click", function(ev){
  try{
    const a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if(!a || !/(^|\.)etsy\.(com|me)$/i.test(new URL(a.href, location.href).hostname)) return;
    sendEvent("etsy", {type: parseInt(a.dataset.type,10)||0, where: (a.dataset.where||"").slice(0,20), page: location.pathname.slice(0,30)});
  }catch(_){}
}, true);
