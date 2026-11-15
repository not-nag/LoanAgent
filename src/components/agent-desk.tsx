'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUp,Check,ChevronDown,FileText,GraduationCap,LoaderCircle,Mic,Square,X} from 'lucide-react';
import {Button} from './ui/button';
import {Applicant,Assessment,CaseState,Policy,label,money} from '@/lib/domain';
import {applicationStatus,Command,identifiers} from '@/lib/commands';
import {Clause,clauses} from '@/lib/knowledge';
import type {TourEvent} from '@/lib/guided-tour';
import {AgentActivityPanel} from './agent-activity';
import type {AgentActivity,AgentResult,EvidenceSource} from '@/lib/agent-types';
import {cn} from '@/lib/utils';
import {BANK_NAME} from '@/lib/branding';

type RecognitionEvent={resultIndex:number;results:{length:number;[index:number]:{isFinal:boolean;[index:number]:{transcript:string}}}};
type Recognition={lang:string;continuous:boolean;interimResults:boolean;onresult:((e:RecognitionEvent)=>void)|null;onerror:((e:{error:string})=>void)|null;onend:(()=>void)|null;start:()=>void;stop:()=>void;abort:()=>void};
type SpeechWindow=Window&{SpeechRecognition?:new()=>Recognition;webkitSpeechRecognition?:new()=>Recognition};
type Activity=AgentActivity;
type Answer={activity?:Activity[];kind:'case'|'list'|'choose'|'policy'|'text'|'guide';query:string;intent?:Command['intent'];ids?:string[];text?:string;sources?:EvidenceSource[];filter?:string};
type Props={applicants:Applicant[];cases:Record<string,CaseState>;policy:Policy;initialQuery?:{text:string;id:number};composeRequest?:{text:string;id:number};onTourEvent?:(event:TourEvent)=>void;onResult?:(result:AgentResult)=>void;onError?:(message:string)=>void;role:string;onUpdates:(updates:Record<string,CaseState>)=>void;onOpen:(id:string,tab?:string)=>void;onAssess:(id:string)=>Assessment;onSource:(c:Clause)=>void;onTour:()=>void;onPolicy:()=>void};
function statusTone(status:string){return /declin/.test(status.toLowerCase())?'declined':/awaiting|review/.test(status.toLowerCase())?'pending':/approved|disbursed|ready|accepted|sanctioned/.test(status.toLowerCase())?'approved':'';}
function clean(text:string){return text.replace(/synthetic |mock /gi,'').replace(/Required documents present; identity match\./,'Required documents verified.');}
export function AgentDesk({applicants,cases,policy,initialQuery,composeRequest,onTourEvent,onResult,onError,role,onUpdates,onOpen,onAssess,onSource,onTour,onPolicy}:Props){
 const [input,setInput]=useState(''),[answer,setAnswer]=useState<Answer|null>(null),[context,setContext]=useState<string>(),[working,setWorking]=useState(false),[listening,setListening]=useState(false),[voiceError,setVoiceError]=useState(''),[heard,setHeard]=useState(''),[speechSupported,setSpeechSupported]=useState<boolean|null>(null),[expanded,setExpanded]=useState(false),[past,setPast]=useState<string[]>([]),[activity,setActivity]=useState<Activity[]>([]);
 const recognizer=useRef<Recognition|null>(null),composer=useRef<HTMLTextAreaElement>(null),request=useRef<(text:string)=>void>(()=>{}),conversation=useRef<{role:"user"|"assistant";content:string}[]>([]),abort=useRef<AbortController|null>(null),lastQuery=useRef(0),lastCompose=useRef(0),requestSequence=useRef(0);
 useEffect(()=>{const w=window as SpeechWindow;setSpeechSupported(!!(w.SpeechRecognition||w.webkitSpeechRecognition));return()=>{requestSequence.current++;recognizer.current?.abort();abort.current?.abort()}},[]);
 async function submit(text:string){if(!text.trim()||working)return;recognizer.current?.abort();setListening(false);setHeard('');setVoiceError('');setInput('');setExpanded(false);setWorking(true);setActivity([]);setPast(p=>[text,...p.filter(x=>x!==text)].slice(0,4));
  setAnswer({kind:'text',query:text,text:''});
  const requestId=++requestSequence.current;const controller=new AbortController();abort.current=controller;
  try{
   const response=await fetch('/api/assistant/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:text,contextId:context,snapshot:{applicants,cases,policy,role},history:conversation.current.slice(-10)}),signal:controller.signal});
   if(!response.ok){const data=await response.json();throw new Error(data.error||'The assistant is unavailable. Please try again.')}
   const reader=response.body!.getReader(),decoder=new TextDecoder();let buffer='',completed=false;
   const consume=(line:string)=>{
    if(!line.trim()||requestId!==requestSequence.current)return;const event=JSON.parse(line);
    if(event.type==='activity')setActivity(items=>{const next=event.activity as AgentActivity;return items.some(item=>item.id===next.id)?items.map(item=>item.id===next.id?next:item):[...items,next]});
    if(event.type==='error')throw new Error(event.error);
    if(event.type==='result'){
     const result=event.result as AgentResult;completed=true;onResult?.(result);
     if(Object.keys(result.updates).length)onUpdates(result.updates);
     setAnswer({kind:result.kind,query:text,intent:result.intent,ids:result.ids,text:result.text,sources:result.sources});
     if(result.ids.length===1)setContext(result.ids[0]);
     conversation.current=[...conversation.current,{role:'user',content:text},{role:'assistant',content:result.text}].slice(-10) as typeof conversation.current;
     if(result.action?.type==='tour')onTour();
     if(result.action?.type==='policy')onPolicy();
     if(result.action?.id&&(result.action.type==='application'||result.action.type==='documents'))onOpen(result.action.id,result.action.type==='documents'?'documents':'assessment');
    }
   };
   while(true){const {value,done}=await reader.read();buffer+=decoder.decode(value,{stream:!done});const lines=buffer.split('\n');buffer=lines.pop()||'';for(const line of lines)consume(line);if(done)break;}
   consume(buffer);if(!completed)throw new Error('The connection ended before an answer arrived. Please try again.');
  }catch(error){if(requestId===requestSequence.current&&!(error instanceof DOMException&&error.name==='AbortError')){const message=error instanceof Error?error.message:'The assistant could not complete the request. Please try again.';setAnswer({kind:'text',query:text,text:message});onError?.(message);}}
  finally{if(requestId===requestSequence.current)setWorking(false)}
 }
 useEffect(()=>{if(composeRequest&&composeRequest.id!==lastCompose.current){lastCompose.current=composeRequest.id;requestSequence.current++;abort.current?.abort();recognizer.current?.abort();setWorking(false);setListening(false);setHeard('');setAnswer(null);setContext(undefined);conversation.current=[];setActivity([]);setInput(composeRequest.text);composer.current?.focus({preventScroll:true});}},[composeRequest]);
 request.current=submit;
 useEffect(()=>{if(initialQuery&&initialQuery.id!==lastQuery.current){lastQuery.current=initialQuery.id;request.current(initialQuery.text)}},[initialQuery]);
 function startVoice(){if(listening){recognizer.current?.stop();return}setVoiceError('');const w=window as SpeechWindow;const Engine=w.SpeechRecognition||w.webkitSpeechRecognition;
  if(!Engine){setVoiceError('Voice input isn’t available in this browser. Open this page in Chrome, or type your request.');composer.current?.focus();return}
  const rec=new Engine();recognizer.current=rec;rec.lang='en-IN';rec.continuous=false;rec.interimResults=true;let finalText='';setHeard('');
  rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const value=e.results[i][0].transcript;if(e.results[i].isFinal)finalText+=value+' ';else interim+=value;}setHeard((finalText+interim).trim());if(finalText.trim()){const transcript=finalText.trim();finalText='';request.current(transcript);}};
  rec.onerror=e=>{setListening(false);setHeard('');const errors:Record<string,string>={'not-allowed':'Microphone access was denied. Allow it in your browser, or type your request.','audio-capture':'No microphone was found. Connect one, or type your request.','network':'The speech service is unavailable. Check your connection or type your request.','no-speech':'No speech detected. Try again, or type your request.','service-not-allowed':'Speech recognition is unavailable in this browser. Try Chrome or type your request.'};if(e.error!=='aborted')setVoiceError(errors[e.error]||'Voice input stopped. Please try again or type your request.');};
  rec.onend=()=>{setListening(false);setHeard('')};try{rec.start();setListening(true)}catch{setVoiceError('Could not start the microphone. Try again or type your request.');setListening(false)}
 }
 function choose(id:string){submit(`Use application ${id} for my previous request: ${answer?.query||'check status'}`)}
 function recordList(){return applicants.filter(a=>answer?.ids?.includes(a.id));}
 const current=answer?.kind==='case'&&answer?.ids?.length===1?applicants.find(a=>a.id===answer.ids![0]):undefined;
 const state=current?cases[current.id]:undefined;const assessment=state?.assessment;const status=current?applicationStatus(current,state):'';
 const findings=assessment?.checks.filter(c=>c.outcome!=='pass')||[];
 const missing=current&&!state?.resolved?current.missing:[];
 const compactReason=current?answer?.intent==='reason'?state?.stage==='Declined'?state.note:assessment?.outcome==='decline'?findings.map(c=>clean(c.detail)).join(' '):`This application has not been declined.${missing.length?' It is waiting for documents.':status==='Needs review'?' It needs an officer review.':''}`:missing.length?`${missing.join(', ')} required.`:state?.stage==='Declined'?state.note:findings.length?findings.map(c=>c.name).join(' · '):assessment?'All eligibility checks passed. Ready for an officer decision.':'Application received. Run eligibility checks to continue.':'';
 return <section className={cn('agent-desk',answer&&'has-answer')}>
  {!answer?<div className="agent-intro"><div className="agent-overline">{BANK_NAME} · PERSONAL LENDING</div><h1>What would you like to check?</h1><p>Find an application. Understand a decision. Take the next step.</p></div>:<div className="agent-conversation-head"><span>Lending assistant</span><Button size="sm" variant="ghost" disabled={working} onClick={()=>{setAnswer(null);setContext(undefined);conversation.current=[];setExpanded(false);setInput('');recognizer.current?.abort();composer.current?.focus()}}>New request<X size={13}/></Button></div>}
  {answer&&<div className="agent-result" aria-live="polite"><div className="agent-query">{answer.query}</div><AgentActivityPanel activity={activity} working={working} onInspect={()=>onTourEvent?.("activity-opened")}/>
   {current&&<article className="loan-result"><header><div><span className="case-ref">{current.id}</span><h2>{current.name}</h2></div><span className={cn('loan-status',statusTone(status))}>{status}</span></header><div className="loan-result-facts"><div><span>Requested</span><strong>{money(current.amount)}</strong></div><div><span>Tenure</span><strong>{current.tenure} months</strong></div>{assessment&&(answer.intent==='assess'||answer.intent==='approval')&&<div><span>Monthly EMI</span><strong>{money(assessment.emi)}</strong></div>}</div><p className="result-summary">{answer.text||compactReason}</p>
    {answer.intent==='documents'&&<div className="agent-document-list">{['Identity evidence','Salary slips (3 months)','Bank statement (6 months)'].map(d=><div key={d}><FileText size={15}/><span>{d}</span><small>{missing.includes(d)?'Required':'Available'}</small></div>)}</div>}
    {answer.intent==='approval'&&<p className="result-summary">{state?.assessment?'Review the findings and record your decision in the application.':'Run eligibility checks before recording a decision.'}</p>}
    <div className="result-actions"><Button id="agent-open-application" size="sm" onClick={()=>onOpen(current.id,answer.intent==='documents'?'documents':'assessment')}>{answer.intent==='approval'?'Review decision':'Open application'}<ArrowRight size={13}/></Button>{!assessment&&!['Declined','Disbursed'].includes(status)&&<Button size="sm" variant="outline" disabled={working} onClick={()=>submit(`Run checks for ${current.id}`)}>Run checks</Button>}{missing.length>0&&<Button size="sm" variant="outline" onClick={()=>onOpen(current.id,'documents')}>View documents</Button>}<button className="result-detail-toggle" onClick={()=>setExpanded(v=>!v)}>{expanded?'Less':'Details'}<ChevronDown size={13} className={expanded?'rotate-180':''}/></button></div>
    {expanded&&<div className="agent-evidence"><dl><div><dt>Mobile</dt><dd>{identifiers(current).mobile}</dd></div><div><dt>Account ID</dt><dd>{identifiers(current).account}</dd></div><div><dt>Verified income</dt><dd>{money(current.income)} / month</dd></div><div><dt>Bureau score</dt><dd>{current.score??'Not available'}</dd></div></dl>{assessment&&<><p className="agent-policy-reference">Assessment · policy v{assessment.policy.version}{assessment.policy.version!==policy.version?' · reassessment required':''}</p>{assessment.checks.map(c=><div className="agent-check" key={c.name}><span className={c.outcome==='pass'?'passed':'attention'}>{c.outcome==='pass'?<Check size={13}/>:<span>!</span>}</span><div><strong>{c.name}</strong><p>{clean(c.detail)}</p></div><button onClick={()=>onSource(clauses(assessment.policy).find(p=>p.id===c.clause.split('–')[0])||{id:c.clause,title:c.name,source:`Assessment · ${current.id}`,text:clean(c.detail)})}>§{c.clause}</button></div>)}</>}</div>}
   </article>}
   {answer.kind==='choose'&&<div className="agent-list-result"><h2>Which applicant do you mean?</h2>{answer.text&&<p className="result-summary">{answer.text}</p>}{(answer.ids?.length||0)>8&&<p className="result-summary">{answer.ids?.length} matches. Add a last name or application ID to narrow your search.</p>}{answer.ids?.slice(0,8).map(id=>{const a=applicants.find(a=>a.id===id)!;return <button className="agent-match" key={id} onClick={()=>choose(id)}><span><strong>{a.name}</strong><small>{a.id} · {a.city} · Mobile ending {identifiers(a).mobile.slice(-4)}</small></span><ArrowRight size={15}/></button>})}</div>}
   {answer.kind==='list'&&<div className="agent-list-result"><div className="result-list-heading"><h2>Applications</h2><span>{recordList().length}</span></div>{answer.text&&<p className="result-summary">{answer.text}</p>}{recordList().length?recordList().slice(0,expanded?30:5).map(a=><button className="agent-match" key={a.id} onClick={()=>submit(`Check status of ${a.id}`)}><span><strong>{a.name}</strong><small>{a.id} · {money(a.amount)}</small></span><span className="match-status">{applicationStatus(a,cases[a.id])}<ArrowRight size={14}/></span></button>):<p className="result-summary">No applications match that status.</p>}{recordList().length>5&&<button className="result-detail-toggle mt-4" onClick={()=>setExpanded(v=>!v)}>{expanded?'Show fewer':'Show more'}<ChevronDown size={13}/></button>}</div>}
   {answer.kind==='policy'&&<div className="agent-policy-result"><h2>Bank policy</h2><p>{answer.text}</p></div>}
   {(answer.kind==='text'||answer.kind==='guide')&&<div className="agent-text-result"><p>{answer.text}</p>{answer.kind==='guide'&&<div className="result-actions"><Button size="sm" onClick={onTour}>Start walkthrough<ArrowRight size={13}/></Button><Button size="sm" variant="outline" onClick={onPolicy}>Bank policy</Button></div>}</div>}
   {!!answer.sources?.length&&<div id="agent-sources" className="agent-policy-result">{answer.sources.map(c=><button key={c.id} className="citation" onClick={()=>onSource(c)}>{c.source}<FileText size={12}/></button>)}</div>}
   {working&&<p className="result-summary flex items-center gap-2"><LoaderCircle size={14} className="animate-spin"/>{activity.at(-1)?.result||'Connecting to assistant…'}</p>}
  </div>}
  <div className="agent-composer-wrap"><form id="agent-composer" className={cn('agent-composer',listening&&'listening')} onSubmit={e=>{e.preventDefault();submit(input)}}><textarea ref={composer} rows={2} aria-label="Ask lending assistant" placeholder={context?'Ask a follow-up…':'Ask about a name, application ID, mobile or account…'} value={listening?heard||'Listening…':input} readOnly={listening} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit(input)}}}/><div className="composer-tools"><span>{working?'Checking…':listening?'Listening. Speak your request.':context?`Following ${context}`:'Type or speak your request'}</span><div className="flex items-center gap-2">{context&&<button type="button" className="clear-context" onClick={()=>{setContext(undefined);conversation.current=[];setAnswer(null)}} aria-label="Clear application context"><X size={12}/></button>}<Button type="button" variant="ghost" size="icon" aria-label={listening?'Stop listening':'Use microphone'} aria-pressed={listening} title={speechSupported===false?'Voice may not be available in this browser':'Speak your request'} onClick={startVoice} disabled={working}>{listening?<Square size={16}/>:<Mic size={18}/>}</Button><Button id="agent-send" type="submit" size="icon" aria-label="Send request" disabled={!input.trim()||working||listening}>{working?<LoaderCircle size={17} className="animate-spin"/>:<ArrowUp size={18}/>}</Button></div></div></form>{voiceError&&<p className="voice-error" role="alert">{voiceError}</p>}{listening&&<p className="voice-caption">Speech is handled by your browser’s recognition service.</p>}</div>
  {!answer&&<div className="agent-starters">{["Check Priya Sharma’s status",'Show declined applications','What is the interest rate?'].map(q=><button key={q} onClick={()=>submit(q)} disabled={working}>{q}<ArrowRight size={12}/></button>)}</div>}
  {answer&&context&&<div className="agent-followups">{['Why is it pending?','Show documents','Run eligibility checks'].map(q=><button key={q} disabled={working} onClick={()=>submit(q)}>{q}</button>)}</div>}
  {!answer&&<button className="agent-tour-launch" onClick={onTour}><GraduationCap size={15}/>Take a guided tour<ArrowRight size={13}/></button>}
  {!answer&&past.length>0&&<details className="agent-recent"><summary>Recent requests</summary>{past.map(q=><button key={q} onClick={()=>submit(q)}>{q}</button>)}</details>}
 </section>;
}
