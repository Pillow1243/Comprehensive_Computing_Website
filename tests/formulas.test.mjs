// Unit tests — every formula must pass its declared tests (node --test)
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {FORMULAS, parseList} from '../apps/web/registry.js';
import {evaluate, numericDerivative, numericIntegral, findRoot, convertUnits} from '../apps/web/engine.js';

const close=(a,b,tol=1e-4)=>Math.abs(a-b)<=tol*Math.max(1,Math.abs(b));

for(const f of FORMULAS){
  test(`formula: ${f.id} has schema + tests`, ()=>{
    assert.ok(f.id && f.name_fa && f.name_en && f.formula_latex, 'schema fields');
    assert.ok(Array.isArray(f.variables) && f.variables.length>0);
    assert.ok(typeof f.compute==='function');
    assert.ok(Array.isArray(f.tests)&&f.tests.length>0, 'every formula needs tests');
  });
  (f.tests||[]).forEach((tc,i)=>{
    test(`formula: ${f.id} case ${i+1}`, ()=>{
      const res=f.compute({...tc.input});
      assert.ok(res.values && Array.isArray(res.steps) && res.steps.length>0);
      for(const [k,exp] of Object.entries(tc.expected)){
        const got=res.values[k];
        if(typeof exp==='number') assert.ok(typeof got==='number'&&close(got,exp,1e-3), `${k}: got ${got}, expected ${exp}`);
        else assert.equal(String(got),String(exp), k);
      }
    });
  });
}
test('engine: expression parser', ()=>{
  assert.equal(evaluate('2+3*4'),14);
  assert.equal(evaluate('2^3^2'),512);
  assert.equal(evaluate('sqrt(16)+sin(pi/2)'),5);
  assert.equal(evaluate('5!'),120);
  assert.ok(close(evaluate('ln(e^2)'),2));
  assert.throws(()=>evaluate('x+1'));
  assert.throws(()=>evaluate('evil()'));
});
test('engine: calculus numerics', ()=>{
  assert.ok(close(numericDerivative('x^3',2),12,1e-3));
  assert.ok(close(numericIntegral('x^2',0,3),9,1e-3));
  assert.ok(close(findRoot('x^2-2',0,2),Math.SQRT2,1e-6));
});
test('engine: units', ()=>{
  assert.ok(close(convertUnits(1,'length','km','m'),1000));
  assert.ok(close(convertUnits(180,'angle','deg','rad'),Math.PI));
  assert.ok(close(convertUnits(36,'speed','km/h','m/s'),10));
});
test('parseList', ()=>assert.deepEqual(parseList('1, 2;3'),[1,2,3]));
