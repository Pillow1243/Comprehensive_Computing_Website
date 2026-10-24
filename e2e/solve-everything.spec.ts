import {test,expect,type Page} from '@playwright/test';

const app=(page:Page)=>page.frameLocator('iframe[title="SolveEverything scientific calculator"]');

test('Pages root opens the PWA app and serves its install manifest',async({page})=>{
  await page.goto('/');
  const frame=page.locator('iframe[title="SolveEverything scientific calculator"]');
  await expect(frame).toBeVisible();
  const ui=app(page);
  await expect(ui.locator('#heroStats')).toContainText('100');
  const manifestHref=await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(manifestHref).toContain('/app/manifest.webmanifest');
  const manifest=await page.request.get(new URL(manifestHref!,page.url()).toString());
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).name).toContain('SolveEverything');
});

test('search finds pH and solves a chemistry formula',async({page})=>{
  await page.goto('/');
  const ui=app(page);
  await ui.getByRole('searchbox',{name:'جستجوی فرمول'}).fill('pH');
  const card=ui.locator('a[href="#/formula/ph"]');
  await expect(card).toBeVisible();
  await card.click();
  await expect(ui.locator('#solverTitle')).toContainText('pH');
  await expect(ui.locator('#resultBox')).toContainText('3');
  await expect(ui.locator('#stepsBox li').first()).toBeVisible();
});

test('quadratic formula returns roots and step-by-step work',async({page})=>{
  await page.goto('/');
  const ui=app(page);
  await ui.locator('a[href="#/formula/quadratic"]').click();
  await expect(ui.locator('#solverTitle')).toContainText('درجه دو');
  await expect(ui.locator('#resultBox')).toContainText('3');
  await expect(ui.locator('#resultBox')).toContainText('2');
  await expect(ui.locator('#stepsBox li')).toHaveCount(4);
});

test('scientific calculator works offline and shows a clear server-required message',async({page})=>{
  await page.goto('/');
  const ui=app(page);
  await ui.locator('a[href="#/calculator"]').click();
  await ui.locator('#calcExpr').fill('sqrt(16)+3^2');
  await expect(ui.locator('#calcOut')).toContainText('13');
  await ui.locator('#serverDerivBtn').click();
  await expect(ui.locator('#serverDerivOut')).toContainText('این عملیات نیاز به سرور دارد');
});

test('mobile layout converts units without horizontal overflow',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  const ui=app(page);
  await ui.locator('a[href="#/converter"]').click();
  await ui.locator('#convDim').selectOption('length');
  await ui.locator('#convVal').fill('1');
  await ui.locator('#convFrom').selectOption('km');
  await ui.locator('#convTo').selectOption('m');
  await expect(ui.locator('#convOut')).toContainText('1000');
  const overflow=await ui.locator('body').evaluate((el:HTMLBodyElement)=>el.scrollWidth>document.documentElement.clientWidth);
  expect(overflow).toBeFalsy();
});
