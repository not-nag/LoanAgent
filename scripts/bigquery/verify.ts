import assert from 'node:assert/strict';
import {cloudApplications,cloudSources,evidenceQuery,bigQueryConfig} from '../../src/lib/server/bigquery';
async function main(){
 const {rows,provenance}=await evidenceQuery<{table_name:string;row_count:number}>('lakehouse_inventory');console.table(rows);console.log('Query provenance:',provenance);
 const {applicants}=await cloudApplications();assert.equal(applicants.length,240);assert.equal(new Set(applicants.map(a=>a.id)).size,240);
 const rohan=applicants.find(a=>a.id==='PL-1003')!;assert.equal(rohan.income,58000);assert.equal(rohan.declaredIncome,75000);assert.equal(rohan.existingEmi,18000);
 assert.equal((await cloudApplications('PL-9999')).applicants.length,0);
 const v1=await cloudSources(1),v2=await cloudSources(2);assert.ok(v1.some(s=>s.section==='3.3'));assert.ok(!v2.some(s=>s.policyVersion===1));
 assert.ok(!(await cloudSources(1,'PL-1002')).some(s=>s.documentId==='PL-1002-statement'));
 assert.ok((await cloudSources(1,'PL-1002',true)).some(s=>s.documentId==='PL-1002-statement'));
 console.log(`Verified live BigQuery evidence in ${bigQueryConfig().projectId}. Enable DATA_BACKEND=bigquery and restart Next.js.`);
}
main().catch(()=>{console.error('Live BigQuery verification failed. Check setup, credentials, permissions and location.');process.exitCode=1});
