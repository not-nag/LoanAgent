import test from 'node:test';
import assert from 'node:assert/strict';
import {generateApplicants} from '../src/lib/domain';
import {resolveCommand,identifiers,normaliseSpeech,applicationStatus,seedCaseStates} from '../src/lib/commands';
const applicants=generateApplicants();
test('resolves application IDs, names, mobile and account references exactly',()=>{
 for(const q of ['Check Priya Sharma status','Check PL-1002','Application ID 1002',`Mobile ${identifiers(applicants[1]).mobile}`,`Account ID ${identifiers(applicants[1]).account}`])assert.equal(resolveCommand(q,applicants).matches[0]?.id,'PL-1002',q);
});
test('spoken digits resolve to the same application',()=>{assert.equal(resolveCommand('Check P L one zero zero two',applicants).matches[0]?.id,'PL-1002');assert.equal(resolveCommand('mobile nine zero zero zero zero zero one zero zero two',applicants).matches[0]?.id,'PL-1002');});
test('unknown explicit identifiers never fall back to a prior applicant',()=>{for(const q of ['Check PL-9999','Mobile 9999999999','Check application ID 109','person named xyz status'])assert.equal(resolveCommand(q,applicants,'PL-1002').matches.length,0,q);});
test('follow-up questions retain context without changing the requested action',()=>{assert.equal(resolveCommand('Why was it rejected?',applicants,'PL-1002').matches[0]?.id,'PL-1002');assert.equal(resolveCommand('Show documents',applicants,'PL-1002').intent,'documents');assert.equal(resolveCommand('Run eligibility checks',applicants,'PL-1002').intent,'assess');});
test('ambiguous names return all candidates rather than selecting the first',()=>{const r=resolveCommand('Find Neha',applicants);assert.ok(r.matches.length>1);});
test('policy, list and guidance requests are distinguished from case lookups',()=>{assert.equal(resolveCommand('What is the interest rate?',applicants).intent,'policy');assert.equal(resolveCommand('Show applications waiting for documents',applicants).filter,'pending');assert.equal(resolveCommand('Show declined applications',applicants).filter,'declined');assert.equal(resolveCommand('Teach me the workflow',applicants).intent,'guide');});
test('initial declined case has a real recorded assessment and reason',()=>{const states=seedCaseStates(applicants);const entry=Object.entries(states).find(([,c])=>c.stage==='Declined')!;assert.ok(entry);assert.equal(entry[1].assessment?.outcome,'decline');assert.ok(entry[1].note);assert.equal(applicationStatus(applicants.find(a=>a.id===entry[0])!,entry[1]),'Declined');assert.equal(applicationStatus(applicants[1],states['PL-1002']),'Awaiting documents');});
test('an unknown new name cannot reuse the previous applicant',()=>{assert.equal(resolveCommand('Check Rahul status',applicants,'PL-1002').matches.length,0);assert.equal(resolveCommand('why was xyz rejected',applicants,'PL-1002').matches.length,0);});
