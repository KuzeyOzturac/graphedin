import test from 'node:test';import assert from 'node:assert/strict';import {server} from '../server/index.js';
test('HTTP server protects credentials, rejects origins, and serves real frontend',async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{let res=await fetch(base+'/');assert.equal(res.status,200);assert.match(await res.text(),/GraphEdIn/);
 res=await fetch(base+'/.env');assert.equal(res.status,404);
 res=await fetch(base+'/api/discover?company=Kale',{headers:{Origin:'https://evil.test'}});assert.equal(res.status,403);
 res=await fetch(base+'/api/discover?company=A');assert.equal(res.status,400);
 res=await fetch(base+'/api/health');assert.equal(res.status,200);assert.equal(typeof(await res.json()).configured,'boolean');
 res=await fetch(base+'/api/discover?company=Kale',{method:'POST'});assert.equal(res.status,405);
 }finally{await new Promise(r=>server.close(r));}
});
