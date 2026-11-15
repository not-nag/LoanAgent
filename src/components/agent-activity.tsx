'use client';
import {Check,ChevronDown,Clock3,Code2,LoaderCircle,X} from 'lucide-react';
import type {AgentActivity} from '@/lib/agent-types';
function duration(ms?:number){return ms===undefined?'':ms<1000?`${ms} ms`:`${(ms/1000).toFixed(2)} s`;}
function JsonBlock({label,value}:{label:string;value:unknown}){
 return <div className="trace-payload"><h4>{label}</h4><pre>{JSON.stringify(value,null,2)}</pre></div>;
}
export function AgentActivityPanel({activity,working,onInspect}:{activity:AgentActivity[];working:boolean;onInspect?:()=>void}){
 const tools=activity.filter(s=>s.kind==='tool');
 return <details id="agent-activity" className="agent-activity" onToggle={event=>{if(event.currentTarget.open)onInspect?.()}}><summary><Code2 size={13}/><span>Activity · {tools.length} function {tools.length===1?'call':'calls'}</span>{working&&<LoaderCircle size={12} className="animate-spin"/>}<ChevronDown size={12}/></summary>
  <div className="trace-list">{activity.map((step,i)=><details className="trace-step" key={step.id}>
   <summary><span className={`trace-icon trace-${step.status}`}>{step.status==='running'?<LoaderCircle size={13} className="animate-spin"/>:step.status==='succeeded'?<Check size={13}/>:<X size={13}/>}</span><span className="trace-heading"><span className="trace-name">{step.kind==='model'?`Gemini · turn ${activity.slice(0,i+1).filter(s=>s.kind==='model').length}`:<code>{step.tool}</code>}</span><span className="trace-summary">{step.result}</span></span><span className="trace-timing">{step.durationMs!==undefined&&<><Clock3 size={11}/>{duration(step.durationMs)}</>}</span><ChevronDown size={12}/></summary>
   <div className="trace-body"><dl><div><dt>Status</dt><dd>{step.status==='succeeded'?'Completed':step.status==='running'?'Running':step.status==='blocked'?'Blocked':'Failed'}</dd></div><div><dt>Started</dt><dd>{new Date(step.startedAt).toLocaleTimeString('en-IN',{hour12:false})}</dd></div><div><dt>Runs in</dt><dd>{step.execution}</dd></div></dl>{step.input!==undefined&&<JsonBlock label={step.kind==='model'?'Request context & available functions':'Input arguments'} value={step.input}/>}<JsonBlock label={step.kind==='model'?'Requested functions':'Returned result'} value={step.output??'Waiting for response…'}/></div>
  </details>)}{!activity.length&&<p className="trace-empty">Connecting to the assistant…</p>}</div>
 </details>;
}
