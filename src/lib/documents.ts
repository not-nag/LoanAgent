export type SourceDocument={id:string;title:string;filename:string;version:string;kind:'policy'|'guide'|'applicant';policyVersion?:number;applicationId?:string;evidenceType?:'salary'|'statement';requiresResolved?:boolean;effective:string};
export type DocumentInfo=SourceDocument&{url:string;pageCount:number;checksum:string};
