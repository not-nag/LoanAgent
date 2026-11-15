import {bigQueryEnabled,cloudApplications,evidenceQuery} from '@/lib/server/bigquery';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req:Request){
 const url=new URL(req.url),host=req.headers.get('host')||url.host;
 if(!['localhost','127.0.0.1','[::1]'].includes(new URL(`http://${host}`).hostname))return Response.json({error:'Local workspace only.'},{status:403});
 if(!bigQueryEnabled())return Response.json({backend:'local',connected:false},{headers:{'Cache-Control':'no-store'}});
 try{
  const [{applicants,provenance},{rows:inventory}]=await Promise.all([cloudApplications(),evidenceQuery('lakehouse_inventory')]);
  return Response.json({backend:'bigquery',connected:true,applicants,inventory,provenance},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({backend:'bigquery',connected:false,error:'BigQuery is unavailable. Check Google sign-in and run npm run bq:verify.'},{status:503});}
}
