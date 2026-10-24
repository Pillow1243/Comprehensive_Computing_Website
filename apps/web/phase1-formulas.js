// Phase 1 client-side formula pack. All implementations are explicit trusted functions;
// no source strings are evaluated. Keep each formula covered by at least four test cases.
import {evaluate} from './engine.js';

const round=(x,d=6)=>{
  if (!Number.isFinite(x) || x===0) return x;
  if (Math.abs(x)<1e-6 || Math.abs(x)>=1e12) return Number(x.toPrecision(8));
  const p=10**d;
  return Math.round((x+Number.EPSILON)*p)/p;
};
const out=(values,steps)=>({values,steps});
const number=(name,label_fa,label_en,unit,def,opts={})=>({name,label_fa,label_en,type:'number',unit:unit||null,default:def,required:true,...opts});
const text=(name,label_fa,label_en,def)=>({name,label_fa,label_en,type:'text',unit:null,default:def,required:true});
const parseList=value=>{
  const values=Array.isArray(value)?value.map(Number):String(value).split(/[,;\s،]+/).filter(Boolean).map(Number);
  if (!values.length || values.some(x=>!Number.isFinite(x))) throw new Error('فهرست عددی معتبر وارد کنید');
  return values;
};
const mod=(a,m)=>((a%m)+m)%m;
const gcd=(a,b)=>{a=Math.abs(a);b=Math.abs(b);while(b)[a,b]=[b,a%b];return a;};
const factorial=n=>{let v=1;for(let i=2;i<=n;i++)v*=i;return v;};
const make=spec=>{
  const outputs=spec.outputs||Object.keys(spec.tests[0].expected).map(name=>({name,label_fa:name,unit:null}));
  return {
    version:'1.0.0',validated:true,difficulty:'basic',tags:[],references:[],plot_spec:null,
    ...spec,outputs,
    examples:spec.examples||spec.tests.slice(0,1).map(tc=>({input:tc.input,expected:tc.expected})),
  };
};

