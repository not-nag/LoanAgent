import test from 'node:test';
import assert from 'node:assert/strict';
import {lakehouseRows,lakehouseViews,schemas} from '../scripts/bigquery/model';
import {mapApplication,mergeCloudApplicants,type QueryEvidence} from '../src/lib/server/bigquery';
import {generateApplicants,initialPolicy} from '../src/lib/domain';
import {seedCaseStates} from '../src/lib/commands';
import {runAgent} from '../src/lib/server/agent';
import type {GeminiContent} from '../src/lib/server/gemini';
const provenance:QueryEvidence={backend:'bigquery',table:'test-project.lendwise_demo.application_evidence',jobId:'job-test',sql:'SELECT * FROM `test-project.lendwise_demo.application_evidence` WHERE application_id = @applicationId',parameters:{applicationId:'PL-1003'},bytesProcessed:'1000'};
test('lakehouse sources preserve separate income declarations, transactions and document lineage',async()=>{
 const rows=await lakehouseRows();
 assert.equal(rows.customers.length,240);assert.equal(rows.applications.length,240);assert.equal(rows.salary_credits.length,1440);
 const app=rows.applications.find(r=>r.application_id==='PL-1003')!;assert.equal(app.declared_income,75000);
 const credits=rows.salary_credits.filter(r=>r.application_id===app.application_id);assert.equal(credits.length,6);assert.ok(credits.every(r=>r.amount===58000));
 assert.equal(new Set(rows.customers.map(r=>r.customer_id)).size,240);
 for(const document of rows.source_documents){assert.equal(String(document.checksum).length,64);assert.ok(rows.document_chunks.some(c=>c.document_id===document.document_id));}
 assert.ok(rows.source_documents.find(d=>d.document_id==='PL-1002-statement')?.requires_resolved);
 for(const [name,data] of Object.entries(rows))for(const row of data)assert.deepEqual(Object.keys(row).sort(),schemas[name].map(s=>s.name).sort());
});
test('evidence views aggregate salary credits before joining and retain document version gates',()=>{
 const views=lakehouseViews('test-project','lendwise_demo');assert.match(views.application_evidence,/AVG\(amount\) AS verified_income/);assert.match(views.application_evidence,/GROUP BY application_id/);assert.match(views.application_evidence,/JOIN .*bureau_responses/);assert.match(views.document_evidence,/requires_resolved/);assert.match(views.document_evidence,/policy_version/);
});
test('cloud facts replace browser copies while explicit new applications remain local',()=>{
 const applicants=generateApplicants(),cloud=[{...applicants[0],income:91000}];
 const localNew={...applicants[0],id:'PL-1241',scenario:'Created synthetic application'};
 const result=mergeCloudApplicants(cloud,{applicants:[...applicants,localNew],cases:{},policy:initialPolicy,role:'Credit officer'});
 assert.equal(result.length,2);assert.equal(result[0].income,91000);assert.equal(result[1].id,'PL-1241');
});
test('agent reads authoritative cloud facts and exposes query provenance',async()=>{
 const applicants=generateApplicants(),snapshot={applicants,cases:seedCaseStates(applicants),policy:initialPolicy,role:'Credit officer'};
 const call=(name:string,args:Record<string,unknown>):GeminiContent=>({role:'model',parts:[{functionCall:{name,args}}]});
 const turns=[call('find_applications',{query:'PL-1003',status:'all'}),call('get_application',{application_id:'PL-1003'}),call('run_eligibility_checks',{application_id:'PL-1003'}),call('present_answer',{kind:'case',intent:'assess',application_ids:['PL-1003'],message:'Reviewed.',source_ids:[]})];
 const reads:(string|undefined)[]=[];
 const result=await runAgent('Assess PL-1003',snapshot,[],undefined,undefined,{generate:async()=>turns.shift()!,applications:async id=>{reads.push(id);return {applicants:[{...applicants[2],income:42000}],provenance}}});
 assert.deepEqual(reads,[undefined,'PL-1003','PL-1003']);
 const output=result.activity.find(a=>a.tool==='get_application')?.output as {income:number;data_source:QueryEvidence};assert.equal(output.income,42000);assert.equal(output.data_source.jobId,'job-test');
 assert.ok(result.updates['PL-1003'].assessment!.foir>80);
});
test('cloud failure stops an agent request without local fallback or fabricated activity success',async()=>{
 const applicants=generateApplicants(),activity:unknown[]=[];
 await assert.rejects(runAgent('Find Priya',{applicants,cases:{},policy:initialPolicy,role:'Credit officer'},[],undefined,a=>activity.push(a),{generate:async()=>({role:'model',parts:[{functionCall:{name:'find_applications',args:{query:'Priya',status:'all'}}}]}),applications:async()=>{throw Error('Test cloud unavailable')}}),/Test cloud unavailable/);
 assert.match(JSON.stringify(activity),/"status":"failed"/);
});
test('cloud row mapping preserves null bureau scores and missing evidence',()=>{
 const applicant=mapApplication({application_id:'PL-1',name:'Name',city:'City',employer:'Employer',age:30,verified_income:50000,declared_income:55000,existing_monthly_emi:1000,amount:200000,tenure:24,bureau_score:null,employment_months:24,current_employer_months:12,current_overdue:false,identity_verified:true,missing_documents:['Bank statement (6 months)']});
 assert.equal(applicant.score,null);assert.equal(applicant.income,50000);assert.deepEqual(applicant.missing,['Bank statement (6 months)']);
});

