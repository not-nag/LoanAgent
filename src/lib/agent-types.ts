import type {Applicant,CaseState,Policy} from './domain';
export type WorkspaceSnapshot={applicants:Applicant[];cases:Record<string,CaseState>;policy:Policy;role:string};
export type EvidenceSource={id:string;title:string;text:string;source:string;url:string;documentId?:string;documentVersion?:string;page?:number;section?:string;checksum?:string;policyVersion?:number;applicationId?:string};
export type AgentActivity={id:string;kind:'model'|'tool';tool:string;status:'running'|'succeeded'|'blocked'|'failed';result:string;startedAt:string;durationMs?:number;input?:unknown;output?:unknown;execution?:string};
export type AgentResult={kind:'case'|'list'|'choose'|'policy'|'text'|'guide';intent:'status'|'reason'|'assess'|'documents'|'approval'|'policy'|'list'|'guide'|'help';ids:string[];text:string;sources:EvidenceSource[];activity:AgentActivity[];updates:Record<string,CaseState>;action:{type:'application'|'documents'|'policy'|'tour';id?:string}|null};
