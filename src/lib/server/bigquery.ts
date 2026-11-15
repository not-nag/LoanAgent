import {createHash} from 'node:crypto';
import {BigQuery,type Query} from '@google-cloud/bigquery';
import type {Applicant} from '../domain';
import type {EvidenceSource,WorkspaceSnapshot} from '../agent-types';

export class EvidenceStoreError extends Error {name='EvidenceStoreError'}
export function bigQueryEnabled(){return process.env.DATA_BACKEND==='bigquery'}
export function bigQueryConfig(){
 const projectId=process.env.GOOGLE_CLOUD_PROJECT||'';
 const datasetId=process.env.BIGQUERY_DATASET||'lendwise_demo';
 const location=process.env.BIGQUERY_LOCATION||'US';
 if(!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)||!/^lendwise_[A-Za-z0-9_]+$/.test(datasetId))throw new EvidenceStoreError('Set a valid GOOGLE_CLOUD_PROJECT and a BIGQUERY_DATASET beginning with lendwise_.');
 return {projectId,datasetId,location};
}
let client:BigQuery|undefined;
export function bigQueryClient(){const {projectId}=bigQueryConfig();return client??=new BigQuery({projectId})}
export type QueryEvidence={backend:'bigquery';table:string;jobId:string|null;sql:string;parameters:Record<string,unknown>;bytesProcessed:string|null};
export async function evidenceQuery<T>(view:string,where='',params:Record<string,unknown>={}):Promise<{rows:T[];provenance:QueryEvidence}>{
 const allowed=['application_evidence','document_evidence','lakehouse_inventory'];
 if(!allowed.includes(view))throw new EvidenceStoreError('Unsupported evidence view.');
 const {projectId,datasetId}=bigQueryConfig();
 const table=`${projectId}.${datasetId}.${view}`,sql=`SELECT * FROM \`${table}\` ${where}`;
 return executeEvidenceQuery<T>(table,sql,params);
}
async function executeEvidenceQuery<T>(table:string,sql:string,params:Record<string,unknown>,displayParams=params,types?:Query['types']):Promise<{rows:T[];provenance:QueryEvidence}>{
 const {location}=bigQueryConfig();
 try{
  const [job]=await bigQueryClient().createQueryJob({query:sql,params,...(types?{types}:{}),location,useLegacySql:false,maximumBytesBilled:'100000000',jobTimeoutMs:20000,labels:{application:'lendwise',purpose:'evidence-read'}});
  const [rows]=await job.getQueryResults({maxResults:1000});
  const [metadata]=await job.getMetadata();
  return {rows:rows as T[],provenance:{backend:'bigquery',table,jobId:job.id||null,sql,parameters:displayParams,bytesProcessed:metadata.statistics?.query?.totalBytesProcessed||null}};
 }catch{throw new EvidenceStoreError('BigQuery evidence is unavailable. Check local Google sign-in, project access, dataset location and run npm run bq:verify. No local fallback was used.');}
}
export function mapApplication(row:Record<string,unknown>):Applicant{
 return {id:String(row.application_id),name:String(row.name),city:String(row.city),employer:String(row.employer),age:Number(row.age),income:Number(row.verified_income),declaredIncome:Number(row.declared_income),existingEmi:Number(row.existing_monthly_emi),amount:Number(row.amount),tenure:Number(row.tenure),score:row.bureau_score==null?null:Number(row.bureau_score),employment:Number(row.employment_months),current:Number(row.current_employer_months),overdue:Boolean(row.current_overdue),identity:Boolean(row.identity_verified),missing:Array.isArray(row.missing_documents)?row.missing_documents.map(String):[],scenario:'BigQuery evidence record'};
}
export async function cloudApplications(id?:string){
 const result=await evidenceQuery<Record<string,unknown>>('application_evidence',id?'WHERE application_id = @applicationId':'ORDER BY application_id LIMIT 1000',id?{applicationId:id}:{});
 return {applicants:result.rows.map(mapApplication),provenance:result.provenance};
}
// Browser-local new applications are explicit unsynced operational records. Cloud-backed
// application facts always take precedence over browser copies; case actions remain local.
export function mergeCloudApplicants(cloud:Applicant[],snapshot:WorkspaceSnapshot){
 const ids=new Set(cloud.map(a=>a.id));
 return [...cloud,...snapshot.applicants.filter(a=>!ids.has(a.id)&&a.scenario==='Created synthetic application')];
}
export async function cloudSources(policyVersion:number,applicationId?:string,resolved=false):Promise<EvidenceSource[]>{
 const where=applicationId?'WHERE application_id = @applicationId AND (NOT requires_resolved OR @resolved)':'WHERE kind = \'guide\' OR (kind = \'policy\' AND policy_version = @policyVersion)';
 const {rows}=await evidenceQuery<Record<string,unknown>>('document_evidence',where+' ORDER BY document_id, chunk_id',applicationId?{applicationId,resolved}:{policyVersion});
 return rows.map(mapCloudSource);
}
export function mapCloudSource(r:Record<string,unknown>):EvidenceSource{return {id:String(r.chunk_id),title:String(r.title),text:String(r.text),source:String(r.source),url:String(r.url),documentId:String(r.document_id),documentVersion:String(r.document_version),checksum:String(r.checksum),...(r.page!=null?{page:Number(r.page)}:{}),...(r.section?{section:String(r.section)}:{}),...(r.policy_version!=null?{policyVersion:Number(r.policy_version)}:{}),...(r.application_id?{applicationId:String(r.application_id)}:{})};}

