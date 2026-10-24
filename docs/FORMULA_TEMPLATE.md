# Template افزودن فرمول

اسکیمای فراداده: [`packages/formula-registry/schema.json`](../packages/formula-registry/schema.json). هر پیاده‌سازی سمت کاربر باید یک تابع `compute()` مورداعتماد و حداقل چهار تست مستقل داشته باشد. کد محاسباتی را در `apps/web/registry.js` یا ماژول دامنه‌ای در `apps/web/` بنویسید؛ **هرگز** رشته `compute_js` را با `eval` یا `Function` اجرا نکنید. backend هم فقط solverهای صریح و allow-list شده دارد؛ `compute_python` نباید با `exec` اجرا شود.

```js
{
  id: 'geometry_circle_sector',
  name_fa: 'مساحت قطاع دایره',
  name_en: 'Circle Sector Area',
  category_path: ['ریاضیات', 'هندسه و مثلثات'],
  tags: ['دایره', 'مساحت', 'قطاع'],
  description_fa: 'محاسبه مساحت قطاع از شعاع و زاویه مرکزی.',
  variables: [
    {name:'radius', label_fa:'شعاع', label_en:'Radius', type:'number', unit:'length', required:true, default:3},
    {name:'angle', label_fa:'زاویه (درجه)', label_en:'Angle (degrees)', type:'number', unit:'angle', required:true, default:90}
  ],
  outputs: [{name:'area', label_fa:'مساحت قطاع', label_en:'Sector area', unit:'area'}],
  formula_latex: 'A=\\frac{\\theta}{360^\\circ}\\pi r^2',
  plot_spec: {type:'circle', dynamic:true},
  examples: [{input:{radius:3, angle:90}, expected:{area:7.068583}}],
  tests: [
    {input:{radius:3, angle:90}, expected:{area:7.068583}},
    {input:{radius:1, angle:360}, expected:{area:3.141593}},
    {input:{radius:2, angle:180}, expected:{area:6.283185}},
    {input:{radius:0.5, angle:90}, expected:{area:0.19635}}
  ],
  references: [],
  difficulty: 'basic', version: '1.0.0', validated: true,
  compute({radius, angle}) {
    const area = Math.PI * radius * radius * angle / 360;
    return {values:{area}, steps:[`A = πr²θ/360 = ${area}`]};
  }
}
```

## مشارکت‌کننده باید

1. از شناسه یکتای `snake_case` و دسته موجود استفاده کند؛ نام/توضیح انگلیسی و فارسی اجباری است.
2. دامنه ورودی و خطاهای مرزی (صفر، منفی، واحد ناسازگار، ریشه نامعتبر) را بررسی کند.
3. `compute()` را قطعی، خالص و محدود به محاسبه نگه دارد؛ ورودی کاربر را به HTML با `innerHTML` وارد نکند.
4. دست‌کم چهار test case شامل حالت مرزی و اعداد قابل‌راستی‌آزمایی اضافه کند.
5. مراحل حل کوتاه و قابل فهم، خروجی با واحد، مثال، منابع معتبر در صورت استفاده، و `plot_spec` را تکمیل کند.
6. `npm run sync-registry` را برای به‌روزرسانی JSON اجرا کند، سپس `npm run validate-registry && npm test`.

`outputs`, `references` و `steps_generator` در مدل زمان اجرا برای سازگاری با Schema آماده‌اند. `compute_js` و `compute_python` در JSON فقط باید به ماژول/solver allow-list شده اشاره کنند؛ آن‌ها رشته کد قابل اجرا نیستند. بخش Python اختیاری است و تنها برای عملیات سروری پیاده می‌شود.
