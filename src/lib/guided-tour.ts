import type {Applicant,CaseState,Policy} from './domain';
export type TourEvent='activity-opened'|'source-read'|'map-inspected';
export type TourStep={id:string;chapter:string;title:string;body:string;target:string;page:'Lending assistant'|'Applications'|'Bank policy'|'Our approach'|'Architecture'|'About & FAQ';application?:string;tab?:string;query?:string;wait?:string;fallback?:string};
export const TOUR_STEPS:TourStep[]=[
 {id:'welcome',chapter:'Start here',title:'Explore the assignment, one action at a time',body:'We will open each feature and prepare sample inputs. You click the highlighted controls. This guided session uses prepared cases; your saved workspace is restored when you finish or exit.',target:'agent-composer',page:'Lending assistant'},
 {id:'lookup',chapter:'AI assistant',title:'Ask for a loan status',body:'Priya’s request is filled in. Press Send to let the real assistant find her application. You can also try the microphone instead.',target:'agent-send',page:'Lending assistant',query:'Check Priya Sharma’s loan status',wait:'lookup',fallback:'request-info'},
 {id:'activity',chapter:'AI assistant',title:'See the functions the agent chose',body:'Expand Activity. Each row shows a real model request or function execution. Open a function to inspect its inputs, results and timing.',target:'agent-activity',page:'Lending assistant',wait:'activity-opened'},
 {id:'open-case',chapter:'Application workflow',title:'Open the application',body:'Click Open application on Priya’s result. This takes you from the conversation into the officer workspace.',target:'agent-open-application',page:'Lending assistant',wait:'case-opened'},
 {id:'request-info',chapter:'Missing-document loop',title:'Request the missing statement',body:'Approval is blocked while evidence is missing. Click Request information. A sample reason will be filled in; review it and confirm.',target:'request-information',page:'Applications',application:'PL-1002',tab:'assessment',wait:'information-requested'},
 {id:'supply-doc',chapter:'Missing-document loop',title:'Supply the statement',body:'Click Add statement to supply the prepared source file. The old assessment is invalidated so it cannot be reused.',target:'add-statement',page:'Applications',application:'PL-1002',tab:'documents',wait:'statement-added'},
 {id:'recheck',chapter:'Missing-document loop',title:'Run the checks again',body:'Click Run assessment. The engine now evaluates the complete evidence, calculates EMI and records a recommendation.',target:'run-checks',page:'Applications',application:'PL-1002',tab:'assessment',wait:'priya-assessed'},
 {id:'original',chapter:'Document evidence',title:'Read an original source',body:'Select a salary or statement source file below. Read the excerpt, inspect its original-file link, then close the dialog to continue.',target:'applicant-originals',page:'Applications',application:'PL-1002',tab:'documents',wait:'source-read'},
 {id:'map',chapter:'Document evidence',title:'Follow the evidence connections',body:'Select a node in the map to inspect its linked records or original files. Scroll horizontally to follow the assessment and recommendation.',target:'evidence-map',page:'Applications',application:'PL-1002',tab:'evidence',wait:'map-inspected'},
 {id:'approve',chapter:'Human decision',title:'Record an officer approval',body:'Click Approve application. Review the prepared officer reason and confirm. The assistant never makes this final decision.',target:'approve-application',page:'Applications',application:'PL-1002',tab:'assessment',wait:'approved'},
 {id:'sanction',chapter:'Sanction to disbursement',title:'Issue the sanction',body:'Click Issue sanction to prepare the loan terms from the approved assessment.',target:'issue-sanction',page:'Applications',application:'PL-1002',tab:'assessment',wait:'sanctioned'},
 {id:'accept',chapter:'Sanction to disbursement',title:'Complete the formalities',body:'Review the terms. Tick customer acceptance, loan agreement and repayment mandate, then click Record acceptance.',target:'acceptance-formalities',page:'Applications',application:'PL-1002',tab:'assessment',wait:'accepted'},
 {id:'disburse',chapter:'Sanction to disbursement',title:'Record disbursement',body:'Click Disburse loan and confirm the simulation. The workflow records completion; no real money moves.',target:'disburse-loan',page:'Applications',application:'PL-1002',tab:'assessment',wait:'disbursed'},
 {id:'audit',chapter:'Traceability',title:'Review the audit trail',body:'The timeline records checks, the officer reason, sanction and disbursement. Earlier assessment snapshots remain available for inspection.',target:'application-audit',page:'Applications',application:'PL-1002',tab:'timeline'},
 {id:'risk',chapter:'Risk review',title:'Assess a case that needs review',body:'Rohan’s case is open. Run assessment to see the income discrepancy, credit-review band and affordability finding together.',target:'run-checks',page:'Applications',application:'PL-1003',tab:'assessment',wait:'rohan-assessed'},
 {id:'decline',chapter:'Risk review',title:'Record a different decision',body:'Review Rohan’s findings, then click Decline application. A sample evidence-based reason is prepared for you to review and confirm.',target:'decline-application',page:'Applications',application:'PL-1003',tab:'assessment',wait:'declined'},
 {id:'rate',chapter:'Policy Q&A',title:'Ask a question grounded in a document',body:'The interest-rate question is ready. Press Send. Gemini will choose document search and answer from the indexed policy PDF.',target:'agent-send',page:'Lending assistant',query:'What is the interest rate? Cite the policy document.',wait:'policy-answer',fallback:'agent-assess'},
 {id:'citation',chapter:'Policy Q&A',title:'Inspect the cited page',body:'Click the policy source below the answer. It shows the extracted text, document version and page, with a link to the original PDF. Close it after reading.',target:'agent-sources',page:'Lending assistant',wait:'source-read'},
 {id:'agent-assess',chapter:'Agent actions',title:'Ask the agent to run checks',body:'Press Send on the prepared assessment request. The model chooses the eligibility tool; the numbers are calculated by the rules engine.',target:'agent-send',page:'Lending assistant',query:'Run eligibility checks for PL-1001',wait:'aarav-assessed',fallback:'policy-edit'},
 {id:'policy-edit',chapter:'Configurable bank policy',title:'Submit a prepared policy change',body:'You are now Policy admin. The draft minimum income is filled as ₹30,000. Review the draft, then click Validate & submit. The active policy stays unchanged until review.',target:'policy-submit',page:'Bank policy',wait:'policy-submitted'},
 {id:'policy-review',chapter:'Configurable bank policy',title:'Activate it as the reviewer',body:'The role is now Policy reviewer. Click Approve & activate v2 to publish the validated rule change.',target:'policy-activate',page:'Bank policy',wait:'policy-activated'},
 {id:'stale',chapter:'Configurable bank policy',title:'Reassess against the new version',body:'Aarav’s earlier assessment retains v1. Click Reassess application to evaluate v2. If you skipped the AI assessment earlier, run the first assessment here instead.',target:'run-checks',page:'Applications',application:'PL-1001',tab:'assessment',wait:'current-assessment'},
 {id:'library',chapter:'Document governance',title:'Check which source files exist',body:'Expand Source documents. Rule settings and original PDFs are separate: v2 has no attached policy file yet, so the assistant cannot cite v1 as v2.',target:'source-library',page:'Bank policy'},
 {id:'new',chapter:'Application capture',title:'Create an application',body:'The new-application form is filled with sample details. Record applicant consent, then click Create application.',target:'new-application',page:'Applications',wait:'application-created'},
 {id:'approach',chapter:'Assignment story',title:'Read the two-part business story',body:'This page explains the evidence lakehouse first, then the assistant and human decision workflow built on top of it.',target:'story-content',page:'Our approach'},
 {id:'architecture',chapter:'Assignment story',title:'Inspect the technical architecture',body:'See how sources, preparation, the evidence layer, tools and governance fit together. Implemented features and proposed cloud integrations are distinguished.',target:'story-content',page:'Architecture'},
 {id:'about',chapter:'Finish',title:'You have explored the main features',body:'About includes the scope, implementation limits, FAQ and assignment documents. Finish to restore your saved workspace. You can restart this tour any time.',target:'story-content',page:'About & FAQ'}
];
export type TourCheckpoint={cases:Record<string,CaseState>;applicants:Applicant[];policy:Policy;draftStatus:string;page:string;selected:string|null;signals:string[];sourceOpen:boolean;decisionOpen:boolean;newCaseOpen:boolean};
export function tourCanContinue(step:TourStep,state:TourCheckpoint){
 if(state.sourceOpen||state.decisionOpen||state.newCaseOpen)return false;
 const priya=state.cases['PL-1002'],rohan=state.cases['PL-1003'],aarav=state.cases['PL-1001'];
 switch(step.wait){
  case undefined:return true;
  case 'case-opened':return state.page==='Applications'&&state.selected==='PL-1002';
  case 'information-requested':return !!priya?.events.some(e=>e.text.startsWith('Information requested.'));
  case 'statement-added':return !!priya?.resolved;
  case 'priya-assessed':return !!priya?.resolved&&priya.assessment?.policy.version===state.policy.version;
  case 'approved':return !!priya&&['Approved','Sanctioned','Accepted','Disbursed'].includes(priya.stage);
  case 'sanctioned':return !!priya&&['Sanctioned','Accepted','Disbursed'].includes(priya.stage);
  case 'accepted':return !!priya&&['Accepted','Disbursed'].includes(priya.stage);
  case 'disbursed':return priya?.stage==='Disbursed';
  case 'rohan-assessed':return !!rohan?.assessment;
  case 'declined':return rohan?.stage==='Declined';
  case 'aarav-assessed':return !!aarav?.assessment;
  case 'policy-submitted':return state.draftStatus==='Pending review'||state.policy.version>1;
  case 'policy-activated':return state.policy.version>1;
  case 'current-assessment':return aarav?.assessment?.policy.version===state.policy.version;
  case 'application-created':return state.applicants.some(a=>a.name==='Sana Desai');
  default:return state.signals.includes(step.wait);
 }
}
