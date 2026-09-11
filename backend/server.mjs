import { createServer } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export function createGameServer({clock=Date.now,maxPlayers=64}={}) {
 const players=new Map(),messages=[],rates=new Map();
 const expires=()=>{const now=clock();for(const[id,p]of players)if(now-p.seen>20000)players.delete(id);for(const[ip,r]of rates)if(now-r.at>60000)rates.delete(ip)};
 const timer=setInterval(expires,10000);timer.unref();
 const validId=v=>typeof v==='string'&&/^[a-zA-Z0-9-]{16,64}$/.test(v);
 const safeToken=(a,b)=>typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
 const clean=v=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,'').trim();
 const number=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(-700,Math.min(700,v)):0;
 const server=createServer(async(req,res)=>{
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
  if(req.url==='/health'&&req.method==='GET'){expires();return reply(200,{status:'ok',players:players.size})}
  if(req.url!=='/world'||req.method!=='POST')return reply(404,{error:'Not found'});
  const ip=req.socket.remoteAddress||'unknown',now=clock();expires();
  let rate=rates.get(ip);if(!rate||now-rate.at>1000){rate={at:now,count:0};rates.set(ip,rate)}if(++rate.count>160)return reply(429,{error:'Too many requests'});
  if(Number(req.headers['content-length']||0)>4096)return reply(413,{error:'Request too large'});
  let raw='',size=0;
  try {for await(const chunk of req){size+=chunk.length;if(size>4096){reply(413,{error:'Request too large'});return}raw+=chunk.toString('utf8')}
   const b=JSON.parse(raw);if(!b||!validId(b.id)||!validId(b.token))return reply(400,{error:'Invalid session'});
   let player=players.get(b.id);
   if(player&&!safeToken(player.token,b.token))return reply(401,{error:'Invalid session'});
   if(!player&&players.size>=maxPlayers)return reply(503,{error:'World is full. Please try again shortly.'});
   const name=clean(b.name||'Traveler').slice(0,20)||'Traveler';
   if(!player){player={id:b.id,token:b.token,lastMessage:-Infinity};players.set(b.id,player)}
   Object.assign(player,{name,x:number(b.x),z:number(b.z),angle:number(b.angle),driving:!!b.driving,seen:now});
   const message=typeof b.message==='string'?clean(b.message).slice(0,240):'';
   if(message){if(now-player.lastMessage<1000)return reply(429,{error:'Please wait a moment before sending again'});player.lastMessage=now;messages.push({id:crypto.randomUUID(),name,text:message});if(messages.length>50)messages.shift()}
   return reply(200,{players:[...players.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,angle:p.angle,driving:p.driving})),messages});
  }catch{return reply(400,{error:'Invalid request'})}
 });
 server.headersTimeout=10000;server.requestTimeout=15000;server.keepAliveTimeout=5000;
 server.on('close',()=>clearInterval(timer));return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=createGameServer();server.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('Kerala World backend ready'));const stop=()=>{server.close();setTimeout(()=>process.exit(0),3000).unref()};process.on('SIGTERM',stop);process.on('SIGINT',stop)}
