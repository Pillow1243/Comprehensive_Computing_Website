// Safe expression engine (no eval) — tokenizer + recursive-descent parser
const FUNCS={sqrt:Math.sqrt,cbrt:Math.cbrt,sin:Math.sin,cos:Math.cos,tan:Math.tan,asin:Math.asin,acos:Math.acos,atan:Math.atan,sinh:Math.sinh,cosh:Math.cosh,tanh:Math.tanh,
  sec:x=>1/Math.cos(x),csc:x=>1/Math.sin(x),cot:x=>1/Math.tan(x),
  ncr:(n,r)=>{n=Math.round(n);r=Math.round(r);if(r<0||r>n||n<0)return NaN;let v=1;for(let k=1;k<=r;k++)v=v*(n-r+k)/k;return v;},
  npr:(n,r)=>{n=Math.round(n);r=Math.round(r);if(r<0||r>n||n<0)return NaN;let v=1;for(let k=0;k<r;k++)v*=(n-k);return v;},
  ln:Math.log,log:Math.log10,log2:Math.log2,log10:Math.log10,exp:Math.exp,abs:Math.abs,floor:Math.floor,ceil:Math.ceil,round:Math.round,sign:Math.sign,min:Math.min,max:Math.max};
const CONSTS={pi:Math.PI,e:Math.E,tau:2*Math.PI,phi:(1+Math.sqrt(5))/2};
export function evaluate(expr,vars={}){
  const toks=[]; let i=0; const s=String(expr).replace(/\s+/g,'');
  if(!s) throw new Error('عبارت خالی است');
  while(i<s.length){ const ch=s[i];
    if(/[0-9.]/.test(ch)){ let j=i; while(j<s.length&&/[0-9.eE+-]/.test(s[j])&&(s[j]!=='+'&&s[j]!=='-'||/[eE]/.test(s[j-1])) ) j++; /* simple scan */ 
      // safer number scan:
      j=i; while(j<s.length&&/[0-9.]/.test(s[j]))j++; if(s[j]==='e'||s[j]==='E'){j++; if(s[j]==='+'||s[j]==='-')j++; while(j<s.length&&/[0-9]/.test(s[j]))j++;}
      toks.push({t:'num',v:parseFloat(s.slice(i,j))}); i=j; continue; }
    if(/[a-zA-Z_π]/.test(ch)){ let j=i; while(j<s.length&&/[a-zA-Z0-9_]/.test(s[j]))j++; toks.push({t:'id',v:s.slice(i,j).replace('π','pi')}); i=j; continue; }
    if('+-*/%^(),!'.includes(ch)){ toks.push({t:ch}); i++; continue; }
    throw new Error('کاراکتر نامعتبر: '+ch);
  }
  let pos=0; const peek=()=>toks[pos], next=()=>toks[pos++];
  function parseExpr(){ let v=parseTerm(); while(peek()&&['+','-'].includes(peek().t)){ const op=next().t; const rhs=parseTerm(); v=op==='+'?v+rhs:v-rhs; } return v; }
  function parseTerm(){ let v=parseUnary(); while(peek()&&['*','/','%'].includes(peek().t)){ const op=next().t; const rhs=parseUnary(); v=op==='*'?v*rhs:op==='/'?v/rhs:v%rhs; } return v; }
  // Precedence (high→low): postfix !, ^ (right-assoc), unary -/+, * / %, + -.
  // Unary minus binds looser than ^, so -2^2 = -(2^2) = -4 and 2^-1 = 0.5.
  function parseUnary(){ if(peek()&&peek().t==='-'){next();return -parseUnary();} if(peek()&&peek().t==='+'){next();return parseUnary();} return parsePower(); }
  function parsePower(){ let base=parseAtom(); if(peek()&&peek().t==='!'){ next(); base=factorial(base); } if(peek()&&peek().t==='^'){ next(); const ex=parseUnary(); base=Math.pow(base,ex); } return base; }
  function factorial(n){ if(n<0||Math.round(n)!==n) throw new Error('فاکتوریل فقط برای صحیح نامنفی'); let r=1; for(let k=2;k<=n&&k<=171;k++)r*=k; return r; }
  function parseAtom(){ const tk=next(); if(!tk) throw new Error('پایان غیرمنتظره عبارت');
    if(tk.t==='num') return tk.v;
    if(tk.t==='('){ const v=parseExpr(); if(!peek()||next().t!==')') throw new Error('پرانتز بسته نیست'); return v; }
    if(tk.t==='id'){ const name=tk.v;
      if(peek()&&peek().t==='('){ next(); const args=[parseExpr()]; while(peek()&&peek().t===','){next();args.push(parseExpr());} if(!peek()||next().t!==')') throw new Error('پرانتز تابع بسته نیست'); if(Object.hasOwn(FUNCS,name)) return FUNCS[name](...args); throw new Error('تابع ناشناخته: '+name); }
      if(Object.hasOwn(vars,name)) return vars[name]; if(Object.hasOwn(CONSTS,name)) return CONSTS[name]; throw new Error('متغیر ناشناخته: '+name); }
    throw new Error('توکن غیرمنتظره'); }
  const v=parseExpr(); if(pos<toks.length) throw new Error('بخشی از عبارت پردازش نشد'); return v;
}
export function numericDerivative(f,x){ const h=1e-6; return (evaluate(f,{x:x+h})-evaluate(f,{x:x-h}))/(2*h); }
export function numericIntegral(f,a,b,n=1000){ const h=(b-a)/n; let s=0; for(let i=0;i<=n;i++){ const x=a+i*h; const w=(i===0||i===n)?1:(i%2?4:2); s+=w*evaluate(f,{x}); } return s*h/3; } // Simpson
export function findRoot(f,a,b){ let fa=evaluate(f,{x:a}),fb=evaluate(f,{x:b}); if(fa*fb>0) throw new Error('در دو سر بازه تغییر علامت نیست (Bisection)'); for(let i=0;i<80;i++){ const m=(a+b)/2,fm=evaluate(f,{x:m}); if(Math.abs(fm)<1e-12) return m; if(fa*fm<0){b=m;fb=fm;}else{a=m;fa=fm;} } return (a+b)/2; }

