import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {generateApplicants,initialPolicy} from '../src/lib/domain';
const out=process.argv[2]||'data';mkdirSync(out,{recursive:true});
const apps=generateApplicants();
function save(name:string,rows:unknown[]){writeFileSync(join(out,`${name}.ndjson`),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');}
save('applications',apps.map(a=>({...a,customer_id:`C-${a.id}`,synthetic:true,received_at:'2026-11-14T08:00:00Z'})));
save('salary_credits',apps.flatMap(a=>Array.from({length:6},(_,i)=>({customer_id:`C-${a.id}`,application_id:a.id,account_id:`DEMO-${a.id}`,transaction_date:`2026-${String(5+i).padStart(2,'0')}-28`,amount:a.income,currency:'INR',category:'salary',synthetic:true}))));
save('bureau_responses',apps.map(a=>({application_id:a.id,score:a.score,existing_monthly_emi:a.existingEmi,current_overdue:a.overdue,source:'mock_bureau',received_at:'2026-11-14T08:05:00Z',synthetic:true})));
save('policy_versions',[initialPolicy]);console.log(`Exported ${apps.length} applications, ${apps.length*6} salary credits, bureau responses and policy v1 to ${out}.`);
