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
 const number=v=>typeof v==='number'&&Number.isFinite(v)?Math.max(-5000,Math.min(5000,v)):0;
 const server=createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(origin==='https://kerala-world.vercel.app'||origin==='https://kerala-world-musthafapm-135s-projects.vercel.app'||/^http:\/\/localhost:\d+$/.test(origin||'')){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');res.setHeader('Access-Control-Max-Age','600')}
  const reply=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))};
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end()}
  if(req.url==='/health'&&req.method==='GET'){expires();return reply(200,{status:'ok',players:players.size})}
  if(req.url!=='/world'||req.method!=='POST')return reply(404,{error:'Not found'});
  const ip=req.socket.remoteAddress||'unknown',now=clock();expires();
  let rate=rates.get(ip);if(!rate||now-rate.at>1000){rate={at:now,count:0};rates.set(ip,rate)}if(++rate.count>800)return reply(429,{error:'Too many requests'});
  if(Number(req.headers['content-length']||0)>32768)return reply(413,{error:'Request too large'});
  let raw='',size=0;
  try {for await(const chunk of req){size+=chunk.length;if(size>32768){reply(413,{error:'Request too large'});return}raw+=chunk.toString('utf8')}
   const b=JSON.parse(raw);if(!b||!validId(b.id)||!validId(b.token))return reply(400,{error:'Invalid session'});
   let player=players.get(b.id);
   if(player&&!safeToken(player.token,b.token))return reply(401,{error:'Invalid session'});
   if(!player&&players.size>=maxPlayers)return reply(503,{error:'World is full. Please try again shortly.'});
   const name=clean(b.name||'Traveler').slice(0,20)||'Traveler';
   if(!player){player={id:b.id,token:b.token,lastMessage:-Infinity,inbox:[],sent:new Map(),voice:false};players.set(b.id,player)}
   Object.assign(player,{name,x:number(b.x),z:number(b.z),y:Math.max(0,Math.min(160,number(b.y))),angle:number(b.angle),driving:!!b.driving,vehicle:['classic','sport','suv','pickup','bike','helicopter'].includes(b.vehicle)?b.vehicle:'classic',seen:now});
   if(typeof b.voice==='boolean'){if(b.voice&&!player.voice&&[...players.values()].filter(p=>p.voice).length>=6)return reply(409,{error:'Voice room is full (6 players)'});player.voice=b.voice}
   if(!player.voice)player.inbox=[];
   if(Array.isArray(b.ack))player.inbox=player.inbox.filter(s=>!b.ack.slice(0,100).includes(s.id));
   for(const [key,at] of player.sent)if(now-at>60000)player.sent.delete(key);
   if(player.voice&&Array.isArray(b.signals))for(const signal of b.signals.slice(0,8)){
    if(!signal||!validId(signal.id)||player.sent.has(signal.id))continue;
    const target=players.get(signal.to);if(!target?.voice||target===player)continue;
    const data=signal.data;if(!data||!['offer','answer','candidate'].includes(data.type)||JSON.stringify(data).length>12000)continue;
    if(target.inbox.length>=100)continue;
    target.inbox.push({id:signal.id,from:player.id,data,at:now});player.sent.set(signal.id,now);
   }
   player.inbox=player.inbox.filter(s=>now-s.at<20000);
   const message=typeof b.message==='string'?clean(b.message).slice(0,240):'';
   if(message){if(now-player.lastMessage<1000)return reply(429,{error:'Please wait a moment before sending again'});player.lastMessage=now;messages.push({id:crypto.randomUUID(),name,text:message});if(messages.length>50)messages.shift()}
   return reply(200,{players:[...players.values()].map(p=>({id:p.id,name:p.name,x:p.x,z:p.z,y:p.y,angle:p.angle,driving:p.driving,vehicle:p.vehicle,voice:p.voice})),messages,signals:player.inbox,serverTime:now});
  }catch{return reply(400,{error:'Invalid request'})}
 });
 server.headersTimeout=10000;server.requestTimeout=15000;server.keepAliveTimeout=5000;
 server.on('close',()=>clearInterval(timer));return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const server=createGameServer();server.listen(Number(process.env.PORT)||3001,'0.0.0.0',()=>console.log('Kerala World backend ready'));const stop=()=>{server.close();setTimeout(()=>process.exit(0),3000).unref()};process.on('SIGTERM',stop);process.on('SIGINT',stop)}
