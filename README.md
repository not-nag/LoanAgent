# Lendwise

Personal-loan assessment and employee-assistance assignment for a fictional Indian bank. All applicant records, policies and financial actions are synthetic.

## Run locally

Use Node 22.12+ or Node 24 LTS. Install dependencies with `npm ci`. Set `GEMINI_API_KEY` in `.env.local` (already gitignored), optionally set `GEMINI_MODEL=gemini-3.5-flash-lite`, then run `npm run dev`. Open http://127.0.0.1:3000. On this host's older Node 22.10, use `NODE_OPTIONS=--experimental-require-module npm run dev`.

The key is read only by server code. Never use `NEXT_PUBLIC_`, paste keys into the UI, commit `.env.local`, or place secrets in public documents. The app is local only; assistant requests reject non-local hosts and cross-origin requests. It is not ready for public deployment without authentication and server-owned workspace data.

`npm run build` builds a Next.js server application; this is no longer a static export. Start a production build with `npx next start --hostname 127.0.0.1`.

## Real assistant integration

The browser posts to `/api/assistant/`. Gemini chooses `find_applications`, `get_application`, `search_documents`, `read_applicant_documents`, `run_eligibility_checks`, and `open_workspace` itself, then calls `present_answer` to return a structured card. There is no keyword router or canned answer fallback in the live assistant. The old parser is retained only for historical tests and shared identifier/status helpers.

`search_documents` is a small RAG implementation: it reads the original policy PDF and employee-guide Markdown file, extracts page/section text, embeds those chunks using `gemini-embedding-001`, and retrieves with cosine similarity. Gemini synthesises the answer from actual extracted excerpts. Source metadata includes filename, document version, page (for PDFs), section and original-file checksum. Original files remain in `public/documents/`; the manifest is `content/document-manifest.json`. Extraction and local-mode vector caches are in ignored `.data/`. BigQuery mode stores embeddings in `document_embeddings` and performs cosine matching with `VECTOR_SEARCH`. No paid vector database or OpenAI service is used. Free-tier quotas apply; no billing configuration was changed.

The approved policy PDF is independent of the bank's editable rules. Source retrieval only includes policy files linked to the active rule version. If rules advance to v2 without an attached v2 policy source, the assistant must disclose the missing source rather than cite v1 as v2. Changing rule settings never rewrites the PDF. The current fixed library contains the v1 policy, an employee guide, and salary/statement source files for the three featured applications. Uploading arbitrary documents and OCR are not implemented.

`read_applicant_documents` reads only original files scoped to the uniquely identified application. Priya's prepared statement remains unavailable until her missing-document loop is resolved. These independent fixtures are not regenerated from live applicant fields; discrepancies should be reported. The other seeded applications still use structured evidence records without original source fixtures.

Applications have an Evidence map tab: customer, application, salary evidence, salary credits, bureau response, rule configuration, assessment and recommendation are connected visually. Select a node to inspect its sources; assessment findings link to original policy clauses. Connections are explicit metadata/rules-engine relationships, not automatic relation extraction or GraphRAG. The assistant currently uses vector retrieval and scoped document reads.

Tool results return to the model in a bounded loop. Numeric assessments use the existing deterministic engine. Unique lookup is required before reading or assessing an applicant. The assistant cannot approve, decline, activate policy or disburse. Navigation is limited to existing screens. The UI streams actual tool activity and displays retrieved source excerpts. Expand Activity to inspect model turns, available function definitions, requested function names, exact tool arguments and returned data, execution location, status and measured duration. Running steps update in place; failed calls remain inspectable with safe error messages. API credentials and provider headers are excluded.

## Validation

The Gemini key successfully authenticated, generated text and generated embeddings. A real policy question selected `search_documents`, indexed the approved corpus, retrieved the rate clause and produced a cited 12% answer. See `docs/ai-validation.md` for subsequent endpoint/browser checks and limits.

`npm run typecheck`, `npm test`, and `npm run build` validate the implementation. Agent boundary tests use a simulated model to verify permissions, citations and result handling; those tests do not establish real model quality. `npx tsx scripts/verify-ai.ts` is an optional live endpoint test and consumes Gemini quota; it is not included in `npm test`.

## State and access boundaries

The browser owns workspace records in `localStorage` (`lendwise-v1`) and sends the current snapshot to the server for each assistant request. The model receives records only through selected tools. Successful assessment results return to the browser and persist there; this is not a shared operational database. Role switches are demonstrations, not authentication. The endpoint has local origin restrictions, input limits, concurrency and request-rate caps; it is not a public security boundary. The generation and embedding models are cloud services; BigQuery mode stores document embeddings and runs vector retrieval in BigQuery; explicitly selected local mode uses local cosine search. Browser speech recognition may also use an online service.

BigQuery evidence tables, joined views and a server-side adapter are implemented; see [BigQuery setup](docs/bigquery-setup.md) for connection and verification. Cloud Storage, OCR, arbitrary uploads, real bank/bureau/identity APIs and production authorisation remain future integrations. No money moves. Research/AI-usage PDFs are earlier working drafts and should be refreshed after live validation before assignment submission.

## Interactive reviewer tour

Select **First visit? Take a guided tour** on the assistant home, or **Take a guided tour** in the sidebar. The 27-step walkthrough navigates pages/tabs, prepares real chat requests and sample officer reasons, highlights the relevant control, and enables Continue only after required actions succeed. Reviewers click Send and all workflow confirmations themselves. The tour covers status lookup, actual tool activity, missing evidence, original files, the evidence map, assessment, approval, sanction, acceptance, simulated disbursement, audit, decline, document Q&A, agent assessment, policy maker/reviewer activation, stale checks, source governance, new application capture and assignment pages. Microphone use is optional.

The tour runs against a prepared in-memory session with policy v1. Browser-local persistence is suspended while it runs. Finishing or exiting restores saved application/policy state, role and navigation; refreshing abandons the session and reloads the unchanged saved workspace. No real email, payment or external bank action is performed. AI requests remain real and use Gemini quota. If an AI step fails, a visible Skip AI step route continues to the manual workflow without manufacturing an answer. Exiting aborts pending browser requests and clears the assessment timer so late results cannot overwrite restored data.

## Walkthrough

1. Ask for Priya Sharma's status; identify missing evidence and open her documents.
2. Ask to assess PL-1001. Review EMI, checks and recommendation. Approve manually with a reason; continue sanction, acceptance and simulated disbursement.
3. Assess PL-1003 and inspect affordability, income discrepancy and bureau findings.
4. Ask the rate and processing target, inspect actual retrieved sources, then try an unsupported question.
5. Ask for help reviewing an application or request a guided tour.
6. Activate a new bank policy via the admin/reviewer workflow; ask the assistant again and reassess stale applications.

## BigQuery

See [setup and data model](docs/bigquery-setup.md). Batch loading uses Application Default Credentials and a dedicated `lendwise_` dataset. `npm run bq:setup` loads the source tables; `npm run bq:verify` tests live cloud evidence. `npm run bq:index` builds document embeddings in BigQuery; `npm run bq:verify-rag` validates cloud vector search. Set `DATA_BACKEND=bigquery` only after verification passes. Workflow state stays browser-local.

To inspect cloud RAG, ask **What is the interest rate?**, expand **Activity**, then expand **search_documents**. Its returned retrieval details show the actual VECTOR_SEARCH SQL, query parameters (embedding values summarised), similarity scores, bytes processed and BigQuery job ID. In BigQuery Studio, open the configured project → lendwise_demo → document_embeddings → Preview to see stored vectors. The app Architecture page lists connected table counts.
