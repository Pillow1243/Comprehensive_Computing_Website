import {FORMULAS,CATEGORIES,getFormula,r6} from './registry.js';
import {evaluate,numericDerivative,numericIntegral,findRoot,UNITS,convertUnits,fmt,toBase,fromBase} from './engine.js';
import {drawFormulaPlot,drawFunctionPlot} from './plot.js';
import {requestSymbolicDerivative} from './api.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let lang=localStorage.getItem('se_lang')||'fa'; let currentFormula=null, currentResult=null, currentValues={};
const I18N={fa:{home:'خانه و فرمول‌ها',calc:'ماشین‌حساب علمی',plotter:'رسم تابع',converter:'مبدل واحد',practice:'تمرین و آزمون',catalog:'کاتالوگ کامل (۲۹ بخش)',history:'تاریخچه و نشان‌شده‌ها',cats:'دسته‌بندی موضوعی',heroT:'هر معادله‌ای را گام‌به‌گام حل کن',heroP:'ریاضی، فیزیک، شیمی، مهندسی و مالی — با رسم پویا، پشتیبانی کامل واحد، فارسی و انگلیسی، روی هر دستگاهی.',allFormulas:'همه فرمول‌ها',back:'بازگشت',bookmark:'نشان‌کردن',share:'اشتراک‌گذاری',print:'چاپ/PDF',result:'نتیجه',steps:'حل گام‌به‌گام',plot:'رسم پویا',examples:'مثال و تست خودکار',install:'نصب اپ'},
en:{home:'Home & Formulas',calc:'Scientific Calculator',plotter:'Function Plotter',converter:'Unit Converter',practice:'Practice Quiz',catalog:'Full Catalog (29 sections)',history:'History & Bookmarks',cats:'Categories',heroT:'Solve any equation, step by step',heroP:'Math, physics, chemistry, engineering & finance — dynamic plots, full unit support, on every device.',allFormulas:'All formulas',back:'Back',bookmark:'Bookmark',share:'Share',print:'Print/PDF',result:'Result',steps:'Step-by-step solution',plot:'Dynamic plot',examples:'Example & auto tests',install:'Install'}};
const t=k=>(I18N[lang]&&I18N[lang][k])||I18N.fa[k]||k;
const nameOf=f=>lang==='en'?f.name_en:f.name_fa;
const labelOf=v=>lang==='en'?(v.label_en||v.label_fa||v.name):(v.label_fa||v.name);
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
function applyLang(){ document.documentElement.lang=lang; document.documentElement.dir=lang==='fa'?'rtl':'ltr'; $('#langBtn').textContent=lang==='fa'?'EN':'فا'; $$('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n)); $('#globalSearch').placeholder=lang==='fa'?'جستجوی فرمول… مثلث، pH، بهره…':'Search formulas… triangle, pH, interest…'; renderCategories(); renderGrid($('#globalSearch').value); if(currentFormula) openFormula(currentFormula.id,false); }
function applyTheme(th){ document.documentElement.dataset.theme=th; $('#themeBtn').textContent=th==='dark'?'☀️':'🌙'; if(currentFormula) drawCurrentPlot(); }
applyTheme(localStorage.getItem('se_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));

// categories + grid
function renderCategories(){ const tree=$('#catTree'); tree.innerHTML=''; CATEGORIES.forEach(cat=>{ const count=FORMULAS.filter(f=>f.category_path[0]===cat.fa).length; const b=document.createElement('button'); b.className='cat-item'; b.innerHTML=`<span>${cat.icon}</span><span>${lang==='en'?cat.en:cat.fa}</span><span class="cat-count">${count}</span>`; b.onclick=()=>{ location.hash='#/'; renderGrid('',cat.fa); $('#sidebar').classList.remove('open');}; tree.appendChild(b); cat.children.forEach(ch=>{ const c=FORMULAS.filter(f=>f.category_path[1]===ch).length; if(!c)return; const b2=document.createElement('button'); b2.className='cat-item'; b2.style.paddingInlineStart='38px'; b2.innerHTML=`<span>${ch}</span><span class="cat-count">${c}</span>`; b2.onclick=()=>{location.hash='#/';renderGrid('',null,ch);$('#sidebar').classList.remove('open');}; tree.appendChild(b2); }); }); }
function renderGrid(q='',cat=null,sub=null){ const query=q.trim().toLowerCase(); const list=FORMULAS.filter(f=>{ if(cat&&f.category_path[0]!==cat)return false; if(sub&&f.category_path[1]!==sub)return false; if(!query)return true; return [f.name_fa,f.name_en,f.id,...f.tags,...f.category_path].join(' ').toLowerCase().includes(query); });
 $('#formulaGrid').innerHTML=list.map(f=>`<a class="fcard" href="#/formula/${f.id}"><span class="badge">${f.category_path.join(' ← ')}</span><h3>${nameOf(f)}</h3><span class="muted">${lang==='en'?f.name_fa:f.name_en}</span><p>${f.description_fa}</p><span class="tags">${f.tags.map(x=>'#'+x).join(' ')}</span></a>`).join('');
 $('#noResults').classList.toggle('hidden',list.length>0); $('#resultCount').textContent=`${list.length} ${lang==='fa'?'فرمول':'formulas'}`; }
$('#heroStats').innerHTML=`<div class="stat"><b>${FORMULAS.length}</b>فرمول فعال</div><div class="stat"><b>۲۹</b>بخش در کاتالوگ</div><div class="stat"><b>~۱۹۵</b>موضوع برنامه‌ریزی‌شده</div><div class="stat"><b>۱۰۰٪</b>رسپانسیو + آفلاین</div>`;
$('#quickChips').innerHTML=['قانون کسینوس‌ها','pH','معادله درجه دو','بهره مرکب','قانون اهم','آمار توصیفی'].map(x=>`<button type="button">${x}</button>`).join('');
$$('#quickChips button').forEach(b=>b.onclick=()=>{ $('#globalSearch').value=b.textContent; renderGrid(b.textContent); });
let debounce; $('#globalSearch').addEventListener('input',e=>{ clearTimeout(debounce); debounce=setTimeout(()=>{ location.hash='#/'; renderGrid(e.target.value); },200); });

// routing
const VIEWS=['home','solver','calculator','plotter','converter','practice','catalog','history'];
function show(view){ VIEWS.forEach(v=>$('#view-'+v).classList.toggle('hidden',v!==view)); $$('#toolNav a').forEach(a=>a.classList.toggle('active',a.dataset.nav===view||(view==='solver'&&a.dataset.nav==='home'))); window.scrollTo({top:0}); }
function route(){ const h=location.hash.replace(/^#\//,''); const [page,arg]=h.split('/'); const qs=new URLSearchParams(h.split('?')[1]||'');
 if(page==='formula'&&arg){ openFormula(arg,true,qs); return; }
 if(VIEWS.includes(page)){ show(page); if(page==='plotter') drawPlotter(); if(page==='practice') newQuiz(); if(page==='history') renderHistory(); if(page==='catalog') renderCatalog(); return; }
 show('home'); }
window.addEventListener('hashchange',route);

// solver
function unitSelect(v){ if(!v.unit||!UNITS[v.unit])return ''; const units=Object.keys(UNITS[v.unit].units); return `<select data-unit-for="${v.name}" aria-label="واحد ${v.name}">${units.map(u=>`<option ${u===UNITS[v.unit].base?'selected':''}>${u}</option>`).join('')}</select>`; }
function openFormula(id,push=true,qs=null){ const f=getFormula(id); if(!f){toast('فرمول یافت نشد');return;} currentFormula=f; show('solver');
 $('#solverCat').textContent=f.category_path.join(' ← ')+' • v'+f.version+(f.validated?' • ✔ تست‌شده':'');
 $('#solverTitle').textContent=nameOf(f); $('#solverDesc').textContent=f.description_fa;
 const latexEl=$('#solverLatex'); latexEl.textContent='$$'+f.formula_latex+'$$'; if(window.katex){ try{ latexEl.innerHTML=window.katex.renderToString(f.formula_latex.replace(/\\\\/g,'\\'),{displayMode:true,throwOnError:false}); }catch{} }
 const form=$('#solverForm'); form.innerHTML=`<h2>${lang==='fa'?'ورودی‌ها':'Inputs'}</h2>`+f.variables.map(v=>{ const def=qs&&qs.get(v.name)!==null?qs.get(v.name):v.default; return `<div class="field"><label for="in_${v.name}">${labelOf(v)}${v.unit&&UNITS[v.unit]?` (${UNITS[v.unit].label_fa})`:''}</label><div class="field-row"><input id="in_${v.name}" data-var="${v.name}" type="${v.type==='text'?'text':'number'}" step="any" value="${def??''}" ${v.type!=='text'?'inputmode="decimal"':''}>${unitSelect(v)}</div></div>`; }).join('')+`<button class="btn" type="submit">${lang==='fa'?'حل گام‌به‌گام':'Solve'}</button> <button class="btn" type="button" id="exampleBtn" style="background:var(--brand2)">${lang==='fa'?'مثال پیش‌فرض':'Example'}</button>`;
 form.onsubmit=e=>{e.preventDefault(); solve();};
 form.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>{ clearTimeout(debounce); debounce=setTimeout(solve,200); }));
 $('#exampleBtn').onclick=()=>{ f.variables.forEach(v=>{ const el=$('#in_'+CSS.escape(v.name)); if(el&&v.default!==undefined)el.value=v.default; }); solve(); };
 const bms=JSON.parse(localStorage.getItem('se_bookmarks')||'[]'); $('#bookmarkBtn').firstChild.textContent=bms.includes(id)?'★ ':'☆ ';
 $('#examplesBox').innerHTML=(f.tests||[]).map((tc,i)=>`<p>تست ${i+1}: <code dir="ltr">${JSON.stringify(tc.input)}</code> ← مورد انتظار: <code dir="ltr">${JSON.stringify(tc.expected)}</code></p>`).join('')+((f.examples||[]).map(e=>`<p>مثال: <code dir="ltr">${JSON.stringify(e)}</code></p>`).join(''));
 solve(); }
function collectValues(f){ const vals={}; f.variables.forEach(v=>{ const el=document.querySelector(`[data-var="${CSS.escape(v.name)}"]`); let val=v.type==='text'?el.value:parseFloat(el.value); if(v.type!=='text'){ const unitEl=document.querySelector(`[data-unit-for="${CSS.escape(v.name)}"]`); if(unitEl&&v.unit) val=toBase(val,v.unit,unitEl.value); if(isNaN(val)) throw new Error('مقدار معتبر برای «'+labelOf(v)+'» وارد کنید'); } vals[v.name]=val; }); return vals; }
function solve(){ const f=currentFormula; if(!f)return; try{ const vals=collectValues(f); currentValues=vals; const res=f.compute({...vals}); currentResult=res;
  $('#resultBox').innerHTML=`<table class="result-table">${Object.entries(res.values).map(([k,v])=>`<tr><th>${k}</th><td dir="auto"><b>${typeof v==='number'?fmt(v):v}</b></td></tr>`).join('')}</table>`;
  $('#stepsBox').innerHTML=res.steps.map(s=>`<li dir="auto">${s}</li>`).join('');
  saveHistory(f,vals,res); drawCurrentPlot();
 }catch(e){ $('#resultBox').innerHTML=`<p class="error">⚠ ${e.message}</p>`; $('#stepsBox').innerHTML=''; } }
function drawCurrentPlot(){ if(currentFormula) drawFormulaPlot($('#formulaCanvas'),currentFormula,currentValues,currentResult); }
window.addEventListener('resize',()=>{ clearTimeout(debounce); debounce=setTimeout(()=>{ if(currentFormula&&!$('#view-solver').classList.contains('hidden'))drawCurrentPlot(); if(!$('#view-plotter').classList.contains('hidden'))drawPlotter(); },200); });
function saveHistory(f,vals,res){ const h=JSON.parse(localStorage.getItem('se_history')||'[]'); h.unshift({id:f.id,ts:Date.now(),vals,main:Object.entries(res.values)[0]}); localStorage.setItem('se_history',JSON.stringify(h.slice(0,100))); }
$('#bookmarkBtn').onclick=()=>{ if(!currentFormula)return; let b=JSON.parse(localStorage.getItem('se_bookmarks')||'[]'); if(b.includes(currentFormula.id)){b=b.filter(x=>x!==currentFormula.id);toast('از نشان‌شده‌ها حذف شد');}else{b.push(currentFormula.id);toast('نشان شد ⭐');} localStorage.setItem('se_bookmarks',JSON.stringify(b)); $('#bookmarkBtn').firstChild.textContent=b.includes(currentFormula.id)?'★ ':'☆ '; };
$('#shareBtn').onclick=async()=>{ if(!currentFormula)return; const params=new URLSearchParams(Object.entries(currentValues).map(([k,v])=>[k,String(v)])); const url=location.origin+location.pathname+'#/formula/'+currentFormula.id+'?'+params; try{ await navigator.clipboard.writeText(url); toast('لینک کپی شد 🔗'); }catch{ prompt('لینک اشتراک‌گذاری:',url); } };
$('#printBtn').onclick=()=>window.print();
$('#copyLatexBtn').onclick=async()=>{ if(currentFormula){ try{await navigator.clipboard.writeText(currentFormula.formula_latex);toast('LaTeX کپی شد');}catch{} } };
$('#backBtn').onclick=()=>{ location.hash='#/'; };

// calculator
const KEYS=['7','8','9','/','sin(','4','5','6','*','cos(','1','2','3','-','sqrt(','0','.','pi','+','^','(',')','e','ln(','!','%','⌫','C','='];
$('#calcKeys').innerHTML=KEYS.map(k=>`<button type="button" data-k="${k}">${k}</button>`).join('');
function calcRun(){ try{ const v=evaluate($('#calcExpr').value); $('#calcOut').textContent='= '+fmt(v,10); }catch(e){ $('#calcOut').innerHTML=`<span class="error" style="font-size:15px">⚠ ${e.message}</span>`; } }
$('#calcKeys').addEventListener('click',e=>{ const k=e.target.dataset.k; if(!k)return; const inp=$('#calcExpr'); if(k==='⌫')inp.value=inp.value.slice(0,-1); else if(k==='C')inp.value=''; else if(k==='='){calcRun();return;} else inp.value+=k; calcRun(); inp.focus(); });
let cd; $('#calcExpr').addEventListener('input',()=>{clearTimeout(cd);cd=setTimeout(calcRun,200);}); calcRun();
$('#derivBtn').onclick=()=>{ try{ $('#derivOut').textContent='f′ = '+fmt(numericDerivative($('#derivF').value,parseFloat($('#derivX').value)),8); }catch(e){$('#derivOut').textContent=e.message;} };
$('#serverDerivBtn').onclick=async()=>{ const target=$('#serverDerivOut'); target.classList.remove('error'); target.textContent=lang==='en'?'Connecting…':'در حال اتصال…'; try{ const result=await requestSymbolicDerivative($('#symbolicDerivF').value,parseFloat($('#symbolicDerivX').value),lang); target.textContent=`f′ = ${result.derivative}  ;  f′(x) = ${result.at_point}`; }catch(e){target.textContent=e.message;target.classList.add('error');} };
$('#intBtn').onclick=()=>{ try{ $('#intOut').textContent='∫ = '+fmt(numericIntegral($('#intF').value,parseFloat($('#intA').value),parseFloat($('#intB').value)),8); }catch(e){$('#intOut').textContent=e.message;} };
$('#rootBtn').onclick=()=>{ try{ $('#rootOut').textContent='x ≈ '+fmt(findRoot($('#rootF').value,parseFloat($('#rootA').value),parseFloat($('#rootB').value)),10); }catch(e){$('#rootOut').textContent=e.message;} };
// plotter
function drawPlotter(){ try{ drawFunctionPlot($('#plotCanvas'),$('#plotExpr').value,parseFloat($('#plotMin').value),parseFloat($('#plotMax').value)); $('#plotErr').textContent=''; }catch(e){ $('#plotErr').textContent=e.message; } }
['plotExpr','plotMin','plotMax'].forEach(id=>$('#'+id).addEventListener('input',()=>{clearTimeout(cd);cd=setTimeout(drawPlotter,200);}));
// converter
const dimSel=$('#convDim'); dimSel.innerHTML=Object.entries(UNITS).map(([k,v])=>`<option value="${k}">${v.label_fa} (${k})</option>`).join('');
function fillUnits(){ const dim=dimSel.value; const opts=Object.keys(UNITS[dim].units).map(u=>`<option>${u}</option>`).join(''); $('#convFrom').innerHTML=opts; $('#convTo').innerHTML=opts; $('#convTo').selectedIndex=1; convRun(); }
function convRun(){ const dim=dimSel.value; const v=convertUnits(parseFloat($('#convVal').value)||0,dim,$('#convFrom').value,$('#convTo').value); $('#convOut').textContent=`${$('#convVal').value} ${$('#convFrom').value} = ${fmt(v)} ${$('#convTo').value}`; const c=parseFloat($('#tempC').value)||0; $('#tempOut').textContent=`${fmt(c+273.15)} K = ${fmt(c*9/5+32)} °F`; }
dimSel.onchange=fillUnits; ['convVal','convFrom','convTo','tempC'].forEach(id=>$('#'+id).addEventListener('input',convRun)); fillUnits();
// catalog
async function renderCatalog(){ try{ const data=await (await fetch('catalog.json')).json().catch(()=>null)||await (await fetch('../packages/formula-registry/catalog.json')).json().catch(()=>null)||await (await fetch('../../packages/formula-registry/catalog.json')).json(); $('#catalogSummary').textContent=`${data.sections.length} بخش • ${data.implemented_count} فرمول پیاده‌سازی‌شده و تست‌شده • بقیه در نقشه راه فازهای ۱ تا ۳`;
 $('#catalogList').innerHTML=data.sections.map(s=>`<div class="catalog-sec"><h3>${s.title_fa} <span class="pill ${s.status==='partial'?'done':''}">${s.status==='partial'?'در حال پیاده‌سازی':'برنامه‌ریزی‌شده'}</span></h3>${s.planned_items.map(i=>`<span class="pill">${i}</span>`).join('')}</div>`).join(''); }catch(e){ $('#catalogList').innerHTML='<p class="error">کاتالوگ بارگذاری نشد (در حالت آفلاین/فایل محلی). فایل packages/formula-registry/catalog.json را ببینید.</p>'; } }
// history
function renderHistory(){ const h=JSON.parse(localStorage.getItem('se_history')||'[]'); const b=JSON.parse(localStorage.getItem('se_bookmarks')||'[]');
 $('#historyList').innerHTML=h.length?h.map(x=>{const f=getFormula(x.id);return f?`<div class="history-item"><a href="#/formula/${f.id}">${nameOf(f)}</a> <span class="muted">${new Date(x.ts).toLocaleString(lang==='fa'?'fa-IR':'en')}</span><br><code dir="ltr">${JSON.stringify(x.vals)}</code> ← <b>${x.main?x.main[0]+' = '+(typeof x.main[1]==='number'?fmt(x.main[1]):x.main[1]):''}</b></div>`:'';}).join(''):'<p class="muted">هنوز محاسبه‌ای انجام نشده است.</p>';
 $('#bookmarkList').innerHTML=b.length?b.map(id=>{const f=getFormula(id);return f?`<div class="history-item"><a href="#/formula/${id}">⭐ ${nameOf(f)}</a></div>`:'';}).join(''):'<p class="muted">فرمولی نشان نشده است.</p>'; }
$('#clearHistory').onclick=()=>{ localStorage.removeItem('se_history'); renderHistory(); toast('تاریخچه پاک شد'); };
// practice quiz
let quizAnswer=null;
function newQuiz(){ const f=FORMULAS[Math.floor(Math.random()*FORMULAS.length)]; const vals={}; f.variables.forEach(v=>{ vals[v.name]=v.type==='text'?v.default:Math.max(1,Math.round((v.default||2)*(0.6+Math.random()*0.9)*10)/10); }); let res; try{res=f.compute({...vals});}catch{newQuiz();return;} const [key,val]=Object.entries(res.values).find(([,v])=>typeof v==='number')||Object.entries(res.values)[0]; quizAnswer={f,vals,key,val};
 $('#quizCard').innerHTML=`<p class="badge">${f.category_path.join(' ← ')}</p><h2>${nameOf(f)}</h2><p>${f.description_fa}</p><p dir="ltr" style="text-align:center;font-size:18px">${f.formula_latex}</p><p>با مقادیر: <code dir="ltr">${JSON.stringify(vals)}</code></p><p>مقدار <b>${key}</b> چقدر است؟</p><div class="field-row"><input id="quizInput" type="number" step="any" style="flex:1;min-height:48px;border:1px solid var(--border);border-radius:12px;padding:10px;background:var(--bg)" inputmode="decimal"><button class="btn" id="quizCheck">بررسی</button><button class="btn" id="quizNew" style="background:var(--brand2)">سؤال جدید</button></div><p id="quizFeedback" aria-live="polite"></p><p class="muted">🏆 امتیاز این نشست: <b id="quizScore">${sessionStorage.getItem('se_score')||0}</b></p>`;
 $('#quizNew').onclick=newQuiz; $('#quizCheck').onclick=()=>{ const got=parseFloat($('#quizInput').value); const ok=Math.abs(got-quizAnswer.val)<Math.max(0.02,Math.abs(quizAnswer.val)*0.01); const fb=$('#quizFeedback'); if(ok){ const sc=+sessionStorage.getItem('se_score')||0; sessionStorage.setItem('se_score',sc+10); fb.innerHTML=`✅ آفرین! +۱۰ امتیاز — پاسخ: ${fmt(quizAnswer.val)}`; $('#quizScore').textContent=sc+10; } else fb.innerHTML=`❌ پاسخ درست: <b>${fmt(quizAnswer.val)}</b> — <a href="#/formula/${quizAnswer.f.id}">حل گام‌به‌گام را ببین</a>`; }; }
// header controls
$('#themeBtn').onclick=()=>{ const next=document.documentElement.dataset.theme==='dark'?'light':'dark'; localStorage.setItem('se_theme',next); applyTheme(next); };
$('#langBtn').onclick=()=>{ lang=lang==='fa'?'en':'fa'; localStorage.setItem('se_lang',lang); applyLang(); };
$('#menuBtn').onclick=()=>$('#sidebar').classList.toggle('open');
let deferredPrompt; window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;$('#installBtn').classList.remove('hidden');});
$('#installBtn').onclick=async()=>{ if(deferredPrompt){deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $('#installBtn').classList.add('hidden');} };
window.addEventListener('online',()=>$('#offlineBadge').textContent=''); window.addEventListener('offline',()=>$('#offlineBadge').textContent='📴 آفلاین');
if('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(()=>{});
applyLang(); route();
