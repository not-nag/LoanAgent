import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {bigQueryClient,bigQueryConfig} from '../../src/lib/server/bigquery';
import {lakehouseRows,lakehouseViews,schemas} from './model';
async function main(){
 const config=bigQueryConfig(),client=bigQueryClient(),dataset=client.dataset(config.datasetId);
 const rows=await lakehouseRows();
 const selected=Object.entries(rows).filter(([name])=>!process.argv.includes('--documents-only')||['source_documents','document_chunks'].includes(name));
 const dir=path.join(process.cwd(),'.data','bigquery');await mkdir(dir,{recursive:true});
 for(const [name,data] of Object.entries(rows))await writeFile(path.join(dir,`${name}.ndjson`),data.map(r=>JSON.stringify(r)).join('\n')+'\n');
 if(process.argv.includes('--prepare-only')){console.log('Prepared local load files:',Object.fromEntries(Object.entries(rows).map(([n,r])=>[n,r.length])));return}
 const [exists]=await dataset.exists();if(!exists)await dataset.create({location:config.location,defaultTableExpirationMs:'5184000000',labels:{application:'lendwise',data:'synthetic'}});
 const [metadata]=await dataset.getMetadata();if(metadata.location?.toLowerCase()!==config.location.toLowerCase())throw Error(`Dataset location is ${metadata.location}; set BIGQUERY_LOCATION to match.`);
 // First-time setup refuses to overwrite any existing tables. --refresh explicitly
 // replaces only the named sample tables inside this dedicated lendwise_ dataset.
 if(!process.argv.includes('--refresh'))for(const [name] of selected){const [exists]=await dataset.table(name).exists();if(exists)throw Error(`${name} already exists. Use bq:setup -- --refresh only to replace this sample dataset's tables.`)}
 for(const [name,data] of selected){
  await dataset.table(name).load(path.join(dir,`${name}.ndjson`),{sourceFormat:'NEWLINE_DELIMITED_JSON',schema:{fields:schemas[name]},writeDisposition:process.argv.includes('--refresh')?'WRITE_TRUNCATE':'WRITE_EMPTY',location:config.location});
  console.log(`Loaded ${name}: ${data.length} rows`);
 }
 if(process.argv.includes('--documents-only')){console.log('Document sources refreshed. Bank tables unchanged. Run npm run bq:index to refresh vectors.');return}
 for(const [name,query] of Object.entries(lakehouseViews(config.projectId,config.datasetId))){
  const table=dataset.table(name),[exists]=await table.exists();
  if(exists)await table.setMetadata({view:{query,useLegacySql:false}});else await table.create({view:{query,useLegacySql:false}});
  console.log(`Created view ${name}`);
 }
 console.log('Cloud setup complete. Run npm run bq:verify before enabling DATA_BACKEND=bigquery.');
}
main().catch(()=>{console.error('Setup did not complete. Check project ID, ADC sign-in, BigQuery API access, dataset location and existing tables. No credentials are printed.');process.exitCode=1});
