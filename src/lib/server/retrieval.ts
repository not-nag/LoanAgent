import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {sourceCorpus} from './document-store';
import {bigQueryEnabled,cloudVectorSearch} from './bigquery';
import type {Policy} from '../domain';
import type {EvidenceSource} from '../agent-types';
import {geminiRequest} from './gemini';
type Chunk=EvidenceSource&{vector:number[]};
type Index={hash:string;chunks:Chunk[]};
const embeddingModel='gemini-embedding-001';
const pending=new Map<string,Promise<Index>>();
export function cosine(a:number[],b:number[]){
 if(a.length!==b.length||!a.length)return 0;
 let dot=0,aa=0,bb=0;for(let i=0;i<a.length;i++){dot+=a[i]*b[i];aa+=a[i]*a[i];bb+=b[i]*b[i]}
 return aa&&bb?dot/Math.sqrt(aa*bb):0;
}
export async function ensureIndex(policy:Policy):Promise<Index>{
 const docs=await sourceCorpus(policy.version),hash=createHash('sha256').update(JSON.stringify({embeddingModel,docs})).digest('hex').slice(0,20);
 if(pending.has(hash))return pending.get(hash)!;
 const promise=(async()=>{
  const dir=path.join(process.cwd(),'.data');await mkdir(dir,{recursive:true});
  const manifest=path.join(dir,`file-knowledge-${hash}.json`);
  try{const cached=JSON.parse(await readFile(manifest,'utf8')) as Index;if(cached.hash===hash&&cached.chunks.length===docs.length&&cached.chunks.every(c=>c.vector.length===768))return cached;}catch{/* Index a new approved content snapshot below. */}
  const result=await geminiRequest<{embeddings:{values:number[]}[]}>(`models/${embeddingModel}:batchEmbedContents`,{requests:docs.map(c=>({model:`models/${embeddingModel}`,content:{parts:[{text:`${c.source}\n${c.text}`}]},taskType:'RETRIEVAL_DOCUMENT',title:c.title,outputDimensionality:768}))});
  if(result.embeddings?.length!==docs.length||result.embeddings.some(e=>e.values.length!==768))throw new Error('INVALID_EMBEDDINGS');
  const index:Index={hash,chunks:docs.map((c,i)=>({...c,vector:result.embeddings[i].values}))};
  await writeFile(path.join(dir,`approved-policy-${hash}.md`),docs.map(c=>`## ${c.source}\n\n${c.text}`).join('\n\n'));
  await writeFile(manifest,JSON.stringify(index));return index;
 })();pending.set(hash,promise);
 try{return await promise}catch(e){pending.delete(hash);throw e;}
}
export async function searchDocuments(query:string,policy:Policy,onRetrieval?:(details:Record<string,unknown>)=>void):Promise<EvidenceSource[]>{
 const result=await geminiRequest<{embedding:{values:number[]}}>(`models/${embeddingModel}:embedContent`,{model:`models/${embeddingModel}`,content:{parts:[{text:query}]},taskType:'RETRIEVAL_QUERY',outputDimensionality:768});
 if(bigQueryEnabled()){
  const found=await cloudVectorSearch(result.embedding.values,policy.version);
  onRetrieval?.({...found.provenance,vectorSearch:'BigQuery VECTOR_SEARCH',embeddingModel,dimensions:768,matches:found.matches});
  return found.sources;
 }
 const index=await ensureIndex(policy);
 onRetrieval?.({documentStore:'Local source files',vectorSearch:'Local cosine similarity',embeddingModel,dimensions:768});
 const ranked=index.chunks.map(c=>({chunk:c,score:cosine(c.vector,result.embedding.values)})).filter(c=>c.score>=.4).sort((a,b)=>b.score-a.score).slice(0,3);
 return ranked.map(({chunk:{vector,...source}})=>source);
}
