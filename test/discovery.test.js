import test from 'node:test';import assert from 'node:assert/strict';import {parseResults,discover,companyName} from '../server/discovery.js';
test('public search results deduplicate and keep evidence without inventing reports',()=>{
 const results=[{title:'Elif Yılmaz - Engineering Manager - LinkedIn',url:'https://www.linkedin.com/in/elif',description:'Works at Kale Engineering.'},{title:'Elif Yılmaz - LinkedIn',url:'https://tr.linkedin.com/in/elif?x=1'},{title:'Not a profile',url:'https://evil.test/in/a'}];
 const graph=parseResults(results,'Kale Engineering','2026-10-09T00:00:00Z');assert.equal(graph.people.length,1);assert.equal(graph.people[0].role,'Engineering Manager');assert.equal(graph.people[0].managerId,'');assert.equal(graph.people[0].excerpt,'Works at Kale Engineering.');
});
test('rejects empty names and query-control characters',()=>{for(const input of ['',null,'A','Company" OR CEO','a\nb'])assert.throws(()=>companyName(input));});
test('missing credentials produce an explicit 503',async()=>{await assert.rejects(discover('Kale', ''),e=>e.status===503);});
test('search uses the server secret and LinkedIn-only query',async()=>{
 let called;const mock=async(url,options)=>{called={url,options};return {ok:true,json:async()=>({web:{results:[]}})}};
 const result=await discover('Kale','test-secret',mock);assert.equal(called.options.headers['X-Subscription-Token'],'test-secret');assert.match(called.url.searchParams.get('q'),/site:linkedin.com\/in\//);assert.equal(result.people.length,0);assert.ok(!JSON.stringify(result).includes('test-secret'));
});
test('provider failures preserve rate-limit meaning',async()=>{await assert.rejects(discover('Kale','key',async()=>({ok:false,status:429})),e=>e.status===429);});
