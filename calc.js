// BaZi Type の計算（四柱 → くり返す癖の型）
// 数え方の正：research_notes/占いシンガポール/中身_癖の型/数え方.md と kuse.py（同じ結果になることを Node で確かめる：同じフォルダの kuse_js_check.py）
// 手帳の見本の月の表：同じフォルダの 手帳の組み立て.md と kuse.py の techo()

// 手帳の売り場（Gumroad ができたら差し替える・仮）
const NOTEBOOK_URL = "https://REPLACE.gumroad.com/l/bazitype-2027";
const NOTEBOOK_PRICE = "US$12";

const STEMS = ["Jia","Yi","Bing","Ding","Wu","Ji","Geng","Xin","Ren","Gui"];
const STEMS_ZH = "甲乙丙丁戊己庚辛壬癸";
const STEM_EN = ["Yang Wood","Yin Wood","Yang Fire","Yin Fire","Yang Earth","Yin Earth","Yang Metal","Yin Metal","Yang Water","Yin Water"];
const BR = "子丑寅卯辰巳午未申酉戌亥";

function sgOffset(y,m,d){ // シンガポールの時計の UTC からのずれ
  const k=y*10000+m*100+d;
  if(k>=19820101) return 8; if(k>=19450912) return 7.5; if(k>=19420216) return 9;
  if(k>=19410901) return 7.5; if(k>=19360101) return 7+20/60; return 7;
}
function sunLon(jd){ // Meeus の簡易式（calc.py と同じ）
  const T=(jd-2451545)/36525, r=Math.PI/180;
  const L0=280.46646+36000.76983*T+0.0003032*T*T;
  const M=(357.52911+35999.05029*T-0.0001537*T*T)*r;
  const C=(1.914602-0.004817*T-0.000014*T*T)*Math.sin(M)+(0.019993-0.000101*T)*Math.sin(2*M)+0.000289*Math.sin(3*M);
  const om=(125.04-1934.136*T)*r;
  return ((L0+C-0.00569-0.00478*Math.sin(om))%360+360)%360;
}
const jdOf=ms=>ms/86400000+2440587.5;
function risshunUTCms(y){ // 立春（黄経315度）
  let lo=Date.UTC(y,1,1), hi=Date.UTC(y,1,7);
  for(let i=0;i<60;i++){const mid=(lo+hi)/2; const lon=sunLon(jdOf(mid));
    if(((lon-315)%360+360)%360<180) hi=mid; else lo=mid;}
  return lo;
}

// 蔵干（本気・中気・余気の順）と重み
const HIDDEN={"子":"癸","丑":"己癸辛","寅":"甲丙戊","卯":"乙","辰":"戊乙癸","巳":"丙庚戊","午":"丁己","未":"己丁乙","申":"庚壬戊","酉":"辛","戌":"戊辛丁","亥":"壬甲"};
const HID_W=[[1],[0.7,0.3],[0.6,0.3,0.1]];
const TG=[["比肩","Friend"],["劫财","Rob Wealth"],["食神","Eating God"],["伤官","Hurting Officer"],["偏财","Indirect Wealth"],["正财","Direct Wealth"],["七杀","Seven Killings"],["正官","Direct Officer"],["偏印","Indirect Resource"],["正印","Direct Resource"]];
function tenGod(dm,o){ // 日主から見た十神の番号
  const r=((Math.floor(o/2)-Math.floor(dm/2))%5+5)%5, same=(o%2)===(dm%2);
  return r*2+(same?0:1);
}
const si=c=>STEMS_ZH.indexOf(c);

// 5つの群（比劫・食傷・財・官殺・印）
const GROUPS_ZH=["比劫","食伤","财","官杀","印"];
const GROUPS_EN=["Peers","Output","Wealth","Officer","Resource"];
const W_STEM=1.0, MONTH_MULT=2.0, NEAR=0.5;

function fourPillars(ds,ts){ // 四柱（時計の時刻で）。calc.py の four_pillars と同じ
  const [y,m,d]=ds.split("-").map(Number); const off=sgOffset(y,m,d);
  const [hh,mi]=ts?ts.split(":").map(Number):[12,0];
  const localMs=Date.UTC(y,m-1,d,hh,mi), utcMs=localMs-off*3600000;
  const lon=sunLon(jdOf(utcMs));
  const yy=localMs>=risshunUTCms(y)+off*3600000?y:y-1;
  const ys=((yy-4)%10+10)%10, yb=((yy-4)%12+12)%12;
  const mo=Math.floor((((lon-315)%360)+360)%360/30);
  const ms=(ys%5*2+2+mo)%10, mb=(2+mo)%12;
  const i60=((Math.round((Date.UTC(y,m-1,d)-Date.UTC(2000,0,7))/86400000))%60+60)%60;
  const p={year:STEMS_ZH[ys]+BR[yb],month:STEMS_ZH[ms]+BR[mb],day:STEMS_ZH[i60%10]+BR[i60%12],hour:null};
  if(ts){const hb=Math.floor((hh+1)/2)%12; p.hour=STEMS_ZH[(i60%10%5*2+hb)%10]+BR[hb];}
  return p;
}
const hourPillar=(dm,hb)=>STEMS_ZH[(dm%5*2+hb)%10]+BR[hb];