export const EMBEDDING_MODEL='gemini-embedding-001';
export const EMBEDDING_DIMENSIONS=768;
export function validateEmbedding(vector:unknown):asserts vector is number[]{
 if(!Array.isArray(vector)||vector.length!==EMBEDDING_DIMENSIONS||!vector.every(n=>typeof n==='number'&&Number.isFinite(n))||!vector.some(n=>n!==0))throw new EvidenceStoreError('Invalid document embedding. Rebuild embeddings with npm run bq:index.');
}
export function vectorSearchSql(project:string,dataset:string){
 const table=`${project}.${dataset}.document_embeddings`,documents=`${project}.${dataset}.document_evidence`;
 return `SELECT d.*, v.distance, 1 - v.distance AS similarity
FROM VECTOR_SEARCH(
 (SELECT * FROM \`${table}\`
  WHERE (kind = 'guide' OR (kind = 'policy' AND policy_version = @policyVersion))
    AND embedding_model = @embeddingModel),
 'embedding', (SELECT @queryVector AS embedding),
 top_k => 3, distance_type => 'COSINE', options => '{"use_brute_force":true}'
) v
JOIN \`${documents}\` d
 ON d.chunk_id = v.base.chunk_id AND d.checksum = v.base.checksum AND d.text = v.base.text
WHERE (d.kind = 'guide' OR (d.kind = 'policy' AND d.policy_version = @policyVersion))
 AND v.distance <= 0.6
ORDER BY v.distance, d.chunk_id`;
}
export async function cloudVectorSearch(vector:number[],policyVersion:number){
 validateEmbedding(vector);
 const {projectId,datasetId}=bigQueryConfig(),table=`${projectId}.${datasetId}.document_embeddings`;
 const params={queryVector:vector,policyVersion,embeddingModel:EMBEDDING_MODEL};
 const displayParams={...params,queryVector:{dimensions:vector.length,sha256:createHash('sha256').update(JSON.stringify(vector)).digest('hex'),valuesOmitted:true}};
 const {rows,provenance}=await executeEvidenceQuery<Record<string,unknown>>(table,vectorSearchSql(projectId,datasetId),params,displayParams,{queryVector:['FLOAT64'],policyVersion:'INT64',embeddingModel:'STRING'});
 return {sources:rows.map(mapCloudSource),provenance,matches:rows.map(r=>({chunkId:String(r.chunk_id),similarity:Number(r.similarity)}))};
}
