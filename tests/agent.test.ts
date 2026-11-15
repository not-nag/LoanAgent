import test from 'node:test';
import assert from 'node:assert/strict';
import {runAgent} from '../src/lib/server/agent';
import {generateApplicants,initialPolicy} from '../src/lib/domain';
import {seedCaseStates} from '../src/lib/commands';
import {cosine} from '../src/lib/server/retrieval';
import {sourceCorpus,applicantSources} from '../src/lib/server/document-store';
import type {GeminiContent} from '../src/lib/server/gemini';
import type {AgentActivity} from '../src/lib/agent-types';
import {GeminiError,safeError} from '../src/lib/server/gemini';
const applicants=generateApplicants();
const snapshot=()=>({applicants,cases:seedCaseStates(applicants),policy:initialPolicy,role:'Credit officer'});
const call=(name:string,args:Record<string,unknown>):GeminiContent=>({role:'model',parts:[{functionCall:{name,args}}]});
const final=(message='Reviewed.',kind='case',ids=['PL-1001'],sources:string[]=[])=>call('present_answer',{kind,intent:'status',application_ids:ids,message,source_ids:sources});
function provider(turns:GeminiContent[]){let n=0;const captured:GeminiContent[][]=[];return {captured,generate:async(_i:string,contents:GeminiContent[])=>{captured.push(structuredClone(contents));assert.ok(n<turns.length,'Agent unexpectedly requested an extra model turn');return turns[n++];}}}
test('model-selected application lookup reads the real pending record',async()=>{
 const p=provider([call('find_applications',{query:'9000001002',status:'all'}),call('get_application',{application_id:'PL-1002'}),final('Awaiting the bank statement.','case',['PL-1002'])]);
 const result=await runAgent('What is holding up this loan?',snapshot(),[],undefined,undefined,{generate:p.generate});
 assert.deepEqual(result.ids,['PL-1002']);assert.equal(result.kind,'case');assert.deepEqual(result.updates,{});
 const data=p.captured[2].at(-1)?.parts[0].functionResponse?.response.result as {status:string;missing:string[]};assert.equal(data.status,'Awaiting documents');assert.deepEqual(data.missing,['Bank statement (6 months)']);
});
test('ambiguous name cannot grant permission to assess one candidate',async()=>{
 const p=provider([call('find_applications',{query:'Neha',status:'all'}),call('run_eligibility_checks',{application_id:'PL-1004'}),final('Please select an applicant.','choose',['PL-1004'])]);
 const result=await runAgent('Assess Neha',snapshot(),[],undefined,undefined,{generate:p.generate});
 assert.deepEqual(result.updates,{});assert.match(JSON.stringify(p.captured[2]),/First find a unique application/);
});
test('server enforces assessment role despite a model requesting the tool',async()=>{
 const p=provider([call('find_applications',{query:'PL-1001',status:'all'}),call('run_eligibility_checks',{application_id:'PL-1001'}),final('Switch role.','text')]);
 const result=await runAgent('Run checks', {...snapshot(),role:'Policy admin'},[],undefined,undefined,{generate:p.generate});
 assert.deepEqual(result.updates,{});assert.match(JSON.stringify(p.captured[2]),/Only the Credit officer/);
});
test('assessment returns a retained deterministic snapshot without approving',async()=>{
 const p=provider([call('find_applications',{query:'PL-1001',status:'all'}),call('run_eligibility_checks',{application_id:'PL-1001'}),final()]);
 const result=await runAgent('Assess PL-1001',snapshot(),[],undefined,undefined,{generate:p.generate});
 assert.equal(result.updates['PL-1001'].stage,'Assessed');assert.equal(result.updates['PL-1001'].assessment?.outcome,'pass');assert.equal(result.updates['PL-1001'].assessment?.policy.version,1);
});
test('invented IDs and citations are removed; unsupported policy answers abstain',async()=>{
 const p=provider([final('A made-up rate.','policy',['PL-9999'],['invented'])]);
 const result=await runAgent('Rate?',snapshot(),[],undefined,undefined,{generate:p.generate});
 assert.deepEqual(result.ids,[]);assert.deepEqual(result.sources,[]);assert.match(result.text,/couldn’t find supporting policy evidence/);
});
test('retrieved excerpts, not model-authored source text, populate citations',async()=>{
 const source={id:'3.3',title:'Rate',source:'Policy §3.3',text:'12% annually.',url:'/policy'};
 const p=provider([call('search_documents',{query:'rate'}),final('12% annually.','policy',[],['S1','invented'])]);
 const result=await runAgent('Rate?',snapshot(),[],undefined,undefined,{generate:p.generate,search:async()=>[source]});
 assert.equal(result.sources.length,1);assert.equal(result.sources[0].text,'12% annually.');
});
test('source corpus extracts the actual PDF and excludes old policy versions',async()=>{
 const sources=await sourceCorpus(1);const rate=sources.find(s=>s.section==='3.3')!;
 assert.match(rate.text,/12%/);assert.equal(rate.documentId,'personal-loan-policy-v1');assert.equal(rate.page,1);assert.match(rate.url,/sample-personal-loan-policy.pdf#page=1/);assert.equal(rate.checksum?.length,64);
 const v2=await sourceCorpus(2);assert.ok(v2.length>0);assert.ok(v2.every(s=>s.policyVersion===undefined));assert.ok(!v2.some(s=>s.documentId==='personal-loan-policy-v1'));
 assert.equal(cosine([1,0],[1,0]),1);assert.equal(cosine([1,0],[0,1]),0);assert.equal(cosine([0,0],[1,0]),0);
});
test('applicant source files remain scoped and missing statements require resubmission',async()=>{
 const before=await applicantSources('PL-1002');assert.ok(before.some(s=>s.documentId==='PL-1002-salary'));assert.ok(!before.some(s=>s.documentId==='PL-1002-statement'));
 const after=await applicantSources('PL-1002',true);assert.ok(after.some(s=>s.documentId==='PL-1002-statement'));assert.ok(after.every(s=>s.applicationId==='PL-1002'));
 const rohan=await applicantSources('PL-1003');assert.match(rohan.find(s=>s.documentId==='PL-1003-salary')!.text,/75000/);assert.match(rohan.find(s=>s.documentId==='PL-1003-statement')!.text,/58000/);
 assert.deepEqual(await applicantSources('PL-9999'),[]);
});
test('provider errors are safe and identify free-tier quota correctly',()=>{
 assert.match(safeError(new GeminiError(429,'RESOURCE_EXHAUSTED')),/free-tier limit/);
 assert.doesNotMatch(safeError(new Error('secret-value')),/secret-value/);
});

test('trace events expose actual tool arguments and result with a stable lifecycle',async()=>{
 const p=provider([call('find_applications',{query:'PL-1002',status:'all'}),call('get_application',{application_id:'PL-1002'}),final('Waiting for documents.','case',['PL-1002'])]);
 const events:AgentActivity[]=[];
 const result=await runAgent('Status?',snapshot(),[],undefined,event=>events.push(structuredClone(event)),{generate:p.generate});
 const lookup=result.activity.find(s=>s.tool==='find_applications')!;
 assert.deepEqual(lookup.input,{query:'PL-1002',status:'all'});
 assert.equal((lookup.output as {matches:{id:string}[]}).matches[0].id,'PL-1002');
 assert.equal(lookup.status,'succeeded');assert.ok(lookup.durationMs!==undefined&&lookup.durationMs>=0);
 assert.deepEqual(events.filter(s=>s.id===lookup.id).map(s=>s.status),['running','succeeded']);
 assert.match(lookup.execution!,/Local server/);
 const model=result.activity.find(s=>s.kind==='model')!;
 assert.ok((model.input as {availableFunctions:{name:string}[]}).availableFunctions.some(t=>t.name==='search_documents'));
});
test('failed tools leave an inspectable trace without exposing raw provider errors',async()=>{
 const p=provider([call('search_documents',{query:'rate'})]);const events:AgentActivity[]=[];
 await assert.rejects(runAgent('Rate?',snapshot(),[],undefined,event=>events.push(structuredClone(event)),{generate:p.generate,search:async()=>{throw Error('private provider internals')}}));
 const last=events.at(-1)!;assert.equal(last.tool,'search_documents');assert.equal(last.status,'failed');assert.doesNotMatch(JSON.stringify(last),/private provider internals/);
});
