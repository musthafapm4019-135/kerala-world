import {test} from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {randomUUID} from 'node:crypto';
import {createGameServer} from './server.mjs';
test('voice signaling is opt-in, authenticated, addressed, acknowledged and deduplicated',async()=>{
 const server=createGameServer();server.listen(0,'127.0.0.1');await once(server,'listening');const url=`http://127.0.0.1:${server.address().port}/world`;
 const post=async body=>{const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://kerala-world.vercel.app'},body:JSON.stringify(body)});return {r,data:await r.json()}};
 const a={id:randomUUID(),token:randomUUID(),voice:true,x:1200,z:-2100,y:80,vehicle:'helicopter'},b={id:randomUUID(),token:randomUUID(),voice:true},c={id:randomUUID(),token:randomUUID()};
 try{
 const first=await post(a);assert.equal(first.r.headers.get('access-control-allow-origin'),'https://kerala-world.vercel.app');assert.equal(first.data.players[0].z,-2100);assert.equal(first.data.players[0].vehicle,'helicopter');
 await post(b);await post(c);const signal={id:randomUUID(),to:b.id,data:{type:'offer',sdp:'test-offer'}};
 await post({...a,signals:[signal]});await post({...a,signals:[signal]});const received=await post(b);assert.equal(received.data.signals.length,1);assert.equal(received.data.signals[0].from,a.id);assert.equal((await post(c)).data.signals.length,0);
 assert.equal((await post({...a,token:randomUUID(),signals:[{...signal,id:randomUUID()}]})).r.status,401);
 assert.equal((await post({...b,ack:[signal.id]})).data.signals.length,0);
 await post({...b,voice:false});await post({...a,signals:[{...signal,id:randomUUID()}]});assert.equal((await post({...b,voice:true})).data.signals.length,0);
 const result=await post(b);assert(!JSON.stringify(result.data.players).includes(a.token));assert(!JSON.stringify(result.data.players).includes('sdp'));
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r))}
});
