# Template فرمول جدید (مطابق اسکیمای مشخصات)

```js
{
  id: 'domain_topic_name',              // یکتا، snake_case
  name_fa: 'نام فارسی', name_en: 'English Name',
  category_path: ['ریاضیات', 'جبر'],    // از CATEGORIES
  tags: ['کلیدواژه'], description_fa: 'توضیح یک‌خطی',
  formula_latex: 'x=\\frac{-b}{2a}',
  variables: [ /* N('x','برچسب','Label','length', مقدارپیش‌فرض) — unit از UNITS در engine.js */ ],
  examples: [{...}], tests: [{input:{...}, expected:{خروجی: مقدار}}],  // ⚠ حداقل یک تست اجباری
  plot_spec: {type:'quadratic'},        // اختیاری: triangle|circle|normal|histogram|…
  difficulty: 'basic', version: '1.0.0', validated: true,
  compute(values){ return {values:{...}, steps:['گام ۱…','گام ۲…']}; }
}
```
قوانین: ورودی نامعتبر → `throw new Error('پیام واضح')`؛ خروجی‌ها گرد شده با `r()`؛ واحدها در SI به compute می‌رسند (تبدیل در UI)؛ بعد از افزودن: `node --test tests/formulas.test.mjs` باید سبز شود و id به `packages/formula-registry/catalog.json → implemented_formula_ids` اضافه شود.
