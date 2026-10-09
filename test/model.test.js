import test from 'node:test';import assert from 'node:assert/strict';
import {validateGraph,safeLinkedIn,suggestManagers,layout,demo} from '../src/model.js';
test('reject duplicate IDs, missing managers, cycles and unsupported evidence',()=>{
  for(const people of [[{id:'a',name:'A'},{id:'a',name:'B'}],[{id:'a',name:'A',managerId:'missing'}],[{id:'a',name:'A',managerId:'b'},{id:'b',name:'B',managerId:'a'}],[{id:'a',name:'A',managerId:'b',relationship:'confirmed'},{id:'b',name:'B'}]])assert.throws(()=>validateGraph({people}));
});
test('URLs reject script schemes, deceptive domains and non-profile links',()=>{
  for(const url of ['javascript:alert(1)','https://linkedin.com.evil.test/in/person','http://www.linkedin.com/in/person','https://linkedin.com/company/company'])assert.equal(safeLinkedIn(url),'');
  assert.equal(safeLinkedIn('https://tr.linkedin.com/in/person/?trk=abc'),'https://www.linkedin.com/in/person');
});
test('ambiguous candidate managers do not produce a made-up link',()=>{
  const people=validateGraph({people:[{id:'a',name:'A',role:'Director of Engineering'},{id:'b',name:'B',role:'Director of Engineering'},{id:'c',name:'C',role:'Engineering Manager'}]}).people;
  assert.equal(suggestManagers(people).find(p=>p.id==='c').managerId,'');
});
test('suggestions are inferred and never mutate the source',()=>{
 const people=validateGraph({people:[{id:'a',name:'A',role:'CEO'},{id:'b',name:'B',role:'Engineer'}]}).people;const result=suggestManagers(people);assert.equal(result[1].managerId,'a');assert.equal(result[1].relationship,'inferred');assert.equal(people[1].managerId,'');
});
test('layout has finite nonoverlapping node positions',()=>{const result=layout(demo.people);assert.equal(result.positions.size,demo.people.length);for(const a of result.positions.values()){assert.ok(Number.isFinite(a.x)&&Number.isFinite(a.y));for(const b of result.positions.values())if(a!==b&&a.y===b.y)assert.ok(Math.abs(a.x-b.x)>=244);}});
test('large imports are rejected',()=>assert.throws(()=>validateGraph({people:Array.from({length:501},(_,i)=>({id:String(i),name:'Person '+i}))})));
test('suggestions never close a cycle through an existing reporting link',()=>{const graph=validateGraph({people:[{id:'cto',name:'Technology leader',role:'CTO',managerId:'eng'},{id:'eng',name:'Engineer',role:'Engineer'}]});const result=suggestManagers(graph.people);assert.equal(result.find(p=>p.id==='eng').managerId,'');assert.doesNotThrow(()=>validateGraph({...graph,people:result}));});
