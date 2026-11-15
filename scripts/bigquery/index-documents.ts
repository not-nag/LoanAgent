import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {bigQueryClient,bigQueryConfig,evidenceQuery,EMBEDDING_MODEL,EMBEDDING_DIMENSIONS,validateEmbedding} from '../../src/lib/server/bigquery';
import {geminiRequest,safeError} from '../../src/lib/server/gemini';
import {lakehouseViews} from './model';
export const vectorSchema=[
 {name:'chunk_id',type:'STRING'},{name:'document_id',type:'STRING'},{name:'text',type:'STRING'},
 {name:'checksum',type:'STRING'},{name:'kind',type:'STRING'},{name:'policy_version',type:'INTEGER'},
 {name:'embedding_model',type:'STRING'},{name:'embedding',type:'FLOAT',mode:'REPEATED'}
];
async function main(){
 const {rows}=await evidenceQuery<Record<string,unknown>>('document_evidence',"WHERE kind IN ('policy','guide') ORDER BY document_id, chunk_id");
 if(!rows.length)throw Error('No policy or guide chunks. Load evidence first.');
 const hash=createHash('sha256').update(JSON.stringify({model:EMBEDDING_MODEL,dimensions:EMBEDDING_DIMENSIONS,rows})).digest('hex');
 const dir=path.join(process.cwd(),'.data','bigquery');await mkdir(dir,{recursive:true});
 const cache=path.join(dir,`embeddings-${hash}.json`);
 let vectors:number[][]|undefined;
 try{vectors=JSON.parse(await readFile(cache,'utf8'));if(vectors?.length!==rows.length)throw Error();vectors.forEach(validateEmbedding)}catch{vectors=undefined}
 if(!vectors){
  vectors=[];
  for(let offset=0;offset<rows.length;offset+=50){
   const batch=rows.slice(offset,offset+50);
   const data=await geminiRequest<{embeddings:{values:number[]}[]}>(`models/${EMBEDDING_MODEL}:batchEmbedContents`,{requests:batch.map(r=>({model:`models/${EMBEDDING_MODEL}`,content:{parts:[{text:`${r.source}\n${r.text}`}]},taskType:'RETRIEVAL_DOCUMENT',title:r.title,outputDimensionality:EMBEDDING_DIMENSIONS}))});
   if(data.embeddings?.length!==batch.length)throw Error('Embedding response length mismatch.');
   for(const item of data.embeddings){validateEmbedding(item.values);vectors.push(item.values)}
  }
  await writeFile(cache,JSON.stringify(vectors));
 }
 const documents=rows.map((r,i)=>({chunk_id:r.chunk_id,document_id:r.document_id,text:r.text,checksum:r.checksum,kind:r.kind,policy_version:r.policy_version??null,embedding_model:EMBEDDING_MODEL,embedding:vectors![i]}));
 const file=path.join(dir,'document_embeddings.ndjson');await writeFile(file,documents.map(r=>JSON.stringify(r)).join('\n')+'\n');
 const {projectId,datasetId,location}=bigQueryConfig(),dataset=bigQueryClient().dataset(datasetId);
 // Replace only the derived vector snapshot. Source tables are never overwritten here.
 await dataset.table('document_embeddings').load(file,{sourceFormat:'NEWLINE_DELIMITED_JSON',schema:{fields:vectorSchema},writeDisposition:'WRITE_TRUNCATE',location});
 const inventory=lakehouseViews(projectId,datasetId).lakehouse_inventory+` UNION ALL SELECT 'document_embeddings' AS table_name, COUNT(*) AS row_count FROM \`${projectId}.${datasetId}.document_embeddings\``;
 await dataset.table('lakehouse_inventory').setMetadata({view:{query:inventory,useLegacySql:false}});
 console.log(`Loaded ${documents.length} document embeddings (${EMBEDDING_DIMENSIONS} dimensions) into ${projectId}.${datasetId}.document_embeddings. Source tables unchanged.`);
}
if(process.argv[1]?.endsWith('index-documents.ts'))main().catch(e=>{console.error(safeError(e));process.exitCode=1});