export const PHASE1_FORMULAS=[
  make({id:'arithmetic_operations',name_fa:'چهار عمل اصلی و توان',name_en:'Arithmetic Operations',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['جمع','تفریق','ضرب','تقسیم','توان'],description_fa:'محاسبه امن جمع، تفریق، ضرب، تقسیم، باقیمانده و توان دو عدد.',formula_latex:'a+b,\\;a-b,\\;a\\times b,\\;a/b,\\;a^b',variables:[number('a','عدد اول','First number',null,12),number('b','عدد دوم','Second number',null,3),text('operation','عملگر (add/subtract/multiply/divide/mod/power)','Operation', 'divide')],tests:[
    {input:{a:2,b:3,operation:'add'},expected:{result:5}},
    {input:{a:10,b:4,operation:'subtract'},expected:{result:6}},
    {input:{a:-3,b:5,operation:'multiply'},expected:{result:-15}},
    {input:{a:12,b:3,operation:'divide'},expected:{result:4}},
    {input:{a:2,b:10,operation:'power'},expected:{result:1024}},
  ],compute({a,b,operation}){let v;switch(operation){case'add':v=a+b;break;case'subtract':v=a-b;break;case'multiply':v=a*b;break;case'divide':if(b===0)throw new Error('تقسیم بر صفر تعریف‌نشده است');v=a/b;break;case'mod':if(b===0)throw new Error('باقی‌مانده بر صفر تعریف‌نشده است');v=a%b;break;case'power':v=a**b;break;default:throw new Error('عملگر پشتیبانی نمی‌شود');}if(!Number.isFinite(v))throw new Error('نتیجه در محدوده عددی نیست');return out({result:round(v)},[`عملیات ${operation}: ${a} و ${b}`,`نتیجه = ${round(v)}`]);}}),

  make({id:'nth_root',name_fa:'ریشه nام',name_en:'Nth Root',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['رادیکال','ریشه'],description_fa:'ریشه صحیح nام عدد حقیقی، همراه با بررسی دامنه ریشه‌های زوج.',formula_latex:'\\sqrt[n]{x}=x^{1/n}',variables:[number('x','عدد زیر رادیکال','Radicand',null,27),number('n','درجه ریشه (عدد صحیح)','Root index',null,3)],tests:[
    {input:{x:27,n:3},expected:{root:3}},
    {input:{x:16,n:2},expected:{root:4}},
    {input:{x:-8,n:3},expected:{root:-2}},
    {input:{x:81,n:4},expected:{root:3}},
  ],compute({x,n}){if(!Number.isInteger(n)||n<1||n>99)throw new Error('درجه ریشه باید عدد صحیح مثبت باشد');if(x<0&&n%2===0)throw new Error('ریشه زوجِ عدد منفی در اعداد حقیقی تعریف نشده است');const root=Math.sign(x)*Math.abs(x)**(1/n);return out({root:round(root)},[`ریشه ${n}امِ ${x}`,`x^(1/${n}) = ${round(root)}`]);}}),

  make({id:'weighted_mean',name_fa:'میانگین وزنی',name_en:'Weighted Mean',category_path:['ریاضیات','آمار و احتمال'],tags:['میانگین','وزن'],description_fa:'میانگین وزن‌دار دو فهرست هم‌اندازه از مقادیر و وزن‌ها.',formula_latex:'\\bar{x}_w=\\frac{\\sum_i w_i x_i}{\\sum_i w_i}',variables:[text('data','مقادیر (با کاما)','Values (comma-separated)','1,2,3'),text('weights','وزن‌ها (با کاما)','Weights (comma-separated)','1,2,3')],tests:[
    {input:{data:'1,2,3',weights:'1,2,3'},expected:{weighted_mean:2.333333}},
    {input:{data:'10,20',weights:'1,3'},expected:{weighted_mean:17.5}},
    {input:{data:'5,5,5',weights:'2,4,1'},expected:{weighted_mean:5}},
    {input:{data:'80,90,100',weights:'20,30,50'},expected:{weighted_mean:93}},
  ],compute({data,weights}){const xs=parseList(data),ws=parseList(weights);if(xs.length!==ws.length)throw new Error('تعداد مقدارها و وزن‌ها باید برابر باشد');if(ws.some(w=>w<0)||ws.reduce((a,b)=>a+b,0)===0)throw new Error('وزن‌ها باید نامنفی و مجموع آن‌ها مثبت باشد');const sum=ws.reduce((a,b)=>a+b,0),mean=xs.reduce((s,x,i)=>s+x*ws[i],0)/sum;return out({weighted_mean:round(mean),weight_sum:round(sum)},[`مجموع وزن‌ها = ${round(sum)}`,`میانگین وزنی = Σ(wx) / Σw = ${round(mean)}`]);}}),

  make({id:'direct_proportion',name_fa:'تناسب مستقیم و قاعده سه',name_en:'Direct Proportion / Rule of Three',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['تناسب','قاعده سه'],description_fa:'حل تناسب a:b = c:x با قاعده سه.',formula_latex:'\\frac{a}{b}=\\frac{c}{x}\\;\\Rightarrow\\;x=\\frac{bc}{a}',variables:[number('a','a','a',null,2),number('b','b','b',null,3),number('c','c','c',null,4)],tests:[
    {input:{a:2,b:3,c:4},expected:{x:6}},
    {input:{a:5,b:10,c:3},expected:{x:6}},
    {input:{a:4,b:8,c:5},expected:{x:10}},
    {input:{a:1.5,b:3,c:4},expected:{x:8}},
  ],compute({a,b,c}){if(a===0)throw new Error('a نمی‌تواند صفر باشد');const x=b*c/a;return out({x:round(x)},[`a:b = c:x`, `x = b×c/a = ${b}×${c}/${a} = ${round(x)}`]);}}),

  make({id:'exponential_equation',name_fa:'حل معادله نمایی',name_en:'Solve Exponential Equation',category_path:['ریاضیات','جبر'],tags:['نمایی','لگاریتم'],description_fa:'حل a^x=b با تغییر مبنا و لگاریتم طبیعی.',formula_latex:'a^x=b\\;\\Rightarrow\\;x=\\frac{\\ln b}{\\ln a}',variables:[number('base','پایه a (مثبت و نابرابر ۱)','Base a (>0, ≠1)',null,2),number('target','طرف راست b (مثبت)','Target b (>0)',null,8)],tests:[
    {input:{base:2,target:8},expected:{x:3}},
    {input:{base:10,target:1000},expected:{x:3}},
    {input:{base:3,target:1},expected:{x:0}},
    {input:{base:5,target:25},expected:{x:2}},
  ],compute({base,target}){if(base<=0||base===1||target<=0)throw new Error('برای جواب حقیقی باید a>0، a≠1 و b>0 باشد');const x=Math.log(target)/Math.log(base);return out({x:round(x)},[`a^x = b`, `x = ln(b)/ln(a) = ${round(x)}`]);}}),

  make({id:'fraction_arithmetic',name_fa:'عملیات روی کسرها',name_en:'Fraction Arithmetic',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['کسر','ساده‌سازی'],description_fa:'جمع، تفریق، ضرب و تقسیم کسرها با ساده‌سازی خودکار.',formula_latex:'\\frac{a}{b}\\;\\circ\\;\\frac{c}{d}',variables:[number('a_num','صورت کسر اول','First numerator',null,1),number('a_den','مخرج کسر اول','First denominator',null,2),number('b_num','صورت کسر دوم','Second numerator',null,1),number('b_den','مخرج کسر دوم','Second denominator',null,3),text('operation','عملگر (+, -, *, /)','Operation (+, -, *, /)','+')],tests:[
    {input:{a_num:1,a_den:2,b_num:1,b_den:3,operation:'+'},expected:{numerator:5,denominator:6,decimal:0.833333}},
    {input:{a_num:3,a_den:4,b_num:1,b_den:2,operation:'-'},expected:{numerator:1,denominator:4,decimal:0.25}},
    {input:{a_num:2,a_den:3,b_num:3,b_den:5,operation:'*'},expected:{numerator:2,denominator:5,decimal:0.4}},
    {input:{a_num:5,a_den:6,b_num:10,b_den:9,operation:'/'},expected:{numerator:3,denominator:4,decimal:0.75}},
  ],compute({a_num,a_den,b_num,b_den,operation}){if(a_den===0||b_den===0)throw new Error('مخرج کسر نمی‌تواند صفر باشد');let p,q;switch(operation){case'+':p=a_num*b_den+b_num*a_den;q=a_den*b_den;break;case'-':p=a_num*b_den-b_num*a_den;q=a_den*b_den;break;case'*':p=a_num*b_num;q=a_den*b_den;break;case'/':if(b_num===0)throw new Error('تقسیم بر کسر صفر تعریف‌نشده است');p=a_num*b_den;q=a_den*b_num;break;default:throw new Error('عملگر نامعتبر است');}if(q<0){p=-p;q=-q;}const g=gcd(p,q)||1;p/=g;q/=g;return out({numerator:p,denominator:q,decimal:round(p/q)},[`مخرج مشترک و انجام عمل ${operation}`,`کسر ساده‌شده = ${p}/${q}`,`اعشاری = ${round(p/q)}`]);}}),

  make({id:'fraction_to_decimal',name_fa:'تبدیل کسر به اعشار',name_en:'Fraction to Decimal',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['کسر','اعشار'],description_fa:'تبدیل کسر به عدد اعشاری با نمایش کسر ساده‌شده.',formula_latex:'\\frac{p}{q}=p\\div q',variables:[number('numerator','صورت','Numerator',null,1),number('denominator','مخرج','Denominator',null,8)],tests:[
    {input:{numerator:1,denominator:8},expected:{decimal:0.125}},
    {input:{numerator:1,denominator:3},expected:{decimal:0.333333}},
    {input:{numerator:-3,denominator:4},expected:{decimal:-0.75}},
    {input:{numerator:10,denominator:5},expected:{decimal:2}},
  ],compute({numerator,denominator}){if(denominator===0)throw new Error('مخرج نمی‌تواند صفر باشد');const g=gcd(numerator,denominator)||1;let p=numerator/g,q=denominator/g;if(q<0){p=-p;q=-q;}return out({decimal:round(numerator/denominator),simplified_fraction:`${p}/${q}`},[`کسر: ${numerator}/${denominator}`,`اعشاری = ${round(numerator/denominator)}`,`ساده‌شده = ${p}/${q}`]);}}),

  make({id:'complex_arithmetic',name_fa:'عملیات اعداد مختلط',name_en:'Complex Arithmetic',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['مختلط','مختلط‌نما'],description_fa:'جمع، تفریق، ضرب و تقسیم دو عدد مختلط a+bi و c+di.',formula_latex:'(a+bi)(c+di)=(ac-bd)+(ad+bc)i',variables:[number('a_re','قسمت حقیقی z₁','Real part z₁',null,1),number('a_im','قسمت موهومی z₁','Imaginary part z₁',null,2),number('b_re','قسمت حقیقی z₂','Real part z₂',null,3),number('b_im','قسمت موهومی z₂','Imaginary part z₂',null,4),text('operation','عملگر (add/subtract/multiply/divide)','Operation','add')],tests:[
    {input:{a_re:1,a_im:2,b_re:3,b_im:4,operation:'add'},expected:{real:4,imaginary:6}},
    {input:{a_re:5,a_im:5,b_re:2,b_im:3,operation:'subtract'},expected:{real:3,imaginary:2}},
    {input:{a_re:1,a_im:2,b_re:3,b_im:4,operation:'multiply'},expected:{real:-5,imaginary:10}},
    {input:{a_re:1,a_im:1,b_re:1,b_im:-1,operation:'divide'},expected:{real:0,imaginary:1}},
  ],compute({a_re,a_im,b_re,b_im,operation}){let re,im;if(operation==='add'){re=a_re+b_re;im=a_im+b_im;}else if(operation==='subtract'){re=a_re-b_re;im=a_im-b_im;}else if(operation==='multiply'){re=a_re*b_re-a_im*b_im;im=a_re*b_im+a_im*b_re;}else if(operation==='divide'){const d=b_re*b_re+b_im*b_im;if(!d)throw new Error('تقسیم بر عدد مختلط صفر تعریف‌نشده است');re=(a_re*b_re+a_im*b_im)/d;im=(a_im*b_re-a_re*b_im)/d;}else throw new Error('عملگر نامعتبر است');return out({real:round(re),imaginary:round(im),magnitude:round(Math.hypot(re,im)),argument_radians:round(Math.atan2(im,re))},[`z₁ ${operation} z₂`, `نتیجه = ${round(re)} + (${round(im)})i`]);}}),

  make({id:'modular_power',name_fa:'توان پیمانه‌ای سریع',name_en:'Modular Exponentiation',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['پیمانه','توان'],description_fa:'محاسبه b^e mod m با الگوریتم توان‌رسانی دودویی.',formula_latex:'b^e\\pmod m',variables:[number('base','پایه','Base',null,2),number('exponent','توان صحیح نامنفی','Non-negative exponent',null,10),number('modulus','پیمانه مثبت','Positive modulus',null,1000)],tests:[
    {input:{base:2,exponent:10,modulus:1000},expected:{residue:24}},
    {input:{base:3,exponent:0,modulus:7},expected:{residue:1}},
    {input:{base:5,exponent:117,modulus:19},expected:{residue:1}},
    {input:{base:-2,exponent:3,modulus:5},expected:{residue:2}},
  ],compute({base,exponent,modulus}){if(!Number.isInteger(base)||!Number.isInteger(exponent)||exponent<0||!Number.isInteger(modulus)||modulus<1)throw new Error('پایه، توان و پیمانه باید اعداد صحیح معتبر باشند');let b=mod(base,modulus),e=exponent,result=1%modulus;while(e){if(e%2)result=result*b%modulus;b=b*b%modulus;e=Math.floor(e/2);}return out({residue:result},[`توان‌رسانی دودویی در پیمانه ${modulus}`,`b^e mod m = ${result}`]);}}),

  make({id:'euler_totient',name_fa:'تابع فی اویلر',name_en:'Euler Totient Function',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['فی اویلر','نظریه اعداد'],description_fa:'تعداد اعداد صحیح مثبت کوچک‌تر یا مساوی n که با n نسبت به هم اول‌اند.',formula_latex:'\\varphi(n)=n\\prod_{p\\mid n}(1-1/p)',variables:[number('n','عدد صحیح مثبت n','Positive integer n',null,12,{min:1})],tests:[
    {input:{n:1},expected:{phi:1}},
    {input:{n:9},expected:{phi:6}},
    {input:{n:12},expected:{phi:4}},
    {input:{n:17},expected:{phi:16}},
  ],compute({n}){if(!Number.isSafeInteger(n)||n<1)throw new Error('n باید عدد صحیح مثبت امن باشد');let m=n,phi=n;for(let p=2;p*p<=m;p++){if(m%p===0){phi-=phi/p;while(m%p===0)m/=p;}}if(m>1)phi-=phi/m;return out({phi},[`تجزیه عوامل اول و حذف مضارب عوامل مشترک`, `φ(${n}) = ${phi}`]);}}),

  make({id:'chinese_remainder',name_fa:'قضیه باقیمانده چینی',name_en:'Chinese Remainder Theorem',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['CRT','هم‌نهشتی'],description_fa:'حل دو هم‌نهشتی حتی در حالت پیمانه‌های نابرابر و بررسی سازگاری.',formula_latex:'x\\equiv a\\pmod m,\\quad x\\equiv b\\pmod n',variables:[number('a','باقی‌مانده اول','First residue',null,2),number('m','پیمانه اول مثبت','First positive modulus',null,3),number('b','باقی‌مانده دوم','Second residue',null,3),number('n','پیمانه دوم مثبت','Second positive modulus',null,5)],tests:[
    {input:{a:2,m:3,b:3,n:5},expected:{residue:8,modulus:15}},
    {input:{a:1,m:4,b:3,n:6},expected:{residue:9,modulus:12}},
    {input:{a:0,m:2,b:1,n:3},expected:{residue:4,modulus:6}},
    {input:{a:-1,m:4,b:3,n:6},expected:{residue:3,modulus:12}},
  ],compute({a,m,b,n}){if(![a,m,b,n].every(Number.isSafeInteger)||m<1||n<1)throw new Error('باقی‌مانده‌ها باید صحیح و پیمانه‌ها مثبت باشند');const g=gcd(m,n),delta=b-a;if(delta%g!==0)throw new Error('این هم‌نهشتی‌ها جواب مشترک ندارند');const m1=m/g,n1=n/g;let inv=0;if(n1!==1){let oldR=m1,r=n1,oldS=1,s=0;while(r){const q=Math.floor(oldR/r);[oldR,r]=[r,oldR-q*r];[oldS,s]=[s,oldS-q*s];}inv=mod(oldS,n1);}const t=n1===1?0:mod((delta/g)*inv,n1),lcm=m*n1,x=mod(a+m*t,lcm);return out({residue:x,modulus:lcm},[`gcd(m,n) = ${g}; سازگاری بررسی شد`,`جواب کمینه نامنفی: x ≡ ${x} (mod ${lcm})`]);}}),

  make({id:'fibonacci_number',name_fa:'عدد فیبوناچی nام',name_en:'Nth Fibonacci Number',category_path:['ریاضیات','حساب و نظریه اعداد'],tags:['فیبوناچی','دنباله'],description_fa:'محاسبه Fₙ با روش تکراری خطی و قرارداد F₀=0، F₁=1.',formula_latex:'F_0=0,\\;F_1=1,\\;F_n=F_{n-1}+F_{n-2}',variables:[number('n','اندیس صحیح n (۰ تا ۷۸)','Integer index n (0–78)',null,10)],tests:[
    {input:{n:0},expected:{fibonacci:0}},
    {input:{n:1},expected:{fibonacci:1}},
    {input:{n:10},expected:{fibonacci:55}},
    {input:{n:20},expected:{fibonacci:6765}},
  ],compute({n}){if(!Number.isInteger(n)||n<0||n>78)throw new Error('n باید عدد صحیحی بین ۰ و ۷۸ باشد');let a=0,b=1;for(let i=0;i<n;i++)[a,b]=[b,a+b];return out({fibonacci:a},[`F₀ = 0 و F₁ = 1`,`تکرار رابطه بازگشتی تا n=${n}: Fₙ = ${a}`]);}}),

  make({id:'vector_dot_angle',name_fa:'ضرب داخلی و زاویه دو بردار',name_en:'Vector Dot Product and Angle',category_path:['ریاضیات','جبر خطی'],tags:['بردار','ضرب داخلی','زاویه'],description_fa:'ضرب داخلی، اندازه‌ها و زاویه بین دو بردار هم‌بعد.',formula_latex:'\\mathbf{a}\\cdot\\mathbf{b}=\\|a\\|\\|b\\|\\cos\\theta',variables:[text('a','مولفه‌های a با کاما','Components of a','1,0,0'),text('b','مولفه‌های b با کاما','Components of b','0,1,0')],tests:[
    {input:{a:'1,0,0',b:'0,1,0'},expected:{dot:0,angle_degrees:90}},
    {input:{a:'1,2',b:'3,4'},expected:{dot:11}},
    {input:{a:'-1,0',b:'1,0'},expected:{dot:-1,angle_degrees:180}},
    {input:{a:'1,2,2',b:'2,1,2'},expected:{dot:8,angle_degrees:27.266}},
  ],compute({a,b}){const x=parseList(a),y=parseList(b);if(x.length!==y.length)throw new Error('بردارها باید هم‌بعد باشند');const dot=x.reduce((s,v,i)=>s+v*y[i],0),na=Math.hypot(...x),nb=Math.hypot(...y);if(!na||!nb)throw new Error('زاویه با بردار صفر تعریف نشده است');const angle=Math.acos(Math.max(-1,Math.min(1,dot/(na*nb))))*180/Math.PI;return out({dot:round(dot),norm_a:round(na),norm_b:round(nb),angle_degrees:round(angle)},[`a·b = ${round(dot)}`,`θ = arccos((a·b)/(‖a‖‖b‖)) = ${round(angle)}°`]);}}),

  make({id:'determinant_3x3',name_fa:'دترمینان ماتریس ۳×۳',name_en:'3×3 Matrix Determinant',category_path:['ریاضیات','جبر خطی'],tags:['ماتریس','دترمینان'],description_fa:'محاسبه دترمینان ماتریس ۳×۳ با بسط سطر اول.',formula_latex:'\\det A=a(ei-fh)-b(di-fg)+c(dh-eg)',variables:[number('a','a₁₁','a₁₁',null,1),number('b','a₁₂','a₁₂',null,2),number('c','a₁₃','a₁₃',null,3),number('d','a₂₁','a₂₁',null,0),number('e','a₂₂','a₂₂',null,1),number('f','a₂₃','a₂₃',null,4),number('g','a₃₁','a₃₁',null,5),number('h','a₃₂','a₃₂',null,6),number('i','a₃₃','a₃₃',null,0)],tests:[
    {input:{a:1,b:0,c:0,d:0,e:1,f:0,g:0,h:0,i:1},expected:{determinant:1}},
    {input:{a:1,b:2,c:3,d:0,e:1,f:4,g:5,h:6,i:0},expected:{determinant:1}},
    {input:{a:2,b:0,c:0,d:0,e:3,f:0,g:0,h:0,i:4},expected:{determinant:24}},
    {input:{a:0,b:0,c:0,d:0,e:0,f:0,g:0,h:0,i:0},expected:{determinant:0}},
  ],compute({a,b,c,d,e,f,g,h,i}){const det=a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g);return out({determinant:round(det)},[`بسط لاپلاس در سطر اول`,`det(A) = ${round(det)}`]);}}),

  make({id:'matrix_multiply_2x2',name_fa:'ضرب دو ماتریس ۲×۲',name_en:'2×2 Matrix Multiplication',category_path:['ریاضیات','جبر خطی'],tags:['ماتریس','ضرب'],description_fa:'ضرب دو ماتریس مربعی ۲×۲ و نمایش هر چهار درایه حاصل.',formula_latex:'\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}\\begin{pmatrix}e&f\\\\g&h\\end{pmatrix}',variables:[number('a','A₁₁','A₁₁',null,1),number('b','A₁₂','A₁₂',null,2),number('c','A₂₁','A₂₁',null,3),number('d','A₂₂','A₂₂',null,4),number('e','B₁₁','B₁₁',null,5),number('f','B₁₂','B₁₂',null,6),number('g','B₂₁','B₂₁',null,7),number('h','B₂₂','B₂₂',null,8)],tests:[
    {input:{a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8},expected:{c11:19,c12:22,c21:43,c22:50}},
    {input:{a:1,b:0,c:0,d:1,e:2,f:3,g:4,h:5},expected:{c11:2,c12:3,c21:4,c22:5}},
    {input:{a:2,b:0,c:0,d:2,e:3,f:0,g:0,h:3},expected:{c11:6,c12:0,c21:0,c22:6}},
    {input:{a:0,b:1,c:1,d:0,e:1,f:0,g:0,h:1},expected:{c11:0,c12:1,c21:1,c22:0}},
  ],compute({a,b,c,d,e,f,g,h}){const c11=a*e+b*g,c12=a*f+b*h,c21=c*e+d*g,c22=c*f+d*h;return out({c11:round(c11),c12:round(c12),c21:round(c21),c22:round(c22),matrix:`[[${round(c11)}, ${round(c12)}], [${round(c21)}, ${round(c22)}]]`},['درایه‌های حاصل با ضرب سطر در ستون محاسبه شدند',`AB = [[${round(c11)}, ${round(c12)}], [${round(c21)}, ${round(c22)}]]`]);}}),

  make({id:'polynomial_horner',name_fa:'ارزیابی چندجمله‌ای به روش هورنر',name_en:'Polynomial Evaluation by Horner',category_path:['ریاضیات','جبر'],tags:['هورنر','چندجمله‌ای'],description_fa:'ارزیابی چندجمله‌ای با ضرایب مرتب‌شده از درجه بالا تا جمله ثابت.',formula_latex:'a_nx^n+\\cdots+a_1x+a_0',variables:[text('coefficients','ضرایب از درجه بالا (با کاما)','Coefficients, highest degree first','1,-3,2'),number('x','مقدار x','x value',null,3)],tests:[
    {input:{coefficients:'1,-3,2',x:3},expected:{value:2,degree:2}},
    {input:{coefficients:'2,0,1',x:2},expected:{value:9,degree:2}},
    {input:{coefficients:'5',x:9},expected:{value:5,degree:0}},
    {input:{coefficients:'1,-1,1,-1',x:2},expected:{value:5,degree:3}},
  ],compute({coefficients,x}){const cs=parseList(coefficients);let value=0;for(const coefficient of cs)value=value*x+coefficient;return out({value:round(value),degree:cs.length-1},[`روش هورنر روی ${cs.length} ضریب`,`P(${x}) = ${round(value)}`]);}}),

  make({id:'distance_3d',name_fa:'فاصله دو نقطه در فضای سه‌بعدی',name_en:'3D Point Distance',category_path:['ریاضیات','هندسه و مثلثات'],tags:['فاصله','مختصات','سه‌بعدی'],description_fa:'فاصله اقلیدسی و نقطه میانی دو نقطه در فضای سه‌بعدی.',formula_latex:'d=\\sqrt{(x_2-x_1)^2+(y_2-y_1)^2+(z_2-z_1)^2}',variables:[number('x1','x₁','x₁',null,0),number('y1','y₁','y₁',null,0),number('z1','z₁','z₁',null,0),number('x2','x₂','x₂',null,1),number('y2','y₂','y₂',null,2),number('z2','z₂','z₂',null,2)],tests:[
    {input:{x1:0,y1:0,z1:0,x2:1,y2:2,z2:2},expected:{distance:3}},
    {input:{x1:1,y1:1,z1:1,x2:1,y2:1,z2:1},expected:{distance:0}},
    {input:{x1:-1,y1:2,z1:0,x2:2,y2:-2,z2:12},expected:{distance:13}},
    {input:{x1:0,y1:0,z1:0,x2:3,y2:4,z2:12},expected:{distance:13}},
  ],compute({x1,y1,z1,x2,y2,z2}){const distance=Math.hypot(x2-x1,y2-y1,z2-z1);return out({distance:round(distance),mid_x:round((x1+x2)/2),mid_y:round((y1+y2)/2),mid_z:round((z1+z2)/2)},[`اختلاف مؤلفه‌ها: Δx=${x2-x1}، Δy=${y2-y1}، Δz=${z2-z1}`,`d = √(Δx²+Δy²+Δz²) = ${round(distance)}`]);}}),

  make({id:'line_slope',name_fa:'شیب و معادله خط از دو نقطه',name_en:'Line Slope from Two Points',category_path:['ریاضیات','هندسه و مثلثات'],tags:['خط','شیب','هندسه تحلیلی'],description_fa:'شیب و عرض از مبدأ خط گذرنده از دو نقطه.',formula_latex:'m=\\frac{y_2-y_1}{x_2-x_1},\\quad y=mx+b',variables:[number('x1','x₁','x₁',null,1),number('y1','y₁','y₁',null,2),number('x2','x₂','x₂',null,3),number('y2','y₂','y₂',null,6)],tests:[
    {input:{x1:1,y1:2,x2:3,y2:6},expected:{slope:2,intercept:0}},
    {input:{x1:0,y1:1,x2:2,y2:5},expected:{slope:2,intercept:1}},
    {input:{x1:-1,y1:4,x2:1,y2:0},expected:{slope:-2,intercept:2}},
    {input:{x1:2,y1:3,x2:5,y2:3},expected:{slope:0,intercept:3}},
  ],compute({x1,y1,x2,y2}){if(x1===x2)throw new Error('خط عمودی شیب تعریف‌شده ندارد');const slope=(y2-y1)/(x2-x1),intercept=y1-slope*x1;return out({slope:round(slope),intercept:round(intercept)},[`m = (y₂−y₁)/(x₂−x₁) = ${round(slope)}`,`b = y₁−mx₁ = ${round(intercept)}`,`معادله: y = ${round(slope)}x + ${round(intercept)}`]);}}),

  make({id:'triangle_sas_area',name_fa:'مساحت مثلث با دو ضلع و زاویه محصور',name_en:'Triangle Area from SAS',category_path:['ریاضیات','هندسه و مثلثات'],tags:['مثلث','مساحت','قانون کسینوس'],description_fa:'محاسبه مساحت و ضلع سوم مثلث از دو ضلع و زاویه بین آن‌ها.',formula_latex:'K=\\frac12 ab\\sin C,\\quad c=\\sqrt{a^2+b^2-2ab\\cos C}',variables:[number('a','ضلع a','Side a',null,3),number('b','ضلع b','Side b',null,4),number('C','زاویه محصور (درجه)','Included angle (degrees)','angle',90)],tests:[
    {input:{a:3,b:4,C:90},expected:{area:6,side_c:5}},
    {input:{a:5,b:5,C:60},expected:{area:10.825318,side_c:5}},
    {input:{a:6,b:8,C:30},expected:{area:12}},
    {input:{a:10,b:7,C:120},expected:{side_c:14.798649}},
  ],compute({a,b,C}){if(a<=0||b<=0||C<=0||C>=180)throw new Error('ضلع‌ها باید مثبت و زاویه بین ۰ و ۱۸۰ درجه باشد');const rad=C*Math.PI/180,area=.5*a*b*Math.sin(rad),side_c=Math.sqrt(Math.max(0,a*a+b*b-2*a*b*Math.cos(rad)));return out({area:round(area),side_c:round(side_c)},[`مساحت = ½ab sin(C) = ${round(area)}`,`قانون کسینوس: c = √(a²+b²−2ab cos(C)) = ${round(side_c)}`]);}}),

  make({id:'circle_sector',name_fa:'قطاع دایره، کمان و وتر',name_en:'Circle Sector, Arc and Chord',category_path:['ریاضیات','هندسه و مثلثات'],tags:['دایره','قطاع','کمان'],description_fa:'محاسبه مساحت قطاع، طول کمان و طول وتر از شعاع و زاویه مرکزی.',formula_latex:'A=\\frac{\\theta}{360^\\circ}\\pi r^2,\\quad s=r\\theta',variables:[number('radius','شعاع r','Radius r',null,3),number('theta','زاویه مرکزی (درجه)','Central angle (degrees)','angle',90)],tests:[
    {input:{radius:3,theta:90},expected:{sector_area:7.068583,arc_length:4.712389,chord:4.242641}},
    {input:{radius:1,theta:360},expected:{sector_area:3.141593,arc_length:6.283185,chord:0}},
    {input:{radius:2,theta:180},expected:{sector_area:6.283185,arc_length:6.283185,chord:4}},
    {input:{radius:5,theta:72},expected:{sector_area:15.707963,arc_length:6.283185,chord:5.877853}},
  ],compute({radius,theta}){if(radius<0||theta<0||theta>360)throw new Error('شعاع نامنفی و زاویه بین ۰ تا ۳۶۰ درجه لازم است');const rad=theta*Math.PI/180;return out({sector_area:round(theta/360*Math.PI*radius**2),arc_length:round(radius*rad),chord:round(2*radius*Math.sin(rad/2))},[`مساحت قطاع = (θ/360°)πr² = ${round(theta/360*Math.PI*radius**2)}`,`طول کمان = rθ = ${round(radius*rad)}`,`طول وتر = 2r sin(θ/2) = ${round(2*radius*Math.sin(rad/2))}`]);}}),

  make({id:'ellipse_geometry',name_fa:'مساحت و محیط بیضی',name_en:'Ellipse Area and Perimeter',category_path:['ریاضیات','هندسه و مثلثات'],tags:['بیضی','مساحت','محیط'],description_fa:'محاسبه مساحت، خروج از مرکز و تقریب رامانوجان برای محیط بیضی.',formula_latex:'A=\\pi ab,\\quad e=\\sqrt{1-b^2/a^2}',variables:[number('a','نیم‌محور اول a','Semi-axis a',null,3),number('b','نیم‌محور دوم b','Semi-axis b',null,2)],tests:[
    {input:{a:3,b:2},expected:{area:18.849556,eccentricity:0.745356}},
    {input:{a:1,b:1},expected:{area:3.141593,eccentricity:0,perimeter:6.283185}},
    {input:{a:5,b:3},expected:{area:47.12389}},
    {input:{a:10,b:4},expected:{area:125.663706}},
  ],compute({a,b}){if(a<=0||b<=0)throw new Error('نیم‌محورها باید مثبت باشند');const major=Math.max(a,b),minor=Math.min(a,b),area=Math.PI*a*b,e=Math.sqrt(1-(minor/major)**2),h=((a-b)/(a+b))**2,perimeter=Math.PI*(a+b)*(1+3*h/(10+Math.sqrt(4-3*h)));return out({area:round(area),perimeter:round(perimeter),eccentricity:round(e)},[`مساحت = πab = ${round(area)}`,`محیط (تقریب رامانوجان) ≈ ${round(perimeter)}`,`خروج از مرکز e = ${round(e)}`]);}}),

  make({id:'cone_geometry',name_fa:'حجم و مساحت مخروط قائم',name_en:'Right Cone Geometry',category_path:['ریاضیات','هندسه و مثلثات'],tags:['مخروط','حجم','مساحت'],description_fa:'محاسبه حجم، ارتفاع مایل و مساحت جانبی و کل مخروط قائم.',formula_latex:'V=\\frac13\\pi r^2h,\\quad s=\\sqrt{r^2+h^2}',variables:[number('radius','شعاع قاعده r','Base radius r',null,3),number('height','ارتفاع h','Height h',null,4)],tests:[
    {input:{radius:3,height:4},expected:{volume:37.699112,slant_height:5,lateral_area:47.12389,total_area:75.398224}},
    {input:{radius:1,height:1},expected:{volume:1.047198}},
    {input:{radius:2,height:2},expected:{volume:8.37758}},
    {input:{radius:4,height:3},expected:{volume:50.265482,slant_height:5}},
  ],compute({radius,height}){if(radius<=0||height<=0)throw new Error('شعاع و ارتفاع باید مثبت باشند');const slant=Math.hypot(radius,height),volume=Math.PI*radius**2*height/3,lateral=Math.PI*radius*slant,total=lateral+Math.PI*radius**2;return out({volume:round(volume),slant_height:round(slant),lateral_area:round(lateral),total_area:round(total)},[`ارتفاع مایل s = √(r²+h²) = ${round(slant)}`,`حجم = πr²h/3 = ${round(volume)}`,`مساحت جانبی / کل = ${round(lateral)} / ${round(total)}`]);}}),

  make({id:'cylinder_geometry',name_fa:'حجم و مساحت استوانه',name_en:'Cylinder Geometry',category_path:['ریاضیات','هندسه و مثلثات'],tags:['استوانه','حجم','مساحت'],description_fa:'محاسبه حجم، مساحت جانبی و مساحت کل استوانه قائم.',formula_latex:'V=\\pi r^2h,\\quad A_{total}=2\\pi r(h+r)',variables:[number('radius','شعاع r','Radius r',null,2),number('height','ارتفاع h','Height h',null,3)],tests:[
    {input:{radius:1,height:1},expected:{volume:3.141593,lateral_area:6.283185,total_area:12.566371}},
    {input:{radius:2,height:3},expected:{volume:37.699112,lateral_area:37.699112,total_area:62.831853}},
    {input:{radius:3,height:0.5},expected:{volume:14.137167}},
    {input:{radius:0.5,height:8},expected:{volume:6.283185}},
  ],compute({radius,height}){if(radius<=0||height<=0)throw new Error('شعاع و ارتفاع باید مثبت باشند');const volume=Math.PI*radius**2*height,lateral=2*Math.PI*radius*height,total=lateral+2*Math.PI*radius**2;return out({volume:round(volume),lateral_area:round(lateral),total_area:round(total)},[`حجم = πr²h = ${round(volume)}`,`مساحت جانبی = 2πrh = ${round(lateral)}`,`مساحت کل = 2πr(h+r) = ${round(total)}`]);}}),

  make({id:'trapezoidal_integral',name_fa:'انتگرال عددی ذوزنقه‌ای',name_en:'Composite Trapezoidal Integral',category_path:['ریاضیات','حساب دیفرانسیل'],tags:['انتگرال','ذوزنقه‌ای','عددگرایی'],description_fa:'تقریب انتگرال معین با قاعده ذوزنقه‌ای مرکب و پارسر امن سمت کاربر.',formula_latex:'\\int_a^b f(x)dx\\approx h[\\frac{f(a)+f(b)}2+\\sum f(x_i)]',variables:[text('expression','تابع f(x)','Function f(x)','x^2'),number('a','حد پایین a','Lower bound a',null,0),number('b','حد بالا b','Upper bound b',null,1),number('n','تعداد زیربازه‌ها','Subintervals',null,1000)],tests:[
    {input:{expression:'x^2',a:0,b:1,n:1000},expected:{integral:0.333334}},
    {input:{expression:'2*x+1',a:0,b:4,n:100},expected:{integral:20}},
    {input:{expression:'sin(x)',a:0,b:Math.PI,n:2000},expected:{integral:2}},
    {input:{expression:'7',a:-2,b:3,n:10},expected:{integral:35}},
  ],compute({expression,a,b,n}){if(!Number.isInteger(n)||n<1||n>100000)throw new Error('تعداد زیربازه‌ها باید بین ۱ تا ۱۰۰۰۰۰ باشد');const h=(b-a)/n;let sum=(evaluate(expression,{x:a})+evaluate(expression,{x:b}))/2;for(let i=1;i<n;i++)sum+=evaluate(expression,{x:a+i*h});const integral=sum*h;return out({integral:round(integral,8),subintervals:n},[`گام شبکه h = (b−a)/n = ${round(h,8)}`,`قاعده ذوزنقه‌ای با n=${n}`,`انتگرال ≈ ${round(integral,8)}`]);}}),

  make({id:'numeric_derivative',name_fa:'مشتق عددی تفاضل مرکزی',name_en:'Central Difference Derivative',category_path:['ریاضیات','حساب دیفرانسیل'],tags:['مشتق','تفاضل مرکزی','عددگرایی'],description_fa:'تقریب مشتق در نقطه با فرمول تفاضل مرکزی مرتبه دوم.',formula_latex:'f\\prime(x)\\approx\\frac{f(x+h)-f(x-h)}{2h}',variables:[text('expression','تابع f(x)','Function f(x)','x^3'),number('x','نقطه x','Point x',null,2),number('h','گام h (مثبت)','Step h (>0)',null,0.00001)],tests:[
    {input:{expression:'x^3',x:2,h:0.00001},expected:{derivative:12}},
    {input:{expression:'sin(x)',x:0,h:0.00001},expected:{derivative:1}},
    {input:{expression:'x^2',x:3,h:0.00001},expected:{derivative:6}},
    {input:{expression:'exp(x)',x:0,h:0.00001},expected:{derivative:1}},
  ],compute({expression,x,h}){if(h<=0||h>0.1)throw new Error('گام h باید مثبت و حداکثر ۰٫۱ باشد');const derivative=(evaluate(expression,{x:x+h})-evaluate(expression,{x:x-h}))/(2*h);return out({derivative:round(derivative,8),step:h},[`f′(${x}) ≈ [f(${x}+h)−f(${x}−h)]/(2h)`,`تفاضل مرکزی = ${round(derivative,8)}`]);}}),

  make({id:'finance_effective_rate',name_fa:'نرخ بهره مؤثر سالانه',name_en:'Effective Annual Interest Rate',category_path:['مالی و اقتصاد','بهره و وام'],tags:['بهره','نرخ مؤثر','مالی'],description_fa:'تبدیل نرخ اسمی سالانه به نرخ مؤثر با تعداد دوره‌های ترکیب در سال.',formula_latex:'i_{eff}=(1+j/m)^m-1',variables:[number('nominal_rate','نرخ اسمی سالانه (درصد)','Nominal annual rate (%)',null,6),number('periods','دوره‌های ترکیب در سال','Compounding periods per year',null,12)],tests:[
    {input:{nominal_rate:6,periods:12},expected:{effective_rate_percent:6.1678}},
    {input:{nominal_rate:8,periods:1},expected:{effective_rate_percent:8}},
    {input:{nominal_rate:12,periods:4},expected:{effective_rate_percent:12.5509}},
    {input:{nominal_rate:10,periods:2},expected:{effective_rate_percent:10.25}},
  ],compute({nominal_rate,periods}){if(nominal_rate<0||!Number.isInteger(periods)||periods<1)throw new Error('نرخ نامنفی و تعداد دوره صحیح مثبت لازم است');const rate=((1+nominal_rate/100/periods)**periods-1)*100;return out({effective_rate_percent:round(rate,8)},[`نرخ دوره‌ای = j/m = ${round(nominal_rate/periods,8)}٪`,`نرخ مؤثر = (1+j/m)^m−1 = ${round(rate,8)}٪`]);}}),

  make({id:'z_score',name_fa:'نمره استاندارد z',name_en:'Z-Score Standardization',category_path:['ریاضیات','آمار و احتمال'],tags:['z-score','استانداردسازی','آمار'],description_fa:'تبدیل مشاهده به نمره استاندارد برحسب میانگین و انحراف معیار.',formula_latex:'z=\\frac{x-\\mu}{\\sigma}',variables:[number('x','مشاهده x','Observation x',null,85),number('mean','میانگین μ','Mean μ',null,70),number('sigma','انحراف معیار σ (مثبت)','Standard deviation σ (>0)',null,10)],tests:[
    {input:{x:85,mean:70,sigma:10},expected:{z_score:1.5}},
    {input:{x:10,mean:20,sigma:5},expected:{z_score:-2}},
    {input:{x:0,mean:0,sigma:1},expected:{z_score:0}},
    {input:{x:110,mean:100,sigma:15},expected:{z_score:0.666667}},
  ],compute({x,mean,sigma}){if(sigma<=0)throw new Error('انحراف معیار باید مثبت باشد');const z=(x-mean)/sigma;return out({z_score:round(z),interpretation:`${round(z)} انحراف معیار از میانگین`},[`z = (x−μ)/σ = (${x}−${mean})/${sigma}`,`z = ${round(z)}`]);}}),

  make({id:'sample_descriptive_stats',name_fa:'آمار توصیفی نمونه',name_en:'Sample Descriptive Statistics',category_path:['ریاضیات','آمار و احتمال'],tags:['میانگین','میانه','واریانس'],description_fa:'میانگین، میانه، واریانس نمونه و انحراف معیار نمونه از داده‌ها.',formula_latex:'s^2=\\frac{\\sum_i(x_i-\\bar{x})^2}{n-1}',variables:[text('data','داده‌ها (با کاما)','Data (comma-separated)','1,2,3')],tests:[
    {input:{data:'1,2,3'},expected:{mean:2,median:2,sample_variance:1}},
    {input:{data:'2,4,6,8'},expected:{mean:5,median:5,sample_variance:6.666667}},
    {input:{data:'1,1,1,1'},expected:{mean:1,median:1,sample_variance:0}},
    {input:{data:'1,2,3,4,5'},expected:{mean:3,median:3,sample_variance:2.5}},
  ],compute({data}){const xs=parseList(data).sort((a,b)=>a-b),n=xs.length;if(n<2)throw new Error('برای واریانس نمونه دست‌کم دو مشاهده لازم است');const mean=xs.reduce((a,b)=>a+b,0)/n,median=n%2?xs[(n-1)/2]:(xs[n/2-1]+xs[n/2])/2,variance=xs.reduce((s,x)=>s+(x-mean)**2,0)/(n-1),pop=variance*(n-1)/n;return out({count:n,mean:round(mean),median:round(median),sample_variance:round(variance),sample_stddev:round(Math.sqrt(variance)),population_variance:round(pop)},[`تعداد داده‌ها n = ${n}`,`میانگین = ${round(mean)}، میانه = ${round(median)}`,`واریانس نمونه s² = ${round(variance)}`]);}}),

  make({id:'simple_linear_regression',name_fa:'رگرسیون خطی ساده',name_en:'Simple Linear Regression',category_path:['ریاضیات','آمار و احتمال'],tags:['رگرسیون','کمترین مربعات'],description_fa:'برازش y=mx+b به داده‌های دوبعدی با روش کمترین مربعات.',formula_latex:'m=\\frac{\\sum(x_i-\\bar{x})(y_i-\\bar{y})}{\\sum(x_i-\\bar{x})^2},\\quad y=mx+b',variables:[text('xs','مقادیر x با کاما','x values','1,2,3'),text('ys','مقادیر y با کاما','y values','2,4,6')],tests:[
    {input:{xs:'1,2,3',ys:'2,4,6'},expected:{slope:2,intercept:0,r_squared:1}},
    {input:{xs:'0,1,2',ys:'1,1,3'},expected:{slope:1,intercept:0.666667,r_squared:0.75}},
    {input:{xs:'1,2,3,4',ys:'1,4,9,16'},expected:{slope:5,intercept:-5,r_squared:0.968992}},
    {input:{xs:'2,4,6',ys:'5,5,5'},expected:{slope:0,intercept:5,r_squared:1}},
  ],compute({xs,ys}){const x=parseList(xs),y=parseList(ys);if(x.length!==y.length||x.length<2)throw new Error('دو فهرست هم‌اندازه با دست‌کم دو داده لازم است');const mx=x.reduce((a,b)=>a+b,0)/x.length,my=y.reduce((a,b)=>a+b,0)/y.length,sxx=x.reduce((s,v)=>s+(v-mx)**2,0);if(!sxx)throw new Error('داده‌های x نباید همگی برابر باشند');const sxy=x.reduce((s,v,i)=>s+(v-mx)*(y[i]-my),0),slope=sxy/sxx,intercept=my-slope*mx,sst=y.reduce((s,v)=>s+(v-my)**2,0),sse=y.reduce((s,v,i)=>s+(v-(slope*x[i]+intercept))**2,0),r2=sst===0?(sse===0?1:0):1-sse/sst;return out({slope:round(slope),intercept:round(intercept),r_squared:round(r2)},[`m = Sxy/Sxx = ${round(slope)}`,`b = ȳ−m x̄ = ${round(intercept)}`,`R² = ${round(r2)}`]);}}),

  make({id:'binomial_probability',name_fa:'احتمال دوجمله‌ای',name_en:'Binomial Probability',category_path:['ریاضیات','آمار و احتمال'],tags:['دوجمله‌ای','احتمال'],description_fa:'احتمال دقیق k موفقیت در n آزمایش مستقل با احتمال موفقیت p.',formula_latex:'P(X=k)=\\binom{n}{k}p^k(1-p)^{n-k}',variables:[number('n','تعداد آزمایش‌ها n','Number of trials n',null,5),number('k','تعداد موفقیت‌ها k','Successes k',null,2),number('p','احتمال موفقیت p (۰ تا ۱)','Success probability p (0–1)',null,0.5)],tests:[
    {input:{n:5,k:2,p:0.5},expected:{probability:0.3125}},
    {input:{n:10,k:0,p:0.2},expected:{probability:0.107374}},
    {input:{n:4,k:4,p:0.25},expected:{probability:0.003906}},
    {input:{n:20,k:1,p:0.1},expected:{probability:0.27017}},
  ],compute({n,k,p}){if(!Number.isInteger(n)||n<0||n>170||!Number.isInteger(k)||k<0||k>n||p<0||p>1)throw new Error('پارامترهای دوجمله‌ای خارج از دامنه‌اند');let choose=1;for(let i=1;i<=Math.min(k,n-k);i++)choose=choose*(n-i+1)/i;const probability=choose*p**k*(1-p)**(n-k);return out({probability:round(probability,10)},[`ترکیب C(n,k) = ${round(choose,8)}`,`P(X=k) = C(n,k)p^k(1−p)^(n−k) = ${round(probability,10)}`]);}}),

  make({id:'bayes_test',name_fa:'قضیه بیز برای آزمون تشخیصی',name_en:'Bayes Theorem for a Diagnostic Test',category_path:['ریاضیات','آمار و احتمال'],tags:['بیز','حساسیت','ویژگی'],description_fa:'احتمال بیماری پس از نتیجه مثبت برحسب شیوع، حساسیت و نرخ مثبت کاذب.',formula_latex:'P(D|+)=\\frac{Se\\,P(D)}{SeP(D)+FPR(1-P(D))}',variables:[number('prior','شیوع / احتمال پیشین','Prior prevalence',null,0.01),number('sensitivity','حساسیت آزمون','Test sensitivity',null,0.99),number('false_positive','نرخ مثبت کاذب','False-positive rate',null,0.05)],tests:[
    {input:{prior:0.01,sensitivity:0.99,false_positive:0.05},expected:{posterior_positive:0.166667}},
    {input:{prior:0.1,sensitivity:0.8,false_positive:0.1},expected:{posterior_positive:0.470588}},
    {input:{prior:0.5,sensitivity:0.9,false_positive:0.1},expected:{posterior_positive:0.9}},
    {input:{prior:0.02,sensitivity:0.95,false_positive:0.02},expected:{posterior_positive:0.492228}},
  ],compute({prior,sensitivity,false_positive}){if([prior,sensitivity,false_positive].some(x=>x<0||x>1))throw new Error('احتمال‌ها باید بین صفر و یک باشند');const positive=sensitivity*prior+false_positive*(1-prior);if(!positive)throw new Error('احتمال مشاهده نتیجه مثبت صفر است');const posterior=sensitivity*prior/positive;return out({posterior_positive:round(posterior),positive_predictive_percent:round(100*posterior)},[`P(+) = Se·P(D)+FPR·P(¬D) = ${round(positive)}`,`P(D|+) = Se·P(D)/P(+) = ${round(posterior)}`]);}}),

  make({id:'poisson_probability',name_fa:'احتمال پواسون',name_en:'Poisson Probability',category_path:['ریاضیات','آمار و احتمال'],tags:['پواسون','احتمال'],description_fa:'احتمال وقوع k رویداد در بازه‌ای با نرخ میانگین λ.',formula_latex:'P(X=k)=e^{-\\lambda}\\lambda^k/k!',variables:[number('lambda','میانگین λ (مثبت)','Mean rate λ (>0)',null,3),number('k','تعداد رویداد k','Event count k',null,2)],tests:[
    {input:{lambda:3,k:0},expected:{probability:0.049787}},
    {input:{lambda:2,k:2},expected:{probability:0.270671}},
    {input:{lambda:4,k:1},expected:{probability:0.073263}},
    {input:{lambda:5,k:5},expected:{probability:0.175467}},
  ],compute({lambda:rate,k}){if(rate<0||!Number.isInteger(k)||k<0||k>170)throw new Error('λ نامنفی و k عدد صحیح بین ۰ و ۱۷۰ لازم است');const probability=Math.exp(-rate)*rate**k/factorial(k);return out({probability:round(probability,10)},[`P(X=k)=e^(−λ)λ^k/k!`,`P(X=${k}) = ${round(probability,10)}`]);}}),

  make({id:'independent_union_probability',name_fa:'احتمال اجتماع دو پیشامد مستقل',name_en:'Union Probability for Independent Events',category_path:['ریاضیات','آمار و احتمال'],tags:['احتمال','استقلال','اجتماع'],description_fa:'محاسبه احتمال اجتماع و اشتراک دو پیشامد مستقل.',formula_latex:'P(A\\cup B)=P(A)+P(B)-P(A)P(B)',variables:[number('p_a','احتمال P(A)','Probability P(A)',null,0.2),number('p_b','احتمال P(B)','Probability P(B)',null,0.3)],tests:[
    {input:{p_a:0.2,p_b:0.3},expected:{union_probability:0.44,intersection_probability:0.06}},
    {input:{p_a:0.5,p_b:0.5},expected:{union_probability:0.75,intersection_probability:0.25}},
    {input:{p_a:1,p_b:0},expected:{union_probability:1,intersection_probability:0}},
    {input:{p_a:0.1,p_b:0.1},expected:{union_probability:0.19,intersection_probability:0.01}},
  ],compute({p_a,p_b}){if([p_a,p_b].some(p=>p<0||p>1))throw new Error('احتمال باید بین صفر و یک باشد');const intersection=p_a*p_b,union=p_a+p_b-intersection;return out({union_probability:round(union),intersection_probability:round(intersection)},[`استقلال: P(A∩B)=P(A)P(B)=${round(intersection)}`,`P(A∪B)=P(A)+P(B)−P(A∩B)=${round(union)}`]);}}),

  make({id:'projectile_motion',name_fa:'حرکت پرتابی بدون مقاومت هوا',name_en:'Projectile Motion without Air Resistance',category_path:['فیزیک','مکانیک کلاسیک'],tags:['پرتابه','سینماتیک','برد'],description_fa:'برد، زمان پرواز و بیشینه ارتفاع برای پرتابه‌ای از سطح زمین.',formula_latex:'R=\\frac{v_0^2\\sin(2\\theta)}g,\\quad t=\\frac{2v_0\\sin\\theta}g',variables:[number('speed','سرعت اولیه v₀','Initial speed v₀',null,20),number('angle','زاویه پرتاب (درجه)','Launch angle (degrees)','angle',30),number('gravity','شتاب گرانش g (مثبت)','Gravity g (>0)','acceleration',9.8)],tests:[
    {input:{speed:20,angle:30,gravity:9.8},expected:{range:35.346,flight_time:2.040816,max_height:5.102041}},
    {input:{speed:10,angle:45,gravity:10},expected:{range:10,flight_time:1.414214,max_height:2.5}},
    {input:{speed:15,angle:0,gravity:9.81},expected:{range:0,flight_time:0,max_height:0}},
    {input:{speed:10,angle:30,gravity:10},expected:{range:8.660254,flight_time:1,max_height:1.25}},
  ],compute({speed,angle,gravity}){if(speed<0||gravity<=0||angle<0||angle>90)throw new Error('سرعت نامنفی، گرانش مثبت و زاویه بین ۰ تا ۹۰ درجه لازم است');const t=2*speed*Math.sin(angle*Math.PI/180)/gravity,range=speed**2*Math.sin(2*angle*Math.PI/180)/gravity,height=speed**2*Math.sin(angle*Math.PI/180)**2/(2*gravity);return out({range:round(range),flight_time:round(t),max_height:round(height)},[`زمان پرواز = 2v₀ sinθ/g = ${round(t)} s`,`برد = v₀² sin(2θ)/g = ${round(range)} m`,`بیشینه ارتفاع = v₀² sin²θ/(2g) = ${round(height)} m`]);}}),

  make({id:'momentum_impulse',name_fa:'تکانه و ضربه خطی',name_en:'Linear Momentum and Impulse',category_path:['فیزیک','مکانیک کلاسیک'],tags:['تکانه','ضربه','برخورد'],description_fa:'تکانه اولیه، ضربه نیروی ثابت و تکانه و سرعت نهایی در یک راستا.',formula_latex:'p=mv,\\quad J=F\\Delta t=\\Delta p',variables:[number('mass','جرم m (kg)','Mass m (kg)','mass',2),number('velocity','سرعت اولیه v (m/s)','Initial velocity v (m/s)',null,3),number('force','نیروی خالص F (N)','Net force F (N)',null,4),number('time','مدت اثر نیرو Δt (s)','Force duration Δt (s)','time',5)],tests:[
    {input:{mass:2,velocity:3,force:4,time:5},expected:{momentum:6,impulse:20,final_velocity:13}},
    {input:{mass:1,velocity:0,force:10,time:2},expected:{momentum:0,impulse:20,final_velocity:20}},
    {input:{mass:3,velocity:-2,force:0,time:4},expected:{momentum:-6,impulse:0,final_velocity:-2}},
    {input:{mass:0.5,velocity:10,force:-1,time:1},expected:{momentum:5,impulse:-1,final_velocity:8}},
  ],compute({mass,velocity,force,time}){if(mass<=0||time<0)throw new Error('جرم باید مثبت و زمان نامنفی باشد');const momentum=mass*velocity,impulse=force*time,final_momentum=momentum+impulse,final_velocity=final_momentum/mass;return out({momentum:round(momentum),impulse:round(impulse),final_momentum:round(final_momentum),final_velocity:round(final_velocity)},[`تکانه اولیه p=mv=${round(momentum)} kg·m/s`,`ضربه J=FΔt=${round(impulse)} N·s`,`تکانه نهایی p+J=${round(final_momentum)}؛ سرعت نهایی=${round(final_velocity)} m/s`]);}}),

  make({id:'kinetic_energy_momentum',name_fa:'انرژی جنبشی و تکانه',name_en:'Kinetic Energy and Momentum',category_path:['فیزیک','مکانیک کلاسیک'],tags:['انرژی جنبشی','تکانه'],description_fa:'محاسبه انرژی جنبشی و تکانه جسم در مکانیک کلاسیک.',formula_latex:'K=\\frac12mv^2,\\quad p=mv',variables:[number('mass','جرم m (kg)','Mass m (kg)','mass',2),number('speed','تندی v (m/s)','Speed v (m/s)',null,3)],tests:[
    {input:{mass:2,speed:3},expected:{kinetic_energy:9,momentum:6}},
    {input:{mass:1,speed:0},expected:{kinetic_energy:0,momentum:0}},
    {input:{mass:4,speed:5},expected:{kinetic_energy:50,momentum:20}},
    {input:{mass:0.5,speed:10},expected:{kinetic_energy:25,momentum:5}},
  ],compute({mass,speed}){if(mass<0)throw new Error('جرم نمی‌تواند منفی باشد');const energy=.5*mass*speed**2,momentum=mass*speed;return out({kinetic_energy:round(energy),momentum:round(momentum)},[`K=½mv² = ${round(energy)} J`,`p=mv = ${round(momentum)} kg·m/s`]);}}),

  make({id:'gravitation_force',name_fa:'نیروی گرانش نیوتنی',name_en:'Newtonian Gravitational Force',category_path:['فیزیک','مکانیک کلاسیک'],tags:['گرانش','نیوتن','نیرو'],description_fa:'اندازه نیروی گرانشی دو جرم نقطه‌ای با ثابت گرانش جهانی.',formula_latex:'F=G\\frac{m_1m_2}{r^2}',variables:[number('mass1','جرم m₁ (kg)','Mass m₁ (kg)','mass',1),number('mass2','جرم m₂ (kg)','Mass m₂ (kg)','mass',1),number('distance','فاصله r (m، مثبت)','Distance r (m, >0)','length',1)],tests:[
    {input:{mass1:1,mass2:1,distance:1},expected:{force:6.6743e-11}},
    {input:{mass1:1e5,mass2:2e5,distance:2},expected:{force:0.333715}},
    {input:{mass1:1,mass2:1,distance:2},expected:{force:1.668575e-11}},
    {input:{mass1:2,mass2:3,distance:3},expected:{force:4.449533e-11}},
  ],compute({mass1,mass2,distance}){if(mass1<0||mass2<0||distance<=0)throw new Error('جرم‌ها نامنفی و فاصله مثبت لازم است');const G=6.67430e-11,force=G*mass1*mass2/distance**2;return out({force:round(force,8),gravitational_constant:G},[`G = 6.67430×10⁻¹¹ N·m²/kg²`,`F=Gm₁m₂/r² = ${force.toExponential(6)} N`]);}}),

  make({id:'hydrostatic_pressure',name_fa:'فشار هیدرواستاتیک',name_en:'Hydrostatic Pressure',category_path:['فیزیک','مکانیک کلاسیک'],tags:['فشار','سیالات','چگالی'],description_fa:'فشار پیمانه‌ای و مطلق در عمق مشخصی از سیال ساکن.',formula_latex:'p_g=\\rho gh,\\quad p_{abs}=p_{atm}+\\rho gh',variables:[number('density','چگالی ρ (kg/m³)','Density ρ (kg/m³)','density',1000),number('depth','عمق h (m)','Depth h (m)','length',10),number('gravity','شتاب g (m/s²)','Gravity g (m/s²)','acceleration',9.81)],tests:[
    {input:{density:1000,depth:10,gravity:9.81},expected:{gauge_pressure:98100,absolute_pressure:199425}},
    {input:{density:800,depth:5,gravity:10},expected:{gauge_pressure:40000}},
    {input:{density:1000,depth:0,gravity:9.81},expected:{gauge_pressure:0,absolute_pressure:101325}},
    {input:{density:1200,depth:2,gravity:10},expected:{gauge_pressure:24000}},
  ],compute({density,depth,gravity}){if(density<0||depth<0||gravity<0)throw new Error('چگالی، عمق و گرانش باید نامنفی باشند');const gauge=density*gravity*depth,absolute=101325+gauge;return out({gauge_pressure:round(gauge),absolute_pressure:round(absolute)},[`فشار پیمانه‌ای ρgh = ${round(gauge)} Pa`,`فشار مطلق p_atm+ρgh = ${round(absolute)} Pa`]);}}),

  make({id:'pendulum_period',name_fa:'دوره آونگ ساده',name_en:'Simple Pendulum Period',category_path:['فیزیک','مکانیک کلاسیک'],tags:['آونگ','نوسان','دوره'],description_fa:'دوره نوسان آونگ ساده در تقریب زاویه کوچک.',formula_latex:'T=2\\pi\\sqrt{L/g}',variables:[number('length','طول آونگ L (m)','Pendulum length L (m)','length',1),number('gravity','شتاب گرانش g (m/s²)','Gravity g (m/s²)','acceleration',9.81)],tests:[
    {input:{length:1,gravity:9.81},expected:{period:2.006067}},
    {input:{length:1,gravity:Math.PI**2},expected:{period:2}},
    {input:{length:4,gravity:10},expected:{period:3.973836}},
    {input:{length:0.25,gravity:9.8696044},expected:{period:1}},
  ],compute({length,gravity}){if(length<=0||gravity<=0)throw new Error('طول و شتاب گرانش باید مثبت باشند');const period=2*Math.PI*Math.sqrt(length/gravity);return out({period:round(period),frequency:round(1/period)},[`تقریب زاویه کوچک: T=2π√(L/g)`,`دوره T = ${round(period)} s`,`فرکانس f=1/T = ${round(1/period)} Hz`]);}}),

  make({id:'thermal_energy',name_fa:'گرمای محسوس',name_en:'Sensible Heat',category_path:['فیزیک','ترمودینامیک'],tags:['گرما','ظرفیت گرمایی','ترمودینامیک'],description_fa:'گرمای جذب‌شده یا دفع‌شده برحسب جرم، گرمای ویژه و تغییر دما.',formula_latex:'Q=mc_p\\Delta T',variables:[number('mass','جرم m (kg)','Mass m (kg)','mass',2),number('specific_heat','گرمای ویژه cₚ (J/kg·K)','Specific heat cₚ (J/kg·K)',null,4184),number('delta_temperature','تغییر دما ΔT (K)','Temperature change ΔT (K)','temperature_delta',10)],tests:[
    {input:{mass:2,specific_heat:4184,delta_temperature:10},expected:{heat_joules:83680}},
    {input:{mass:0.5,specific_heat:1000,delta_temperature:20},expected:{heat_joules:10000}},
    {input:{mass:1,specific_heat:900,delta_temperature:0},expected:{heat_joules:0}},
    {input:{mass:3,specific_heat:4184,delta_temperature:-5},expected:{heat_joules:-62760}},
  ],compute({mass,specific_heat,delta_temperature}){if(mass<0||specific_heat<0)throw new Error('جرم و گرمای ویژه باید نامنفی باشند');const heat=mass*specific_heat*delta_temperature;return out({heat_joules:round(heat),heat_kilojoules:round(heat/1000)},[`Q=mcₚΔT = ${mass}×${specific_heat}×${delta_temperature}`,`Q = ${round(heat)} J (${round(heat/1000)} kJ)`]);}}),

  make({id:'combined_gas_law',name_fa:'قانون ترکیبی گازها',name_en:'Combined Gas Law',category_path:['شیمی','استوکیومتری'],tags:['گاز','فشار','حجم','دما'],description_fa:'یافتن فشار نهایی با ثابت‌بودن مقدار گاز و رابطه PV/T ثابت.',formula_latex:'\\frac{P_1V_1}{T_1}=\\frac{P_2V_2}{T_2}',variables:[number('p1','فشار اولیه P₁','Initial pressure P₁',null,1),number('v1','حجم اولیه V₁','Initial volume V₁',null,2),number('t1','دمای اولیه T₁ (K)','Initial temperature T₁ (K)','temperature_k',300),number('v2','حجم نهایی V₂','Final volume V₂',null,4),number('t2','دمای نهایی T₂ (K)','Final temperature T₂ (K)','temperature_k',300)],tests:[
    {input:{p1:1,v1:2,t1:300,v2:4,t2:300},expected:{p2:0.5}},
    {input:{p1:2,v1:3,t1:300,v2:3,t2:300},expected:{p2:2}},
    {input:{p1:100,v1:1,t1:273,v2:2,t2:546},expected:{p2:100}},
    {input:{p1:1,v1:1,t1:300,v2:1,t2:600},expected:{p2:2}},
  ],compute({p1,v1,t1,v2,t2}){if(p1<0||v1<=0||v2<=0||t1<=0||t2<=0)throw new Error('فشار نامنفی و حجم و دمای مطلق مثبت لازم است');const p2=p1*v1*t2/(t1*v2);return out({p2:round(p2)},[`قانون ترکیبی: P₁V₁/T₁ = P₂V₂/T₂`,`P₂ = P₁V₁T₂/(T₁V₂) = ${round(p2)}`]);}}),

  make({id:'dilution',name_fa:'رقیق‌سازی محلول',name_en:'Solution Dilution',category_path:['شیمی','استوکیومتری'],tags:['رقیق‌سازی','مولاریته','محلول'],description_fa:'محاسبه غلظت نهایی محلول با پایستگی مقدار حل‌شونده.',formula_latex:'C_1V_1=C_2V_2',variables:[number('c1','غلظت اولیه C₁','Initial concentration C₁',null,0.1),number('v1','حجم برداشت‌شده V₁','Aliquot volume V₁',null,10),number('v2','حجم نهایی V₂','Final volume V₂',null,100)],tests:[
    {input:{c1:0.1,v1:10,v2:100},expected:{c2:0.01}},
    {input:{c1:2,v1:10,v2:20},expected:{c2:1}},
    {input:{c1:1,v1:1,v2:10},expected:{c2:0.1}},
    {input:{c1:0.5,v1:20,v2:25},expected:{c2:0.4}},
  ],compute({c1,v1,v2}){if(c1<0||v1<=0||v2<=0)throw new Error('غلظت نامنفی و حجم‌های مثبت لازم است');const c2=c1*v1/v2;return out({c2:round(c2),dilution_factor:round(v2/v1)},[`مقدار حل‌شونده ثابت است: C₁V₁=C₂V₂`,`C₂ = C₁V₁/V₂ = ${round(c2)}`,`ضریب رقیق‌سازی = ${round(v2/v1)}`]);}}),

  make({id:'faraday_electrolysis',name_fa:'قانون فارادی الکترولیز',name_en:'Faraday’s Law of Electrolysis',category_path:['شیمی','الکتروشیمی'],tags:['فارادی','الکترولیز','بار'],description_fa:'جرم ماده رسوب‌کرده از جریان، زمان، جرم مولی و تعداد الکترون.',formula_latex:'m=\\frac{ItM}{zF}',variables:[number('current','جریان I (A)','Current I (A)',null,2),number('time','زمان t (s)','Time t (s)','time',3600),number('molar_mass','جرم مولی M (g/mol)','Molar mass M (g/mol)',null,63.546),number('electrons','عدد الکترون z','Electrons transferred z',null,2)],tests:[
    {input:{current:2,time:3600,molar_mass:63.546,electrons:2},expected:{mass_grams:2.371}},
    {input:{current:1,time:96485,molar_mass:1,electrons:1},expected:{mass_grams:1}},
    {input:{current:0.5,time:96485,molar_mass:10,electrons:1},expected:{mass_grams:5}},
    {input:{current:1,time:3600,molar_mass:58.6934,electrons:2},expected:{mass_grams:1.094}},
  ],compute({current,time,molar_mass,electrons}){if(current<0||time<0||molar_mass<=0||!Number.isInteger(electrons)||electrons<1)throw new Error('پارامترهای الکترولیز خارج از دامنه‌اند');const F=96485.33212,mass=current*time*molar_mass/(electrons*F);return out({mass_grams:round(mass,8),charge_coulombs:round(current*time,8)},[`بار منتقل‌شده Q=It=${round(current*time,8)} C`,`قانون فارادی: m=ItM/(zF) = ${round(mass,8)} g`]);}}),

  make({id:'snell_refraction',name_fa:'قانون اسنل شکست نور',name_en:'Snell’s Law of Refraction',category_path:['فیزیک','اپتیک'],tags:['اسنل','شکست','نور'],description_fa:'زاویه شکست و بررسی بازتاب کلی داخلی در مرز دو محیط.',formula_latex:'n_1\\sin\\theta_1=n_2\\sin\\theta_2',variables:[number('n1','ضریب شکست n₁','Refractive index n₁',null,1),number('n2','ضریب شکست n₂','Refractive index n₂',null,1.5),number('angle1','زاویه تابش (درجه)','Incident angle (degrees)','angle',30)],tests:[
    {input:{n1:1,n2:1.5,angle1:30},expected:{angle2_degrees:19.471221,total_internal_reflection:false}},
    {input:{n1:1.5,n2:1,angle1:30},expected:{angle2_degrees:48.590378,total_internal_reflection:false}},
    {input:{n1:1,n2:1,angle1:45},expected:{angle2_degrees:45,total_internal_reflection:false}},
    {input:{n1:1,n2:2,angle1:30},expected:{angle2_degrees:14.477512,total_internal_reflection:false}},
  ],compute({n1,n2,angle1}){if(n1<=0||n2<=0||angle1<0||angle1>90)throw new Error('ضریب شکست باید مثبت و زاویه بین ۰ تا ۹۰ درجه باشد');const sin2=n1/n2*Math.sin(angle1*Math.PI/180),tir=sin2>1;const critical=n1>n2?Math.asin(n2/n1)*180/Math.PI:null;const angle2=tir?null:Math.asin(Math.max(-1,Math.min(1,sin2)))*180/Math.PI;return out({angle2_degrees:angle2===null?'بازتاب کلی داخلی':round(angle2),total_internal_reflection:tir,critical_angle_degrees:critical===null?'—':round(critical)},[tir?'زاویه شکست حقیقی وجود ندارد؛ بازتاب کلی داخلی رخ می‌دهد':`θ₂ = arcsin(n₁ sin θ₁/n₂) = ${round(angle2)}°`,critical===null?'':`زاویه بحرانی = ${round(critical)}°`].filter(Boolean));}}),

  make({id:'capacitor_energy',name_fa:'انرژی و بار خازن',name_en:'Capacitor Charge and Energy',category_path:['فیزیک','الکترومغناطیس'],tags:['خازن','انرژی','بار'],description_fa:'محاسبه بار ذخیره‌شده و انرژی الکتریکی خازن از ظرفیت و ولتاژ.',formula_latex:'Q=CV,\\quad U=\\frac12CV^2',variables:[number('capacitance','ظرفیت C (F)','Capacitance C (F)',null,1),number('voltage','ولتاژ V (V)','Voltage V (V)',null,2)],tests:[
    {input:{capacitance:1,voltage:2},expected:{charge_coulombs:2,energy_joules:2}},
    {input:{capacitance:0.001,voltage:100},expected:{charge_coulombs:0.1,energy_joules:5}},
    {input:{capacitance:0.000002,voltage:10},expected:{charge_coulombs:0.00002,energy_joules:0.0001}},
    {input:{capacitance:0.01,voltage:0},expected:{charge_coulombs:0,energy_joules:0}},
  ],compute({capacitance,voltage}){if(capacitance<0)throw new Error('ظرفیت خازن نامنفی باشد');const charge=capacitance*voltage,energy=.5*capacitance*voltage**2;return out({charge_coulombs:round(charge,8),energy_joules:round(energy,8)},[`Q=CV = ${round(charge,8)} C`,`U=½CV² = ${round(energy,8)} J`]);}}),

  make({id:'wave_relation',name_fa:'رابطه سرعت، فرکانس و طول موج',name_en:'Wave Speed, Frequency and Wavelength',category_path:['فیزیک','مکانیک کلاسیک'],tags:['موج','فرکانس','طول موج'],description_fa:'محاسبه طول موج از سرعت انتشار و فرکانس.',formula_latex:'v=f\\lambda\\;\\Rightarrow\\;\\lambda=v/f',variables:[number('speed','سرعت موج v (m/s)','Wave speed v (m/s)',null,343),number('frequency','فرکانس f (Hz، مثبت)','Frequency f (Hz, >0)','frequency',440)],tests:[
    {input:{speed:343,frequency:440},expected:{wavelength:0.779545}},
    {input:{speed:340,frequency:170},expected:{wavelength:2}},
    {input:{speed:300000000,frequency:600000000000000},expected:{wavelength:5e-7}},
    {input:{speed:1500,frequency:1000},expected:{wavelength:1.5}},
  ],compute({speed,frequency}){if(speed<0||frequency<=0)throw new Error('سرعت نامنفی و فرکانس مثبت لازم است');const wavelength=speed/frequency;return out({wavelength:round(wavelength,8),period:round(1/frequency,8)},[`v=fλ`, `λ=v/f=${round(wavelength,8)} m`,`دوره تناوب T=1/f=${round(1/frequency,8)} s`]);}}),

  make({id:'radioactive_decay',name_fa:'واپاشی پرتوزا و نیمه‌عمر',name_en:'Radioactive Decay and Half-Life',category_path:['فیزیک','فیزیک مدرن'],tags:['واپاشی','نیمه‌عمر','هسته‌ای'],description_fa:'محاسبه مقدار باقیمانده و واپاشیده‌شده پس از چند نیمه‌عمر.',formula_latex:'N(t)=N_0\\,2^{-t/t_{1/2}}',variables:[number('initial','مقدار اولیه N₀','Initial amount N₀',null,100),number('half_life','نیمه‌عمر t₁/₂ (مثبت)','Half-life t₁/₂ (>0)','time',10),number('time','زمان سپری‌شده t','Elapsed time t','time',10)],tests:[
    {input:{initial:100,half_life:10,time:10},expected:{remaining:50,decayed:50}},
    {input:{initial:80,half_life:5,time:0},expected:{remaining:80,decayed:0}},
    {input:{initial:100,half_life:10,time:20},expected:{remaining:25,decayed:75}},
    {input:{initial:1000,half_life:8,time:24},expected:{remaining:125,decayed:875}},
  ],compute({initial,half_life,time}){if(initial<0||half_life<=0||time<0)throw new Error('مقدار اولیه و زمان نامنفی و نیمه‌عمر مثبت لازم است');const remaining=initial*2**(-time/half_life),decayed=initial-remaining;return out({remaining:round(remaining),decayed:round(decayed),fraction_remaining:round(remaining/Math.max(initial,1),8)},[`N(t)=N₀·2^(−t/t₁/₂)`,`مقدار باقی‌مانده = ${round(remaining)}`,`مقدار واپاشیده‌شده = ${round(decayed)}`]);}}),

  make({id:'isothermal_work',name_fa:'کار گاز ایده‌آل در فرایند هم‌دما',name_en:'Isothermal Ideal-Gas Work',category_path:['فیزیک','ترمودینامیک'],tags:['گاز ایده‌آل','کار','هم‌دما'],description_fa:'کار برگشت‌پذیر گاز ایده‌آل در انبساط یا تراکم هم‌دما.',formula_latex:'W=nRT\\ln(V_2/V_1)',variables:[number('moles','مقدار ماده n (mol)','Amount n (mol)',null,1),number('temperature','دما T (K)','Temperature T (K)','temperature_k',300),number('volume1','حجم اولیه V₁','Initial volume V₁',null,1),number('volume2','حجم نهایی V₂','Final volume V₂',null,Math.E)],tests:[
    {input:{moles:1,temperature:300,volume1:1,volume2:Math.E},expected:{work_joules:2494.3388}},
    {input:{moles:1,temperature:298.15,volume1:2,volume2:2},expected:{work_joules:0}},
    {input:{moles:2,temperature:300,volume1:1,volume2:2},expected:{work_joules:3457.0}},
    {input:{moles:0.5,temperature:400,volume1:1,volume2:4},expected:{work_joules:2305.7}},
  ],compute({moles,temperature,volume1,volume2}){if(moles<0||temperature<=0||volume1<=0||volume2<=0)throw new Error('مقدار ماده نامنفی و دمای مطلق و حجم‌ها مثبت باشند');const R=8.314462618,work=moles*R*temperature*Math.log(volume2/volume1);return out({work_joules:round(work,8)},[`W=nRT ln(V₂/V₁)`,`کار گاز = ${round(work,8)} J (${work<0?'تراکم':'انبساط/تعادل'})`]);}}),

  make({id:'conduction_heat_rate',name_fa:'انتقال حرارت هدایت یک‌بعدی',name_en:'One-Dimensional Conduction Heat Rate',category_path:['مهندسی','انتقال حرارت'],tags:['هدایت','فوریه','مقاومت حرارتی'],description_fa:'شار گرمای پایا از دیواره تخت همگن طبق قانون فوریه.',formula_latex:'\\dot Q=kA\\frac{T_h-T_c}{L}',variables:[number('conductivity','رسانندگی گرمایی k (W/m·K)','Thermal conductivity k (W/m·K)',null,200),number('area','مساحت A (m²)','Area A (m²)',null,0.1),number('hot_temperature','دمای سمت گرم Tₕ (K)','Hot-side temperature Tₕ (K)','temperature_k',400),number('cold_temperature','دمای سمت سرد T꜀ (K)','Cold-side temperature T꜀ (K)','temperature_k',300),number('thickness','ضخامت L (m، مثبت)','Thickness L (m, >0)','length',0.05)],tests:[
    {input:{conductivity:200,area:0.1,hot_temperature:400,cold_temperature:300,thickness:0.05},expected:{heat_rate:40000,thermal_resistance:0.0025}},
    {input:{conductivity:0.5,area:2,hot_temperature:320,cold_temperature:300,thickness:0.1},expected:{heat_rate:200}},
    {input:{conductivity:1,area:1,hot_temperature:310,cold_temperature:300,thickness:1},expected:{heat_rate:10}},
    {input:{conductivity:50,area:3,hot_temperature:300,cold_temperature:300,thickness:0.2},expected:{heat_rate:0}},
  ],compute({conductivity,area,hot_temperature,cold_temperature,thickness}){if(conductivity<0||area<0||thickness<=0)throw new Error('رسانندگی و مساحت نامنفی و ضخامت مثبت لازم است');const delta=hot_temperature-cold_temperature,resistance=thickness/(conductivity*area||Infinity),rate=conductivity*area*delta/thickness;return out({heat_rate:round(rate),thermal_resistance:round(resistance,8),temperature_difference:round(delta)},[`قانون فوریه: Q̇=kAΔT/L`,`Q̇ = ${round(rate)} W`,`مقاومت حرارتی Rₜ=L/(kA) = ${round(resistance,8)} K/W`]);}}),

  make({id:'resistor_series_parallel',name_fa:'مقاومت معادل سری و موازی',name_en:'Series and Parallel Resistor Equivalent',category_path:['مهندسی','مدار و الکترونیک'],tags:['مقاومت','مدار','اهم'],description_fa:'محاسبه مقاومت معادل، جریان کل و توان دو مقاومت در دو آرایش.',formula_latex:'R_s=R_1+R_2,\\quad R_p=\\frac{R_1R_2}{R_1+R_2}',variables:[number('r1','مقاومت R₁ (Ω)','Resistance R₁ (Ω)','resistance',4),number('r2','مقاومت R₂ (Ω)','Resistance R₂ (Ω)','resistance',6),number('voltage','ولتاژ منبع V (V)','Source voltage V (V)','voltage',12)],tests:[
    {input:{r1:4,r2:6,voltage:12},expected:{series_resistance:10,parallel_resistance:2.4,series_current:1.2,parallel_current:5}},
    {input:{r1:10,r2:10,voltage:5},expected:{series_resistance:20,parallel_resistance:5,series_current:0.25,parallel_current:1}},
    {input:{r1:3,r2:6,voltage:9},expected:{series_resistance:9,parallel_resistance:2,series_current:1,parallel_current:4.5}},
    {input:{r1:1,r2:100,voltage:10},expected:{series_resistance:101,parallel_resistance:0.990099,series_current:0.09901,parallel_current:10.1}},
  ],compute({r1,r2,voltage}){if(r1<=0||r2<=0)throw new Error('مقاومت‌ها باید مثبت باشند');const series=r1+r2,parallel=r1*r2/series;return out({series_resistance:round(series),parallel_resistance:round(parallel),series_current:round(voltage/series),parallel_current:round(voltage/parallel),series_power:round(voltage**2/series),parallel_power:round(voltage**2/parallel)},[`سری: Rₛ=R₁+R₂=${round(series)} Ω`,`موازی: Rₚ=R₁R₂/(R₁+R₂)=${round(parallel)} Ω`,`از قانون اهم: Iₛ=${round(voltage/series)} A، Iₚ=${round(voltage/parallel)} A`]);}}),

  make({id:'drag_force',name_fa:'نیروی پسا',name_en:'Aerodynamic Drag Force',category_path:['فیزیک','مکانیک کلاسیک'],tags:['درگ','سیالات','نیرو'],description_fa:'اندازه نیروی پسا با چگالی سیال، سرعت، ضریب پسا و مساحت مرجع.',formula_latex:'F_D=\\frac12\\rho v^2 C_D A',variables:[number('density','چگالی سیال ρ (kg/m³)','Fluid density ρ (kg/m³)','density',1.2),number('speed','سرعت v (m/s)','Speed v (m/s)',null,10),number('drag_coefficient','ضریب پسا Cᴅ','Drag coefficient Cᴅ',null,0.47),number('area','مساحت مرجع A (m²)','Reference area A (m²)',null,0.1)],tests:[
    {input:{density:1.2,speed:10,drag_coefficient:0.47,area:0.1},expected:{drag_force:2.82}},
    {input:{density:1,speed:2,drag_coefficient:1,area:1},expected:{drag_force:2}},
    {input:{density:1000,speed:1,drag_coefficient:1,area:0.01},expected:{drag_force:5}},
    {input:{density:1.2,speed:0,drag_coefficient:0.47,area:0.1},expected:{drag_force:0}},
  ],compute({density,speed,drag_coefficient,area}){if(density<0||drag_coefficient<0||area<0)throw new Error('چگالی، ضریب پسا و مساحت باید نامنفی باشند');const force=.5*density*speed**2*drag_coefficient*area;return out({drag_force:round(force),dynamic_pressure:round(.5*density*speed**2)},[`فشار دینامیکی q=½ρv²=${round(.5*density*speed**2)} Pa`,`پسا Fᴅ=qCᴅA=${round(force)} N`]);}}),

  make({id:'torque',name_fa:'گشتاور نیرو',name_en:'Torque from a Force',category_path:['فیزیک','مکانیک کلاسیک'],tags:['گشتاور','نیرو','دوران'],description_fa:'گشتاور نیروی اعمال‌شده با بازوی اهرم و زاویه بین r و F.',formula_latex:'\\tau=rF\\sin\\theta',variables:[number('radius','بازوی گشتاور r (m)','Lever arm r (m)','length',2),number('force','نیرو F (N)','Force F (N)',null,10),number('angle','زاویه بین r و F (درجه)','Angle between r and F (degrees)','angle',90)],tests:[
    {input:{radius:2,force:10,angle:90},expected:{torque:20}},
    {input:{radius:1,force:5,angle:30},expected:{torque:2.5}},
    {input:{radius:3,force:4,angle:0},expected:{torque:0}},
    {input:{radius:0.5,force:100,angle:90},expected:{torque:50}},
  ],compute({radius,force,angle}){if(radius<0||force<0||angle<0||angle>180)throw new Error('بازو و نیرو نامنفی و زاویه بین ۰ تا ۱۸۰ درجه لازم است');const torque=radius*force*Math.sin(angle*Math.PI/180);return out({torque:round(torque)},[`τ=rF sinθ`,`گشتاور = ${round(torque)} N·m`]);}}),

  make({id:'power_efficiency',name_fa:'بازده و توان تلف‌شده',name_en:'Efficiency and Power Loss',category_path:['فیزیک','مکانیک کلاسیک'],tags:['بازده','توان','تلفات'],description_fa:'محاسبه بازده سامانه و توان تلف‌شده از توان ورودی و خروجی.',formula_latex:'\\eta=\\frac{P_{out}}{P_{in}}\\times100\\%',variables:[number('input_power','توان ورودی Pᵢₙ (W)','Input power Pᵢₙ (W)',null,100),number('output_power','توان خروجی Pₒᵤₜ (W)','Output power Pₒᵤₜ (W)',null,85)],tests:[
    {input:{input_power:100,output_power:85},expected:{efficiency_percent:85,power_loss:15}},
    {input:{input_power:50,output_power:50},expected:{efficiency_percent:100,power_loss:0}},
    {input:{input_power:200,output_power:100},expected:{efficiency_percent:50,power_loss:100}},
    {input:{input_power:10,output_power:0},expected:{efficiency_percent:0,power_loss:10}},
  ],compute({input_power,output_power}){if(input_power<=0||output_power<0||output_power>input_power)throw new Error('توان ورودی باید مثبت و خروجی بین صفر و ورودی باشد');const efficiency=100*output_power/input_power,loss=input_power-output_power;return out({efficiency_percent:round(efficiency),power_loss:round(loss)},[`η=Pout/Pin×100% = ${round(efficiency)}٪`,`توان تلف‌شده = Pin−Pout = ${round(loss)} W`]);}}),

  make({id:'carnot_efficiency',name_fa:'بازده کارنو',name_en:'Carnot Heat Engine Efficiency',category_path:['فیزیک','ترمودینامیک'],tags:['کارنو','بازده','ترمودینامیک'],description_fa:'حداکثر بازده موتور حرارتی برگشت‌پذیر بین دو مخزن دما.',formula_latex:'\\eta_C=1-\\frac{T_c}{T_h}',variables:[number('hot_temperature','دمای منبع گرم Tₕ (K)','Hot-reservoir temperature Tₕ (K)','temperature_k',600),number('cold_temperature','دمای منبع سرد T꜀ (K)','Cold-reservoir temperature T꜀ (K)','temperature_k',300)],tests:[
    {input:{hot_temperature:600,cold_temperature:300},expected:{efficiency_percent:50}},
    {input:{hot_temperature:500,cold_temperature:250},expected:{efficiency_percent:50}},
    {input:{hot_temperature:400,cold_temperature:300},expected:{efficiency_percent:25}},
    {input:{hot_temperature:350,cold_temperature:350},expected:{efficiency_percent:0}},
  ],compute({hot_temperature,cold_temperature}){if(hot_temperature<=0||cold_temperature<0||cold_temperature>hot_temperature)throw new Error('دمای مطلق گرم مثبت و دمای سرد بین صفر و دمای گرم باشد');const efficiency=1-cold_temperature/hot_temperature;return out({efficiency_percent:round(efficiency*100),maximum_work_fraction:round(efficiency)},[`حداکثر بازده کارنو = 1−T꜀/Tₕ`,`η_C = ${round(efficiency*100)}٪`]);}}),
];
