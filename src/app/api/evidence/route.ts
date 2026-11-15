import {availableDocuments,extractDocument} from '@/lib/server/document-store';
export const runtime='nodejs';
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;
 const application=params.get('application_id')||undefined,resolved=params.get('resolved')==='true';
 if(application&&!/^PL-\d{4,8}$/.test(application))return Response.json({error:'Invalid application reference.'},{status:400});
 try{
  const docs=availableDocuments(application,resolved);
  const extracted=await Promise.all(docs.map(extractDocument));
  return Response.json({documents:extracted.map(d=>d.info),sources:extracted.flatMap(d=>d.chunks)},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'The source files could not be read.'},{status:500});}
}
