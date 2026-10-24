import {test} from 'node:test';
import assert from 'node:assert/strict';
import {getApiBaseUrl,requestServerJson} from '../apps/web/api.js';

test('server-only operations fail clearly when no API base URL is configured',async()=>{
  const previous=globalThis.SOLVE_EVERYTHING_API_URL;
  try{
    delete globalThis.SOLVE_EVERYTHING_API_URL;
    assert.equal(getApiBaseUrl(),'');
    await assert.rejects(
      requestServerJson('/api/v1/calculus/derivative',{expression:'x^2'}, {language:'fa'}),
      /این عملیات نیاز به سرور دارد/,
    );
    await assert.rejects(
      requestServerJson('/api/v1/calculus/derivative',{expression:'x^2'}, {language:'en'}),
      /This operation requires a server/,
    );
  }finally{
    if(previous===undefined) delete globalThis.SOLVE_EVERYTHING_API_URL;
    else globalThis.SOLVE_EVERYTHING_API_URL=previous;
  }
});

test('API URL is a configurable public origin, not a source of embedded credentials',()=>{
  const previous=globalThis.SOLVE_EVERYTHING_API_URL;
  globalThis.SOLVE_EVERYTHING_API_URL='https://api.example.org/';
  try{assert.equal(getApiBaseUrl(),'https://api.example.org');}
  finally{if(previous===undefined)delete globalThis.SOLVE_EVERYTHING_API_URL;else globalThis.SOLVE_EVERYTHING_API_URL=previous;}
});
