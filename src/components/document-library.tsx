'use client';
import {useEffect,useState} from 'react';
import {FileText,ExternalLink} from 'lucide-react';
import type {DocumentInfo} from '@/lib/documents';
import type {EvidenceSource} from '@/lib/agent-types';
import type {Clause} from '@/lib/knowledge';
export function DocumentLibrary({policyVersion,onSource}:{policyVersion:number;onSource:(source:Clause)=>void}){
 const [documents,setDocuments]=useState<DocumentInfo[]>([]),[sources,setSources]=useState<EvidenceSource[]>([]),[error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController();fetch('/api/evidence/',{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Source files could not be loaded.');return r.json()}).then(data=>{setDocuments(data.documents);setSources(data.sources)}).catch(e=>{if(e.name!=='AbortError')setError('Source files could not be loaded.')});return()=>controller.abort()},[]);
 return <details id="source-library" className="panel source-library"><summary><FileText size={15}/><span>Source documents</span><small>{documents.length} files</small></summary><div className="source-library-body">{error&&<p role="alert">{error}</p>}{!error&&!documents.length&&<p>Loading source files…</p>}{documents.length>0&&!documents.some(d=>d.kind==='policy'&&d.policyVersion===policyVersion)&&<p className="source-version-notice">No source policy file is attached to rule version {policyVersion}. The assistant will not cite an earlier file as the current policy.</p>}{documents.map(d=><div className="source-library-row" key={d.id}><FileText size={17}/><div><strong>{d.title}</strong><small>Version {d.version} · {d.filename.endsWith('.pdf')?`${d.pageCount} page${d.pageCount===1?'':'s'}`:'Text document'} · Effective {d.effective}</small></div><button onClick={()=>onSource({...sources.find(s=>s.documentId===d.id)!,title:d.title,text:sources.filter(s=>s.documentId===d.id).map(s=>s.text).join('\n\n')})}>Read</button><a href={d.url} target="_blank" rel="noreferrer" aria-label={`Open ${d.title} original`}><ExternalLink size={14}/></a></div>)}<p className="source-library-note">Original files and extracted excerpts are kept separately from configurable bank rules.</p></div></details>;
}