// ── Units (dimensional conversion to SI/base) ──
export const UNITS={
 length:{label_fa:'طول',units:{mm:0.001,cm:0.01,m:1,km:1000,inch:0.0254,ft:0.3048,mile:1609.344},base:'m'},
 angle:{label_fa:'زاویه',units:{deg:1,rad:57.29577951308232,grad:0.9,turn:360},base:'deg'},
 mass:{label_fa:'جرم',units:{g:0.001,kg:1,t:1000,lb:0.45359237,oz:0.0283495},base:'kg'},
 speed:{label_fa:'سرعت',units:{'m/s':1,'km/h':1/3.6,mph:0.44704},base:'m/s'},
 acceleration:{label_fa:'شتاب',units:{'m/s²':1,'km/h²':1/12960},base:'m/s²'},
 time:{label_fa:'زمان',units:{ms:0.001,s:1,min:60,h:3600,day:86400},base:'s'},
 temperature_k:{label_fa:'دما',units:{K:1},base:'K'},
 temperature:{label_fa:'دما',units:{'°C':1},base:'°C'},
 temperature_delta:{label_fa:'اختلاف دما',units:{K:1,'°C':1,'°F':5/9},base:'K'},
 frequency:{label_fa:'فرکانس',units:{Hz:1,kHz:1000,MHz:1e6,GHz:1e9},base:'Hz'},
 voltage:{label_fa:'ولتاژ',units:{mV:0.001,V:1,kV:1000},base:'V'},
 resistance:{label_fa:'مقاومت',units:{'Ω':1,'kΩ':1000,'MΩ':1e6},base:'Ω'},
 concentration:{label_fa:'غلظت',units:{'mol/L':1,'mmol/L':0.001},base:'mol/L'},
 area:{label_fa:'مساحت',units:{'mm²':1e-6,'cm²':1e-4,'m²':1,'ha':1e4,'km²':1e6,'in²':0.00064516,'ft²':0.09290304,'acre':4046.8564224},base:'m²'},
 volume:{label_fa:'حجم',units:{'mL':1e-3,'L':1,'m³':1000,'cm³':1e-3,'ft³':28.316846592,'gal_US':3.785411784,'fl_oz':0.0295735295625},base:'L'},
 force:{label_fa:'نیرو',units:{N:1,kN:1000,'kgf':9.80665,lbf:4.4482216153,dyn:1e-5},base:'N'},
 energy:{label_fa:'انرژی',units:{J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3.6e6,eV:1.602176634e-19},base:'J'},
 power:{label_fa:'توان',units:{W:1,kW:1000,MW:1e6,hp:745.699871582},base:'W'},
 pressure:{label_fa:'فشار',units:{Pa:1,kPa:1e3,MPa:1e6,bar:1e5,atm:101325,psi:6894.757293,mmHg:133.322387415},base:'Pa'},
 torque:{label_fa:'گشتاور',units:{'N·m':1,'lbf·ft':1.3558179483,'kgf·m':9.80665},base:'N·m'},
 data:{label_fa:'حجم داده',units:{bit:0.125,B:1,KB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824},base:'B'},
};
export function convertUnits(value,dim,from,to){ if(!dim||!UNITS[dim]) return value; const u=UNITS[dim].units; return value*u[from]/u[to]; }
export function toBase(value,dim,unit){ if(!dim||!UNITS[dim]) return value; return value*UNITS[dim].units[unit]; }
export function fromBase(value,dim,unit){ if(!dim||!UNITS[dim]) return value; return value/UNITS[dim].units[unit]; }
export const fmt=(x,d=6)=>{ if(typeof x!=='number') return String(x); if(!isFinite(x)) return String(x); if(x!==0&&(Math.abs(x)>=1e12||Math.abs(x)<1e-6)) return x.toExponential(4); return String(Math.round(x*10**d)/10**d); };
