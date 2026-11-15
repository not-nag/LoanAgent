'use client';
import {useEffect,useState} from 'react';
import {FileText,ExternalLink} from 'lucide-react';
import type {EvidenceSource} from '@/lib/agent-types';
import type {DocumentInfo} from '@/lib/documents';
import type {Clause} from '@/lib/knowledge';
export function ApplicantOriginals({applicationId,resolved,onSource}:{applicationId:string;resolved:boolean;onSource:(source:Clause)=>void}){
 const [sources,setSources]=useState<EvidenceSource[]>([]),[documents,setDocuments]=useState<DocumentInfo[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{const controller=new AbortController();setError('');setLoading(true);setDocuments([]);setSources([]);fetch(`/api/evidence/?application_id=${encodeURIComponent(applicationId)}&resolved=${resolved}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(data=>{setSources(data.sources);setDocuments(data.documents);setLoading(false)}).catch(e=>{if(e.name!=='AbortError'){setError('Source files could not be loaded.');setLoading(false)}});return()=>controller.abort()},[applicationId,resolved]);
 return <section id="applicant-originals" className="applicant-originals"><h3>Original source files</h3>{error&&<p role="alert">{error}</p>}{documents.map(d=><button key={d.id} onClick={()=>{const source=sources.find(s=>s.documentId===d.id);if(source)onSource({...source,title:d.title,text:sources.filter(s=>s.documentId===d.id).map(s=>s.text).join('\n\n')})}}><FileText size={15}/><span>{d.title}<small>{d.filename.split('/').at(-1)} · Revision {d.version}</small></span><ExternalLink size={13}/></button>)}{loading&&<p role="status">Loading source files…</p>}{!loading&&!documents.length&&!error&&<p>No original files are attached to this application. The values above are structured records.</p>}</section>;
}
