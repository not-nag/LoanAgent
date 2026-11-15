import assert from 'node:assert/strict';
import {generateApplicants,initialPolicy} from '../../src/lib/domain';
import {seedCaseStates} from '../../src/lib/commands';
async function main(){
 const applicants=generateApplicants();
 const response=await fetch('http://127.0.0.1:3000/api/assistant/',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3000'},body:JSON.stringify({query:'What is the interest rate? Cite the policy.',snapshot:{applicants,cases:seedCaseStates(applicants),policy:initialPolicy,role:'Credit officer'}})});
 assert.equal(response.status,200);
 const events=(await response.text()).trim().split('\n').map(l=>JSON.parse(l));
 const failure=events.find(e=>e.type==='error');assert.ok(!failure,failure?.error);
 const result=events.find(e=>e.type==='result')?.result;assert.ok(result);
 assert.ok(result.sources.some((s:{section:string})=>s.section==='3.3'));
 const retrieval=result.activity.find((a:{tool:string})=>a.tool==='search_documents')?.output.retrieval;
 assert.equal(retrieval.vectorSearch,'BigQuery VECTOR_SEARCH');assert.ok(retrieval.jobId);
 console.log(JSON.stringify({text:result.text,sources:result.sources.map((s:{source:string})=>s.source),retrieval},null,2));
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Assistant RAG verification failed');process.exitCode=1});
