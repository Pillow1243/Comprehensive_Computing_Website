// Regression tests for bugs found in the production audit (node --test).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../apps/web/engine.js';
import {getFormula} from '../apps/web/registry.js';
import {drawFunctionPlot} from '../apps/web/plot.js';

test('engine: unary minus binds looser than ^ (-2^2 = -4)', () => {
  assert.equal(evaluate('-2^2'), -4);
  assert.equal(evaluate('(-2)^2'), 4);
  assert.equal(evaluate('2^-1'), 0.5);
  assert.equal(evaluate('2^3^2'), 512);
  assert.equal(evaluate('2*-3'), -6);
  assert.equal(evaluate('3!^2'), 36);
});

test('engine: object-prototype names are not treated as variables/functions', () => {
  for (const name of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
    assert.throws(() => evaluate(name), /ناشناخته/);
    assert.throws(() => evaluate(`${name}(1)`), /ناشناخته/);
  }
});

test('factorial rejects r > n and oversized n instead of returning wrong values', () => {
  const f = getFormula('factorial');
  assert.throws(() => f.compute({n: 3, r: 5}), /r باید/);
  assert.throws(() => f.compute({n: -1, r: 0}), /n باید/);
  assert.throws(() => f.compute({n: 1e9, r: 1}), /n باید/);
  assert.equal(f.compute({n: 10, r: 3}).values.combination, 120);
});

test('invalid inputs for other formulas are reported as errors, not NaN', () => {
  assert.throws(() => getFormula('gcd_lcm').compute({a: 0, b: 0}));
  assert.throws(() => getFormula('prime_factor').compute({n: 1}));
  assert.throws(() => getFormula('percent_change').compute({old: 0, new: 5}));
  assert.throws(() => getFormula('bmi').compute({mass: 70, height: 0}));
});

test('function plotter rejects an empty/reversed range (previously an infinite loop)', () => {
  const fakeCanvas = {getBoundingClientRect: () => ({width: 300, height: 200}), getContext: () => ({})};
  globalThis.window ??= {devicePixelRatio: 1};
  globalThis.document ??= {documentElement: {dataset: {theme: 'light'}}};
  assert.throws(() => drawFunctionPlot(fakeCanvas, 'x', 5, 5), /بازه نامعتبر/);
  assert.throws(() => drawFunctionPlot(fakeCanvas, 'x', 5, -5), /بازه نامعتبر/);
});
