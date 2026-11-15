import {runAgent} from '@/lib/server/agent';
import {safeError} from '@/lib/server/gemini';
import {validatePolicy} from '@/lib/domain';
import type {WorkspaceSnapshot} from '@/lib/agent-types';
export const runtime='nodejs';
export const maxDuration=120;
let inFlight=0;const recent:number[]=[];
export async function POST(req:Request){
 const url=new URL(req.url),origin=req.headers.get('origin');
 const localOrigin=new URL(`http://${req.headers.get('host')||url.host}`);
 if(!['localhost','127.0.0.1','[::1]'].includes(localOrigin.hostname)||origin&&origin!==localOrigin.origin)return Response.json({error:'This assistant is available only in the local workspace.'},{status:403});
 if(Number(req.headers.get('content-length'))>500000)return Response.json({error:'Request too large.'},{status:413});
 const now=Date.now();while(recent.length&&recent[0]<now-60000)recent.shift();
 if(inFlight>=2||recent.length>=12)return Response.json({error:'Please wait a moment before sending another request.'},{status:429});
 let body;
 try{const raw=await req.text();if(raw.length>500000)throw Error();body=JSON.parse(raw);}catch{return Response.json({error:'Invalid request.'},{status:400});}
 const {query,snapshot,history=[],contextId}=body as {query:string;snapshot:WorkspaceSnapshot;history:{role:'user'|'assistant';content:string}[];contextId?:string};
 try{
  if(typeof query!=='string'||!query.trim()||query.length>2000||!Array.isArray(snapshot.applicants)||snapshot.applicants.length>500||!snapshot.cases||validatePolicy(snapshot.policy).length||!['Credit officer','Policy admin','Policy reviewer'].includes(snapshot.role)||!Array.isArray(history)||history.length>12||history.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>6000))throw Error();
 }catch{return Response.json({error:'Invalid workspace or request. Refresh and try again.'},{status:400});}
 inFlight++;recent.push(now);
 const encoder=new TextEncoder();
 let disconnected=false;
 const stream=new ReadableStream({cancel(){disconnected=true},async start(controller){
  const send=(data:unknown)=>{if(disconnected||req.signal.aborted)return;try{controller.enqueue(encoder.encode(JSON.stringify(data)+'\n'))}catch{disconnected=true}};
  try{const result=await runAgent(query,snapshot,history,contextId,activity=>send({type:'activity',activity}));send({type:'result',result});}
  catch(e){send({type:'error',error:safeError(e)});}
  finally{inFlight--;if(!disconnected){try{controller.close()}catch{/* Client already disconnected. */}}}
 }});
 return new Response(stream,{headers:{'Content-Type':'application/x-ndjson','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
