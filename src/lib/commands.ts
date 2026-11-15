import {Applicant, CaseState, Policy, assess, initialPolicy} from './domain';
export type Intent='status'|'reason'|'assess'|'documents'|'approval'|'policy'|'list'|'guide'|'help';
export type Command={intent:Intent;matches:Applicant[];explicit:boolean;filter?:'pending'|'declined'|'review'|'all';query:string};
export function identifiers(a:Applicant){const n=a.id.replace(/\D/g,'');return {mobile:`90000${n.padStart(5,'0')}`,account:`0010${n.padStart(8,'0')}`};}
const digits:Record<string,string>={zero:'0',oh:'0',one:'1',two:'2',three:'3',four:'4',five:'5',six:'6',seven:'7',eight:'8',nine:'9'};
export function normaliseSpeech(s:string){return s.toLowerCase().replace(/\b(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/g,w=>digits[w]).replace(/\bp\s+l\b/g,'pl').replace(/\b(\d)\s+(?=\d)/g,'$1').replace(/\b(\d)\s+(?=\d)/g,'$1');}
export function resolveCommand(text:string,applicants:Applicant[],contextId?:string):Command{
 const q=normaliseSpeech(text),compact=q.replace(/[\s()+-]/g,'');
 let intent:Intent=/\b(why|reason|reject|rejected|declined)\b/.test(q)?'reason':'status';
 if(/\b(assess|assessment|eligibility check|run checks|run eligibility|review application)\b/.test(q))intent='assess';
 if(/\b(document|documents|statement|statements|salary slip|evidence)\b/.test(q)&&/\b(show|open|view)\b/.test(q))intent='documents';
 if(/\b(approve|approval|sanction|disburse|disbursement)\b/.test(q))intent='approval';
 const isList=/\b(applications|cases|loans)\b/.test(q)&&/\b(show|list|find|which|waiting|pending|declined|rejected)\b/.test(q);
 const isPolicy=/\b(policy|interest|rate|income|salary|tenure|affordability|percentage|processing|days|eligibility|eligible|credit|bureau|score|cibil|employment|documents required)\b/.test(q)&&intent!=='assess'&&intent!=='documents'&&intent!=='approval'&&!/\b(why|rejected|declined)\b/.test(q);
 const idMatch=q.match(/\bpl[\s-]*(\d{4,})\b/)||q.match(/\bapplication\s*(?:id|number|no)?\s*[:#-]?\s*(\d{4,})\b/);
 const numberMatch=q.match(/\b(?:\d[\s-]*){8,}\b/);
 const hasIdHint=/\b(pl\s*\d|application\s+(id|number)|mobile|phone|account)\b/.test(q)||!!idMatch||!!numberMatch;
 const allTokens=q.replace(/[^a-z0-9 ]/g,' ').split(/\s+/);
 let matches:Applicant[]=[];let explicit=false;
 if(idMatch){explicit=true;matches=applicants.filter(a=>a.id.toLowerCase()===`pl-${idMatch[1]}`);}
 else if(numberMatch){explicit=true;const n=numberMatch[0].replace(/\D/g,'').replace(/^91(?=\d{10}$)/,'');matches=applicants.filter(a=>{const ids=identifiers(a);return ids.mobile===n||ids.account===n});}
 else if(hasIdHint){explicit=true;}
 else {
  const full=applicants.filter(a=>allTokens.includes(a.name.toLowerCase().split(' ')[0])&&allTokens.includes(a.name.toLowerCase().split(' ').at(-1)!));
  const first=applicants.filter(a=>allTokens.includes(a.name.toLowerCase().split(' ')[0]));
  matches=full.length?full:first;
  if(!matches.length&&/\b(arav|aarav)\b/.test(q))matches=applicants.filter(a=>a.id==='PL-1001');
  explicit=matches.length>0||/\b(named|name is|for [a-z]+ [a-z]+)\b/.test(q);
 }
 if(!explicit&&isList)return {intent:'list',matches:[],explicit:false,filter:/declined|rejected/.test(q)?'declined':/review/.test(q)?'review':/pending|waiting|missing|documents/.test(q)?'pending':'all',query:text};
 if(!explicit&&isPolicy)return {intent:'policy',matches:[],explicit:false,query:text};
 if(/\b(teach|tour|onboard|learn|walkthrough|guide|how to|how do i)\b/.test(q)&&!explicit&&intent!=='approval')return {intent:'guide',matches:[],explicit:false,query:text};
 if(!explicit&&/\b(help|commands|what can you do)\b/.test(q))return {intent:'help',matches:[],explicit:false,query:text};
 if(!explicit&&!isPolicy&&!isList){
  const safe=new Set('check find get tell me the a an and or please loan application case status of for with is was were has been why reason rejected reject declined decline pending awaiting waiting documents document show open view run assess assessment eligibility checks review it its this that his her their current selected bank missing statement statements salary slip slips needed required what happened can you now help approve approval sanction disburse disbursement on my account'.split(' '));
  const unknown=allTokens.filter(t=>t&&/^[a-z]+$/.test(t)&&!safe.has(t));
  if(unknown.length)explicit=true;
 }
 if(!explicit&&contextId){matches=applicants.filter(a=>a.id===contextId);}
 return {intent,matches,explicit,query:text};
}
export function applicationStatus(a:Applicant,c?:CaseState){if(c?.stage==='Declined')return 'Declined';if(c&&['Approved','Sanctioned','Accepted','Disbursed'].includes(c.stage))return c.stage;if((!c?.resolved&&a.missing.length)||c?.assessment?.outcome==='pending')return 'Awaiting documents';if(c?.assessment?.outcome==='decline')return 'Decline recommended';if(c?.assessment?.outcome==='review')return 'Needs review';if(c?.assessment?.outcome==='pass')return 'Ready for decision';return 'Received';}
export function seedCaseStates(applicants:Applicant[],policy:Policy=initialPolicy):Record<string,CaseState>{
 const result:Record<string,CaseState>={};
 const priya=applicants.find(a=>a.id==='PL-1002');
 if(priya)result[priya.id]={stage:'Information requested',assessment:assess(priya,policy),note:'Six months of bank statements are required.',resolved:false,events:[]};
 const declined=applicants.find(a=>a.score!==null&&a.score<policy.values.reviewScore&&!a.missing.length);
 if(declined){const evaluation=assess(declined,policy);result[declined.id]={stage:'Declined',assessment:evaluation,note:`Bureau score ${declined.score} is below the minimum review score of ${policy.values.reviewScore}.`,resolved:false,events:[{at:'2026-11-14T08:00:00Z',role:'Credit officer',text:'Declined after credit review.',assessment:evaluation}]};}
 return result;
}
