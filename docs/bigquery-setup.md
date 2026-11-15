# BigQuery evidence layer

The local Next.js application can query a real BigQuery dataset using Google Application Default Credentials (ADC). Gemini's API key is unrelated to BigQuery authentication. No Google Cloud credentials are sent to the browser.

## Local setup

1. Select a Google Cloud project with BigQuery enabled and permission to create a dedicated dataset and query jobs. BigQuery sandbox supports the batch loads and SELECT queries used here; no billing upgrade is required for this design.
2. Run `gcloud auth application-default login --project=YOUR_PROJECT_ID` and finish Google sign-in yourself.
3. Set server-only `.env.local` values:

```dotenv
GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID
BIGQUERY_DATASET=lendwise_demo
BIGQUERY_LOCATION=US
DATA_BACKEND=local
```

4. Run `npm run bq:prepare` to extract originals and inspect load files under `.data/bigquery/` without changing cloud resources.
5. Run `npm run bq:setup`. This creates the dedicated dataset, seven batch-loaded tables and three views. Existing tables are not overwritten. `npm run bq:setup -- --refresh` explicitly replaces these sample tables; it must only be used for the dedicated assignment dataset.
6. Run `npm run bq:index` to batch-load a derived `document_embeddings` table. Then run `npm run bq:verify`. It checks actual cloud row counts, income consistency, unknown identifiers, policy version filtering and missing-statement visibility.
7. Set `DATA_BACKEND=bigquery`, run `npm run bq:verify-rag`, and restart Next.js. Architecture reports the evidence connection and actual table counts.

Install the Google Cloud CLI and complete ADC sign-in on the computer running the app. Credentials remain outside the repository and must not be committed.

## Tables and views

| Layer | Table | Contents |
|---|---|---|
| Source | customers | 240 customer profiles and account/mobile references |
| Source | applications | 240 loan requests, declared income and document-register state |
| Source | salary_credits | 1,440 salary-credit transactions across six months |
| External | bureau_responses | 240 simulated scores, obligations and overdue responses |
| Governance | policy_versions | Initial approved policy configuration snapshot |
| Documents | source_documents | Eight source files with version, application linkage, checksum and ingestion time |
| Documents | document_chunks | Extracted source text with original-file/page/section provenance |
| Retrieval | document_embeddings | 18 derived policy/guide embeddings with model, checksum, text and policy-version metadata |

`application_evidence` aggregates salary credits before joining applications, customers and bureau responses. The verified-income input is computed from transactions; it is not copied from the browser's declared income. `document_evidence` joins chunks to document versions and application metadata. `lakehouse_inventory` returns actual row counts.

## Runtime behaviour

- The workspace loads cloud application facts from `/api/data-layer`. Officer case actions remain browser-local.
- Agent lookup, record reading and assessment use server-side BigQuery evidence. Cloud facts take precedence over supplied browser copies. Explicitly created local applications remain unsynchronised operational records.
- Activity shows application-read SQL, bound parameters, job ID, view and bytes processed.
- The model never supplies SQL or chooses arbitrary tables. Queries use fixed, allowlisted views and bound parameters, a 100 MB per-query bytes-billed cap, job timeout and a bounded row result.
- In BigQuery mode, policy/guide chunks and applicant excerpts are read from `document_evidence`. Policy-version and missing-statement filters are applied before returning sources. Gemini creates 768-dimensional query embeddings. BigQuery VECTOR_SEARCH compares them with document_embeddings, using cosine distance, exact brute-force search and a top-three limit. No approximate vector index is needed for 18 policy/guide chunks. Policy version and document kind are pre-filters; current text and checksum are checked against document_evidence before citation. Applicant documents are never included in general semantic search. This is not GraphRAG.
- BigQuery errors stop cloud agent operations. They never silently switch to local data. Local mode is explicitly selected through server configuration.
- Run bq:index after refreshing or changing source documents; old vectors cannot be cited against changed source text/checksums. The derived vector table can be rebuilt without replacing bank/source tables.
- Original PDFs/Markdown files stay in the repository and are linked from retrieved evidence. Cloud Storage is not connected. These are structured tables containing document metadata/text, not BigQuery object tables or BigLake.
- New applications, policy changes, decisions and audit events are not written to BigQuery. BigQuery is the seeded evidence snapshot, not a transactional workflow database.
- Sandbox resources expire after 60 days. Refresh the dataset before evaluation if necessary. See [Google's sandbox limits](https://docs.cloud.google.com/bigquery/docs/sandbox) and [ADC authentication](https://docs.cloud.google.com/bigquery/docs/authentication/getting-started).

The embedding generation uses the existing Gemini API key. BigQuery Connections, remote models and Vertex AI are not required by this implementation. Activity includes the vector-search SQL, job ID, bytes processed, matches and similarity scores. Query-vector values are summarised by dimension and SHA-256 rather than dumping 768 numbers into the UI.

To refresh only bank-branded source documents, run `npm run bq:setup -- --documents-only --refresh` followed by `npm run bq:index`. This updates source_documents/document_chunks and their derived vectors; customer, application, salary, bureau and policy-configuration tables remain unchanged.
