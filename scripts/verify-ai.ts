/** Optional live smoke test; consumes the configured Gemini project's quota. */
import {loadEnvConfig} from '@next/env';
import assert from 'node:assert/strict';
import {generateApplicants,initialPolicy} from '../src/lib/domain';
import {seedCaseStates} from '../src/lib/commands';
import type {AgentResult} from '../src/lib/agent-types';
loadEnvConfig(process.cwd());
async function main(){
 const applicants=generateApplicants();const snapshot={applicants,cases:seedCaseStates(applicants),policy:initialPolicy,role:'Credit officer'};
 for(const query of ['A customer called from 9000001002. What is holding up her loan?','Run eligibility checks for PL-1001']){
  const response=await fetch('http://127.0.0.1:3000/api/assistant/',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://127.0.0.1:3000'},body:JSON.stringify({query,snapshot})});
  assert.equal(response.status,200,'Assistant endpoint did not accept the request');
  const events=(await response.text()).trim().split('\n').map(line=>JSON.parse(line));
  const failed=events.find(e=>e.type==='error');if(failed)throw Error(failed.error);
  const result=events.find(e=>e.type==='result')?.result as AgentResult;assert.ok(result,'No result returned');
  if(query.startsWith('A customer')){assert.deepEqual(result.ids,['PL-1002']);assert.match(result.text,/statement/i);assert.deepEqual(result.updates,{});}
  else {assert.equal(result.updates['PL-1001']?.stage,'Assessed');assert.equal(result.updates['PL-1001'].assessment?.outcome,'pass');}
  console.log(JSON.stringify({query,kind:result.kind,ids:result.ids,text:result.text,tools:result.activity.map(a=>a.tool),updatedCases:Object.keys(result.updates)}));
 }
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Live verification failed');process.exitCode=1});