/* ===== 癖の型の数え方（kuse.py と同じ）===== */
function score(p){ // 5群の点・10神の点・天干に出ている群の数
  const dm=si(p.day[0]); const gods=new Array(10).fill(0), shown=[0,0,0,0,0];
  for(const key of ["year","month","day","hour"]){
    const pl=p[key]; if(!pl) continue;
    if(key!=="day"){ const g=tenGod(dm,si(pl[0])); gods[g]+=W_STEM; shown[Math.floor(g/2)]+=1; }
    const h=[...HIDDEN[pl[1]]], mult=key==="month"?MONTH_MULT:1;
    h.forEach((c,i)=>{ gods[tenGod(dm,si(c))]+=HID_W[h.length-1][i]*mult; });
  }
  const groups=[0,1,2,3,4].map(i=>gods[2*i]+gods[2*i+1]);
  return {groups,gods,shown};
}
const r6=x=>Math.round(x*1e6)/1e6;
function pick(p){ // 一番強い群（同点の決め方つき）
  const {groups,gods,shown}=score(p); const dm=si(p.day[0]);
  const monthMain=Math.floor(tenGod(dm,si(HIDDEN[p.month[1]][0]))/2);
  const key=i=>[-r6(groups[i]), i===monthMain?0:1, -shown[i], -Math.max(gods[2*i],gods[2*i+1]), i];
  const order=[0,1,2,3,4].sort((a,b)=>{const A=key(a),B=key(b); for(let k=0;k<A.length;k++){ if(A[k]!==B[k]) return A[k]-B[k]; } return 0;});
  const top=order[0], second=order[1], gap=groups[top]-groups[second];
  const why=gap>1e-9?"points":(top===monthMain?"tie: month":"tie: shown stems");
  return {top,second,gap:Math.round(gap*100)/100,why,groups,gods};
}
function adjacentMonth(p,step){
  const q=Object.assign({},p);
  q.month=STEMS_ZH[(si(p.month[0])+step+10)%10]+BR[(BR.indexOf(p.month[1])+step+12)%12];
  if((step===-1&&p.month[1]==="寅")||(step===1&&p.month[1]==="丑")) // 立春をまたぐときは年の柱も隣に
    q.year=STEMS_ZH[(si(p.year[0])+step+10)%10]+BR[(BR.indexOf(p.year[1])+step+12)%12];
  return q;
}
function nearJie(ds,ts){ // 節入りの近く：-1＝直後（前の月かも）・1＝直前（次の月かも）・0
  const [y,m,d]=ds.split("-").map(Number); const [hh,mi]=ts?ts.split(":").map(Number):[12,0];
  const lon=sunLon(jdOf(Date.UTC(y,m-1,d,hh,mi)-sgOffset(y,m,d)*3600000));
  const edge=(((lon-315)%30)+30)%30, lim=ts?0.042:1.0;
  if(edge<lim) return -1; if(edge>30-lim) return 1; return 0;
}
// だいたいの時刻（3つの時支）
const ROUGH={morning:{label:"morning (5–11 am)",hb:[3,4,5]},afternoon:{label:"afternoon (11 am–5 pm)",hb:[6,7,8]},evening:{label:"evening (5–11 pm)",hb:[9,10,11]},night:{label:"night (11 pm–5 am)",hb:[0,1,2]}};

// ds="YYYY-MM-DD"、ts="HH:MM" か null、rough="morning" などか null
function kuse(ds,ts,rough){
  const p=fourPillars(ds,ts); const dm=si(p.day[0]);
  const r={pillars:p,dm,mode:ts?"exact":(rough?"rough":"none"),stable:null,tried:null,counts:null,near:false,dayAlt:null,jieAlt:null,midnight:false};
  if(ts){
    const k=pick(p); Object.assign(r,{top:k.top,second:k.second,gap:k.gap,why:k.why,groups:k.groups,gods:k.gods});
    r.near=k.gap<=NEAR;
  } else {
    // 時柱なし：6字の結果と、時柱を入れた結果（12通り／だいたいなら3通り）を比べる
    const k6=pick(p); const hbs=rough?ROUGH[rough].hb:[0,1,2,3,4,5,6,7,8,9,10,11];
    const counts=[0,0,0,0,0];
    for(const hb of hbs){ const q=Object.assign({},p,{hour:hourPillar(dm,hb)}); counts[pick(q).top]++; }
    let best=0; for(let i=1;i<5;i++){ if(counts[i]>counts[best]||(counts[i]===counts[best]&&i===k6.top&&best!==k6.top)) best=i; }
    // ↑ kuse.py の max(range(5), key=(counts, i==top6)) と同じ（全部同じなら先の番号）
    const rest=[0,1,2,3,4].sort((a,b)=>counts[b]-counts[a]);
    const second=rest[0]===best?rest[1]:rest[0];
    Object.assign(r,{top:best,second,gap:k6.gap,why:"most of "+hbs.length+" hours",groups:k6.groups,gods:k6.gods,stable:counts[best],tried:hbs.length,counts});
  }
  // 夜11時台：流派で日主が次の日になる → その日主での型も出す
  if(ts&&ts.startsWith("23")){
    const i60=(()=>{for(let n=0;n<60;n++) if(n%10===dm&&n%12===BR.indexOf(p.day[1])) return n;})();
    const n2=(i60+1)%60, dm2=n2%10;
    const q=Object.assign({},p,{day:STEMS_ZH[dm2]+BR[n2%12],hour:hourPillar(dm2,0)});
    r.dayAlt={dm:dm2,top:pick(q).top};
  }
  if(ts&&ts.startsWith("00")) r.midnight=true;
  // 節入りの境目：隣の月の柱で数え直す
  const e=nearJie(ds,ts);
  if(e){ const alt=pick(adjacentMonth(p,e)).top; r.jieAlt={top:alt,changes:alt!==r.top}; }
  const [y,m,d]=ds.split("-").map(Number); r.offset=sgOffset(y,m,d);
  r.typeIndex=dm*5+r.top; r.secondIndex=dm*5+r.second;
  return r;
}

