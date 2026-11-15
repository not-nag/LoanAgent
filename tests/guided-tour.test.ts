import test from 'node:test';
import assert from 'node:assert/strict';
import {TOUR_STEPS,tourCanContinue,type TourCheckpoint} from '../src/lib/guided-tour';
import {generateApplicants,initialPolicy,assess} from '../src/lib/domain';
import {seedCaseStates} from '../src/lib/commands';
function checkpoint():TourCheckpoint{const applicants=generateApplicants();return {applicants,cases:seedCaseStates(applicants),policy:structuredClone(initialPolicy),draftStatus:'Draft',page:'Lending assistant',selected:null,signals:[],sourceOpen:false,decisionOpen:false,newCaseOpen:false};}
const step=(id:string)=>TOUR_STEPS.find(s=>s.id===id)!;
test('tour checkpoints wait for the real action or successful AI response',()=>{
 const state=checkpoint();assert.equal(tourCanContinue(step('lookup'),state),false);state.signals=['lookup'];assert.equal(tourCanContinue(step('lookup'),state),true);
 assert.equal(tourCanContinue(step('open-case'),state),false);state.page='Applications';state.selected='PL-1002';assert.equal(tourCanContinue(step('open-case'),state),true);
 assert.equal(tourCanContinue(step('request-info'),state),false);state.cases['PL-1002'].events.push({at:'2026-11-15T00:00:00Z',role:'Credit officer',text:'Information requested. Supply the statement.'});assert.equal(tourCanContinue(step('request-info'),state),true);
});
test('statement resubmission requires a fresh assessment before the tour advances',()=>{
 const state=checkpoint();state.cases['PL-1002'].resolved=true;state.cases['PL-1002'].assessment=undefined;
 assert.equal(tourCanContinue(step('supply-doc'),state),true);assert.equal(tourCanContinue(step('recheck'),state),false);
 const applicant=state.applicants.find(a=>a.id==='PL-1002')!;state.cases['PL-1002'].assessment=assess({...applicant,missing:[]},state.policy);assert.equal(tourCanContinue(step('recheck'),state),true);
});
test('tour gates preserve sanction, acceptance and disbursement order',()=>{
 const state=checkpoint();const current=state.cases['PL-1002'];current.stage='Approved';assert.equal(tourCanContinue(step('approve'),state),true);assert.equal(tourCanContinue(step('sanction'),state),false);current.stage='Sanctioned';assert.equal(tourCanContinue(step('sanction'),state),true);assert.equal(tourCanContinue(step('accept'),state),false);current.stage='Accepted';assert.equal(tourCanContinue(step('accept'),state),true);assert.equal(tourCanContinue(step('disburse'),state),false);current.stage='Disbursed';assert.equal(tourCanContinue(step('disburse'),state),true);
});
test('stale assessments cannot satisfy the new-policy checkpoint',()=>{
 const state=checkpoint();state.cases['PL-1001']={stage:'Assessed',note:'',resolved:false,events:[],assessment:assess(state.applicants[0],state.policy)};state.policy.version=2;
 assert.equal(tourCanContinue(step('stale'),state),false);state.cases['PL-1001'].assessment=assess(state.applicants[0],state.policy);assert.equal(tourCanContinue(step('stale'),state),true);
});
test('open source, decision or application dialogs must be completed or closed',()=>{
 const state=checkpoint();state.signals=['source-read'];state.sourceOpen=true;assert.equal(tourCanContinue(step('original'),state),false);state.sourceOpen=false;assert.equal(tourCanContinue(step('original'),state),true);state.decisionOpen=true;assert.equal(tourCanContinue(step('welcome'),state),false);state.decisionOpen=false;state.newCaseOpen=true;assert.equal(tourCanContinue(step('new'),state),false);
});
test('the tour covers all main feature areas and AI fallbacks exist',()=>{
 assert.equal(new Set(TOUR_STEPS.map(s=>s.id)).size,TOUR_STEPS.length);
 for(const s of TOUR_STEPS){assert.ok(s.target);if(s.fallback)assert.ok(TOUR_STEPS.some(next=>next.id===s.fallback));}
 for(const id of ['lookup','activity','original','map','approve','sanction','accept','disburse','audit','risk','decline','rate','citation','agent-assess','policy-edit','policy-review','stale','library','new','approach','architecture','about'])assert.ok(step(id));
});
