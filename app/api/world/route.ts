import deployment from '../../../deployment.json';
export const runtime='nodejs';
export const maxDuration=30;
export async function POST(req:Request){
 const base=process.env.RENDER_BACKEND_URL||deployment.backendUrl||(process.env.NODE_ENV==='production'?'':'http://127.0.0.1:3001');
 if(!base)return Response.json({error:'Multiplayer server is not configured'},{status:503});
 if(Number(req.headers.get('content-length')||0)>4096)return new Response('Request too large',{status:413});
 try{const body=await req.text();if(new TextEncoder().encode(body).length>4096)return new Response('Request too large',{status:413});
 const upstream=await fetch(`${base.replace(/\/$/,'')}/world`,{method:'POST',headers:{'Content-Type':'application/json'},body,cache:'no-store',signal:AbortSignal.timeout(12000)});
 return new Response(await upstream.text(),{status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return Response.json({error:'The multiplayer server is waking up. Reconnecting…'},{status:503})}
}