/* ===== 手帳の月の表（kuse.py の techo と同じ。月0＝2027年1月を前に足す）===== */
const CHONG={"子":"午","丑":"未","寅":"申","卯":"酉","辰":"戌","巳":"亥","午":"子","未":"丑","申":"寅","酉":"卯","戌":"辰","亥":"巳"};
const HE6={"子":"丑","丑":"子","寅":"亥","亥":"寅","卯":"戌","戌":"卯","辰":"酉","酉":"辰","巳":"申","申":"巳","午":"未","未":"午"};
const M2027=["壬寅","癸卯","甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑"];
const M0_2027="辛丑"; // 2027年1月（小寒から）
const REL=["same","outlet","push","brake","fuel"]; // (月の群 − 癖の群) mod 5
const REL_PT={same:2,fuel:1,outlet:0,brake:0,push:0};
const REL_LABEL={same:"Peak month",fuel:"Feeding month",outlet:"Outlet month",brake:"Practice month",push:"Spill-over month"};
function jieDate(target,loMs){ // 太陽黄経が target を通る時刻（kuse.py と同じ二分法）→ シンガポール時刻を UTC の数で
  let lo=loMs, hi=loMs+30*86400000;
  for(let i=0;i<60;i++){const mid=lo+(hi-lo)/2; const dl=((sunLon(jdOf(mid))-target+540)%360)-180; if(dl>=0) hi=mid; else lo=mid;}
  return lo+8*3600000;
}
function jieDates2027(){
  const out=[]; for(let k=0;k<12;k++) out.push(jieDate((315+30*k)%360, Date.UTC(2027,0,20)+30.4*k*86400000));
  return out;
}
function techoRow(dm,D,nat,mp,start){
  const g=Math.floor(tenGod(dm,si(mp[0]))/2), gb=Math.floor(tenGod(dm,si(HIDDEN[mp[1]][0]))/2);
  const rel=REL[((g-D)%5+5)%5], relb=REL[((gb-D)%5+5)%5]; const ev=[];
  if(CHONG[mp[1]]===nat.day) ev.push("dayClash");
  if(HE6[mp[1]]===nat.day) ev.push("dayCombine");
  if(CHONG[mp[1]]===nat.month) ev.push("monthClash");
  if(CHONG[mp[1]]===nat.year) ev.push("yearClash");
  const pt=REL_PT[rel]+0.5*REL_PT[relb]+((ev.includes("dayClash")||ev.includes("dayCombine"))?1:0);
  return {start,pillar:mp,god:tenGod(dm,si(mp[0])),rel,relb,events:ev,pt,watch:false};
}
function techo(r){
  const p=r.pillars, dm=r.dm, D=r.top;
  const nat={day:p.day[1],month:p.month[1],year:p.year[1]};
  const js=jieDates2027();
  const rows=M2027.map((mp,i)=>techoRow(dm,D,nat,mp,js[i]));
  const ranked=rows.slice().sort((a,b)=>(b.pt-a.pt)||(b.events.length-a.events.length));
  let cut=null;
  if(ranked.length>=3&&ranked[2].pt>0){
    cut=[ranked[2].pt,ranked[2].events.length];
    for(const x of ranked.slice(0,4)) if(x.pt>cut[0]||(x.pt===cut[0]&&x.events.length>=cut[1])) x.watch=true;
  } else for(const x of ranked.slice(0,3)) if(x.pt>0) x.watch=true;
  // 月0（2027年1月）：同じルールで点を出し、★の線（cut）以上なら★
  const m0=techoRow(dm,D,nat,M0_2027,jieDate(285,Date.UTC(2026,11,25)));
  if(cut&&(m0.pt>cut[0]||(m0.pt===cut[0]&&m0.events.length>=cut[1]))) m0.watch=true;
  return [m0,...rows];
}

if(typeof module!=="undefined") module.exports={fourPillars,kuse,pick,score,techo,jieDates2027,GROUPS_ZH,GROUPS_EN,STEMS,STEMS_ZH,TG};
