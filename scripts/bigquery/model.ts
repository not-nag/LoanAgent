import {generateApplicants,initialPolicy} from '../../src/lib/domain';
import {identifiers} from '../../src/lib/commands';
import {extractDocument} from '../../src/lib/server/document-store';
import manifest from '../../content/document-manifest.json';
import type {SourceDocument} from '../../src/lib/documents';
export type Field={name:string;type:string;mode?:string};
const fields=(spec:string):Field[]=>spec.split(' ').map(s=>{const [name,type,mode]=s.split(':');return {name,type,...(mode?{mode}:{})}});
export const schemas:Record<string,Field[]>={
 customers:fields('customer_id:STRING name:STRING city:STRING employer:STRING age:INTEGER employment_months:INTEGER current_employer_months:INTEGER mobile:STRING account_id:STRING'),
 applications:fields('application_id:STRING customer_id:STRING declared_income:FLOAT amount:FLOAT tenure:INTEGER identity_verified:BOOLEAN missing_documents:STRING:REPEATED received_at:TIMESTAMP'),
 salary_credits:fields('transaction_id:STRING application_id:STRING customer_id:STRING account_id:STRING transaction_date:DATE amount:FLOAT currency:STRING source:STRING'),
 bureau_responses:fields('application_id:STRING bureau_score:INTEGER existing_monthly_emi:FLOAT current_overdue:BOOLEAN source:STRING received_at:TIMESTAMP'),
 policy_versions:fields('policy_version:INTEGER effective:DATE approved_by:STRING configuration_json:STRING'),
 source_documents:fields('document_id:STRING title:STRING filename:STRING document_version:STRING kind:STRING application_id:STRING policy_version:INTEGER evidence_type:STRING requires_resolved:BOOLEAN effective:DATE checksum:STRING page_count:INTEGER source_uri:STRING ingested_at:TIMESTAMP'),
 document_chunks:fields('chunk_id:STRING document_id:STRING title:STRING text:STRING source:STRING url:STRING page:INTEGER section:STRING checksum:STRING')
};
export async function lakehouseRows(){
 const apps=generateApplicants(),now=new Date().toISOString();
 const rows:Record<string,Record<string,unknown>[]>={
 customers:apps.map(a=>({customer_id:`C-${a.id}`,name:a.name,city:a.city,employer:a.employer,age:a.age,employment_months:a.employment,current_employer_months:a.current,mobile:identifiers(a).mobile,account_id:identifiers(a).account})),
 applications:apps.map(a=>({application_id:a.id,customer_id:`C-${a.id}`,declared_income:a.declaredIncome,amount:a.amount,tenure:a.tenure,identity_verified:a.identity,missing_documents:a.missing,received_at:'2026-11-14T08:00:00Z'})),
 salary_credits:apps.flatMap(a=>Array.from({length:6},(_,i)=>({transaction_id:`SAL-${a.id}-${i}`,application_id:a.id,customer_id:`C-${a.id}`,account_id:identifiers(a).account,transaction_date:`2026-${String(5+i).padStart(2,'0')}-28`,amount:a.income,currency:'INR',source:'generated_core_banking_export'}))),
 bureau_responses:apps.map(a=>({application_id:a.id,bureau_score:a.score,existing_monthly_emi:a.existingEmi,current_overdue:a.overdue,source:'simulated_bureau',received_at:'2026-11-14T08:05:00Z'})),
 policy_versions:[{policy_version:initialPolicy.version,effective:initialPolicy.effective,approved_by:initialPolicy.approvedBy,configuration_json:JSON.stringify(initialPolicy)}],source_documents:[],document_chunks:[]};
 for(const document of manifest as SourceDocument[]){
  const {info,chunks}=await extractDocument(document);
  rows.source_documents.push({document_id:document.id,title:document.title,filename:document.filename,document_version:document.version,kind:document.kind,application_id:document.applicationId||null,policy_version:document.policyVersion||null,evidence_type:document.evidenceType||null,requires_resolved:document.requiresResolved||false,effective:document.effective,checksum:info.checksum,page_count:info.pageCount,source_uri:info.url,ingested_at:now});
  rows.document_chunks.push(...chunks.map(c=>({chunk_id:c.id,document_id:document.id,title:c.title,text:c.text,source:c.source,url:c.url,page:c.page||null,section:c.section||null,checksum:c.checksum})));
 }
 return rows;
}
export function lakehouseViews(project:string,dataset:string){
 const t=(name:string)=>`\`${project}.${dataset}.${name}\``;
 return {
 application_evidence:`SELECT a.*, c.name, c.city, c.employer, c.age, c.employment_months, c.current_employer_months, c.mobile, c.account_id, s.verified_income, s.salary_months, b.bureau_score, b.existing_monthly_emi, b.current_overdue, b.source AS bureau_source FROM ${t('applications')} a JOIN ${t('customers')} c USING(customer_id) JOIN (SELECT application_id, AVG(amount) AS verified_income, COUNT(DISTINCT transaction_date) AS salary_months FROM ${t('salary_credits')} GROUP BY application_id) s USING(application_id) JOIN ${t('bureau_responses')} b USING(application_id)`,
 document_evidence:`SELECT c.*, d.document_version, d.kind, d.application_id, d.policy_version, d.requires_resolved, d.effective, d.source_uri FROM ${t('document_chunks')} c JOIN ${t('source_documents')} d USING(document_id)`,
 lakehouse_inventory:Object.keys(schemas).map(name=>`SELECT '${name}' AS table_name, COUNT(*) AS row_count FROM ${t(name)}`).join(' UNION ALL ')
 };
}
