import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGameServer } from './server.mjs';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
test('shared world, private sessions, validation, chat limits and expiration',async()=>{
 let time=10000;const server=createGameServer({clock:()=>time,maxPlayers:2});server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const post=async b=>{const r=await fetch(base+'/world',{method:'POST',body:typeof b==='string'?b:JSON.stringify(b)});return {status:r.status,data:await r.json()}};
 try{
 const a={id:randomUUID(),token:randomUUID(),name:'A',x:1,z:2,driving:true};const b={id:randomUUID(),token:randomUUID(),name:'B'};
 assert.equal((await fetch(base+'/health')).status,200);
 assert.equal((await post({...a,message:'Hello from mobile'})).status,200);
 const joined=await post(b);assert.equal(joined.data.players.length,2);assert.equal(joined.data.messages[0].text,'Hello from mobile');assert(!JSON.stringify(joined.data).includes(a.token));
 assert.equal((await post({...a,token:randomUUID(),x:500})).status,401);
 assert.equal((await post({...a,message:'Too fast'})).status,429);
 assert.equal((await post({id:randomUUID(),token:randomUUID()})).status,503);
 time+=1100;const moved=await post({...a,x:123,z:-30,driving:false,message:'Walking now'});assert.equal(moved.status,200);assert.equal(moved.data.players.find(p=>p.id===a.id).x,123);assert.equal(moved.data.players.find(p=>p.id===a.id).driving,false);
 assert.equal((await post('{broken')).status,400);assert.equal((await post({id:'x'})).status,400);assert.equal((await post('x'.repeat(40000))).status,413);
 time+=21000;const reconnect=await post(b);assert.equal(reconnect.data.players.length,1);
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
});
