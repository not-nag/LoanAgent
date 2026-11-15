import assert from 'node:assert/strict';
import {searchDocuments,cosine} from '../../src/lib/server/retrieval';
import {bigQueryEnabled,cloudVectorSearch,bigQueryClient,bigQueryConfig,EMBEDDING_MODEL,validateEmbedding} from '../../src/lib/server/bigquery';
import {initialPolicy} from '../../src/lib/domain';
import {geminiRequest,safeError} from '../../src/lib/server/gemini';
async function main(){
 assert.ok(bigQueryEnabled(),'Enable DATA_BACKEND=bigquery before live RAG verification.');
 let trace:Record<string,unknown>={};
 const rate=await searchDocuments('What is the interest rate?',initialPolicy,d=>trace=d);
 assert.ok(rate.some(s=>s.section==='3.3'&&s.policyVersion===1&&s.page===1));assert.equal(trace.vectorSearch,'BigQuery VECTOR_SEARCH');assert.ok(trace.jobId);
 assert.ok(rate.every(s=>!s.applicationId));console.log('Rate retrieval:',{sources:rate.map(s=>s.source),jobId:trace.jobId,bytesProcessed:trace.bytesProcessed});
 const v2=await searchDocuments('What is the interest rate?',{...initialPolicy,version:2});assert.ok(v2.every(s=>s.policyVersion!==1));
 const instruction=await searchDocuments('How does an employee approve an application?',initialPolicy);assert.ok(instruction.some(s=>s.documentId==='employee-guide-v1'));
 const embedding=await geminiRequest<{embedding:{values:number[]}}>(`models/${EMBEDDING_MODEL}:embedContent`,{model:`models/${EMBEDDING_MODEL}`,content:{parts:[{text:'minimum salary requirement'}]},taskType:'RETRIEVAL_QUERY',outputDimensionality:768});validateEmbedding(embedding.embedding.values);
 const actual=await cloudVectorSearch(embedding.embedding.values,1);
 const {projectId,datasetId,location}=bigQueryConfig();
 const [rows]=await bigQueryClient().query({query:`SELECT chunk_id, embedding FROM \`${projectId}.${datasetId}.document_embeddings\` WHERE kind = 'guide' OR (kind = 'policy' AND policy_version = 1)`,location,maximumBytesBilled:'100000000'});
 const expected=rows.map(r=>({id:r.chunk_id,score:cosine(r.embedding,embedding.embedding.values)})).filter(r=>r.score>=.4).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,3);
 assert.deepEqual(actual.matches.map(m=>m.chunkId),expected.map(m=>m.id));
 actual.matches.forEach((m,i)=>assert.ok(Math.abs(m.similarity-expected[i].score)<1e-8));
 console.log('Passed: exact BigQuery cosine ranking matches independent local calculation; policy versions and applicant isolation hold.');
}
main().catch(e=>{console.error(e instanceof assert.AssertionError?e.message:safeError(e));process.exitCode=1});
