import test from 'node:test';
import assert from 'node:assert/strict';
import {assess,initialPolicy,featured,calculateEmi,validatePolicy,canApprove,blankCase,generateApplicants} from '../src/lib/domain';
import {retrieve} from '../src/lib/knowledge';
test('three scenarios produce approval, pending and review with evidence',()=>{
 assert.equal(assess(featured[0],initialPolicy).outcome,'pass');
 assert.equal(assess(featured[1],initialPolicy).outcome,'pending');
 const r=assess(featured[2],initialPolicy);assert.equal(r.outcome,'review');assert.ok(r.foir>50);assert.ok(r.checks.every(c=>c.source&&c.clause));
});
test('zero-rate EMI and reducing balance calculation',()=>{assert.equal(calculateEmi(120000,0,12),10000);assert.ok(Math.abs(calculateEmi(500000,12,36)-16607.15)<.1);assert.throws(()=>calculateEmi(500000,12,0));});
test('missing documents block approval; a replacement requires a fresh run',()=>{const r=assess(featured[1],initialPolicy);assert.equal(canApprove({...blankCase(),stage:'Assessed',assessment:r},initialPolicy),false);const r2=assess({...featured[1],missing:[]},initialPolicy);assert.equal(r2.outcome,'pass');});
test('policy snapshots are immutable and a new active version blocks stale approvals',()=>{const p=structuredClone(initialPolicy);const r=assess(featured[0],p);p.values.maxFoir=20;p.version=2;assert.equal(r.policy.values.maxFoir,50);assert.equal(canApprove({...blankCase(),stage:'Assessed',assessment:r},p),false);assert.equal(assess(featured[0],p).outcome,'review');});
test('invalid ranges cannot be activated',()=>{const p=structuredClone(initialPolicy);p.values.reviewScore=850;p.values.minAmount=2000000;assert.equal(validatePolicy(p).length,2);});
test('maturity age, no credit score and income conflict are evaluated explicitly',()=>{assert.equal(assess({...featured[0],age:59},initialPolicy).outcome,'decline');assert.equal(assess({...featured[0],score:null},initialPolicy).outcome,'review');assert.equal(assess({...featured[0],declaredIncome:130000},initialPolicy).outcome,'review');});
test('configured failure action changes recommendation and does not override document gate',()=>{const p=structuredClone(initialPolicy);p.actions.maxFoir='decline';assert.equal(assess(featured[2],p).outcome,'decline');assert.equal(assess({...featured[2],missing:['Bank statement']},p).outcome,'pending');});
test('retrieval uses active policy values and abstains on unrelated questions',()=>{const p=structuredClone(initialPolicy);p.values.annualRate=14;assert.match(retrieve('What is the interest rate?',p)[0].text,/14%/);assert.equal(retrieve('quantum astronomy planets',p).length,0);});
test('generated portfolio is reproducible and has unique references',()=>{const a=generateApplicants();assert.equal(a.length,240);assert.equal(new Set(a.map(x=>x.id)).size,240);assert.deepEqual(a,generateApplicants());});
test('rate retrieval does not match unrelated words containing rate',()=>{const found=retrieve('What is the interest rate?',initialPolicy);assert.equal(found.length,1);assert.equal(found[0].id,'3.3');});
