import test from 'node:test';
import assert from 'node:assert/strict';
import {backendUrl,discoverCompany} from '../src/client.js';
test('deployment connection never silently targets GitHub Pages as an API',()=>{
  assert.equal(backendUrl('', 'kuzeyozturac.github.io','https://kuzeyozturac.github.io'),'');
  assert.equal(backendUrl('', 'localhost','http://localhost:3000'),'http://localhost:3000');
  assert.throws(()=>backendUrl('https://user:secret@example.com','host','origin'));
});
test('a visitor supplies only a company name; no provider credential is sent',async()=>{
  let request;
  const result=await discoverCompany('A & B','https://api.example',async(url,options)=>{
    request={url,options};return {ok:true,json:async()=>({company:'A & B',people:[]})};
  });
  assert.equal(request.url.searchParams.get('company'),'A & B');
  assert.equal(request.options.credentials,'omit');
  assert.equal(result.company,'A & B');
});
test('unconfigured or failed discovery errors without requesting manual research',async()=>{
  await assert.rejects(discoverCompany('Kale','',()=>assert.fail('must not fetch')),/site owner/);
  await assert.rejects(discoverCompany('Kale','https://api.example',async()=>({ok:false,json:async()=>({error:'Rate limited'})})),/Rate limited/);
});