test('vector search excludes applicant data before matching and validates current source lineage',async()=>{
 const {vectorSearchSql}=await import('../src/lib/server/bigquery');
 const sql=vectorSearchSql('test-project','lendwise_demo');
 const base=sql.slice(sql.indexOf('FROM VECTOR_SEARCH'),sql.indexOf("'embedding',"));
 assert.match(base,/kind = 'guide' OR \(kind = 'policy' AND policy_version = @policyVersion\)/);
 assert.match(base,/embedding_model = @embeddingModel/);
 assert.match(sql,/COSINE/);assert.match(sql,/use_brute_force/);assert.match(sql,/checksum = v.base.checksum/);assert.match(sql,/d.text = v.base.text/);
 assert.match(sql,/@queryVector/);assert.doesNotMatch(sql,/SELECT v.base.\*/);
});
test('malformed embeddings cannot reach a BigQuery request',async()=>{
 const {validateEmbedding,cloudVectorSearch}=await import('../src/lib/server/bigquery');
 for(const vector of [[],[1,2],Array(768).fill(0),[NaN,...Array(767).fill(1)],[Infinity,...Array(767).fill(1)]]){
  assert.throws(()=>validateEmbedding(vector),/Invalid document embedding/);
  await assert.rejects(cloudVectorSearch(vector,1),/Invalid document embedding/);
 }
 assert.doesNotThrow(()=>validateEmbedding([1,...Array(767).fill(0)]));
});
test('agent search activity preserves the actual vector-query trace and retrieved citations',async()=>{
 const applicants=generateApplicants();
 const call=(name:string,args:Record<string,unknown>):GeminiContent=>({role:'model',parts:[{functionCall:{name,args}}]});
 const turns=[call('search_documents',{query:'rate'}),call('present_answer',{kind:'policy',intent:'policy',application_ids:[],message:'12% annually.',source_ids:['S1']})];
 const result=await runAgent('What is the rate?',{applicants,cases:{},policy:initialPolicy,role:'Credit officer'},[],undefined,undefined,{generate:async()=>turns.shift()!,search:async(_q,_policy,trace)=>{trace?.({...provenance,vectorSearch:'BigQuery VECTOR_SEARCH',matches:[{chunkId:'rate',similarity:.8}]});return [{id:'rate',title:'Rate',text:'12% annually.',source:'Policy v1 §3.3',url:'/documents/policy.pdf',policyVersion:1}]}});
 const output=result.activity.find(a=>a.tool==='search_documents')?.output as {retrieval:{vectorSearch:string;jobId:string}};
 assert.equal(output.retrieval.vectorSearch,'BigQuery VECTOR_SEARCH');assert.equal(output.retrieval.jobId,'job-test');assert.equal(result.sources[0].id,'S1');
});
