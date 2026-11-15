import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {extractText,getDocumentProxy} from 'unpdf';
import manifest from '../../../content/document-manifest.json';
import type {SourceDocument,DocumentInfo} from '../documents';
import type {EvidenceSource} from '../agent-types';
const documents=manifest as SourceDocument[];
const extracted=new Map<string,Promise<{info:DocumentInfo;chunks:EvidenceSource[]}>>();
export function availableDocuments(applicationId?:string,resolved=false){return documents.filter(d=>applicationId?d.applicationId===applicationId&&(!d.requiresResolved||resolved):d.kind!=='applicant');}
function splitPage(text:string,isPdf:boolean){
 const pattern=isPdf?/^(\d+\.\d+)\s+([^:\n]+):/gm:/^##\s+(\d+\.\d+)\s+([^\n]+)/gm;
 const markers=Array.from(text.matchAll(pattern));
 if(!markers.length)return [{section:undefined,title:undefined,text:text.trim()}];
 return markers.map((m,i)=>({section:m[1],title:m[2].trim(),text:text.slice(m.index,markers[i+1]?.index??text.length).trim()}));
}
export async function extractDocument(document:SourceDocument){
 const file=await readFile(path.join(process.cwd(),'public','documents',document.filename));
 const checksum=createHash('sha256').update(file).digest('hex');
 const cacheKey=`${document.id}:${checksum}`;
 if(extracted.has(cacheKey))return extracted.get(cacheKey)!;
 const promise=(async()=>{
  const isPdf=document.filename.endsWith('.pdf');let pages:string[];
  if(isPdf){
   const pdf=await getDocumentProxy(new Uint8Array(file),{maxImageSize:4000000,isEvalSupported:false});
   try{if(pdf.numPages>40)throw Error('DOCUMENT_PAGE_LIMIT');pages=(await extractText(pdf,{mergePages:false})).text;}finally{await pdf.destroy();}
  }else pages=[file.toString('utf8')];
  if(!pages.some(p=>p.trim().length>30))throw Error('DOCUMENT_NEEDS_OCR');
  const url=`/documents/${document.filename}`;
  const info:DocumentInfo={...document,url,pageCount:pages.length,checksum};
  const chunks:EvidenceSource[]=pages.flatMap((page,p)=>splitPage(page,isPdf).flatMap(section=>{
   const pieces:string[]=[];for(let offset=0;offset<section.text.length;offset+=1200)pieces.push(section.text.slice(offset,offset+1400));
   return pieces.map((text,i)=>({id:`${document.id}:${p+1}:${section.section||'text'}:${i}`,title:section.title||document.title,text,source:`${document.title} · v${document.version}${isPdf?` · p. ${p+1}`:''}${section.section?` · §${section.section}`:''}`,url:isPdf?`${url}#page=${p+1}`:url,documentId:document.id,documentVersion:document.version,page:isPdf?p+1:undefined,section:section.section,checksum,policyVersion:document.policyVersion,applicationId:document.applicationId}));
  }));
  const dir=path.join(process.cwd(),'.data','extracted');await mkdir(dir,{recursive:true});
  await writeFile(path.join(dir,`${checksum}.json`),JSON.stringify({info,pages}));
  return {info,chunks};
 })();extracted.set(cacheKey,promise);
 try{return await promise;}catch(error){extracted.delete(cacheKey);throw error;}
}
export async function sourceCorpus(policyVersion:number){
 const docs=availableDocuments().filter(d=>d.kind==='guide'||d.policyVersion===policyVersion);
 return (await Promise.all(docs.map(extractDocument))).flatMap(d=>d.chunks).map(c=>({...c}));
}
export async function applicantSources(applicationId:string,resolved=false){
 return (await Promise.all(availableDocuments(applicationId,resolved).map(extractDocument))).flatMap(d=>d.chunks).map(c=>({...c}));
}
export async function listDocumentInfo(applicationId?:string,resolved=false){return (await Promise.all(availableDocuments(applicationId,resolved).map(extractDocument))).map(d=>d.info);}
