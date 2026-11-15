# AI validation — 14 November 2026

Provider: Gemini. Generation model: `gemini-3.5-flash-lite`. Embeddings: `gemini-embedding-001`, 768 dimensions. The API key is loaded server-side from `.env.local`. No billing configuration was changed.

## Live checks

- Key validation: models endpoint returned HTTP 200.
- Generation: the configured model returned a response successfully. The initial 2.5 Flash-Lite attempt was unavailable to this project (404), so the default was set to the documented, available 3.5 Flash-Lite model.
- Embeddings: a query returned a 768-dimensional vector; the approved corpus was embedded and cached locally.
- Policy question: “What is the interest rate?” caused the model to select `search_documents`, retrieve three excerpts and cite the interest-rate section, §3.3, with the configured 12% annual rate. The browser displayed the answer and the original retrieved excerpt in its source dialog.
- Application lookup: “A customer called from 9000001002. What is holding up her loan?” selected application lookup and record retrieval. It resolved PL-1002 / Priya Sharma and correctly explained the missing six months of bank statements. No assessment or decision was written.
- Eligibility: “Run eligibility checks for PL-1001” selected lookup and the rules/EMI tool. The result was Assessed / pass, EMI ₹16,607 and FOIR 30.1%, with a retained policy-v1 snapshot. No final approval was recorded. This endpoint smoke test used a separate workspace snapshot and did not alter the browser's cases.

## Local verification

29 automated tests passed, including agent boundaries for ambiguous applicants, role enforcement, deterministic assessment, citation filtering and unsupported policy answers. Provider behaviour is simulated in those boundary tests; the live checks above use the real service. TypeScript and the Next.js production build passed. Browser QA also confirmed the expanded Activity panel shows the actual Priya lookup arguments and returned match, alongside separate model turns and measured durations.

## Limits

This is a small smoke test, not an exhaustive model evaluation. Voice capture requires device/browser testing. The fixed sample policy PDF is now extracted and indexed with original page references and checksums. The three featured cases have independent salary/statement fixtures; missing statements remain unavailable until resubmission. Arbitrary document uploads, OCR, persistent authenticated workflow storage and BigQuery remain unconnected. A visual evidence map shows explicit record relationships; this is not GraphRAG. Free-tier quotas and service availability can interrupt requests; the app reports errors without a canned answer fallback.

## File-backed evidence follow-up

A new live rate query selected `search_documents` and returned the fixed policy PDF, version 1, page 1, clause 3.3, with the original-file URL. A second live query selected `find_applications` and `read_applicant_documents` for Rohan Iyer. It correctly compared INR 75,000 net pay in the salary-slip file against INR 58,000 in all six salary-credit rows and cited both original files. Neither request changed application state.

The browser showed the Evidence map, a selectable salary-slip node and its original-file link. Automated extraction checks exclude v1 policy evidence when the active rule version is v2, and exclude Priya's statement until resubmission is recorded.

## Interactive reviewer tour

The tour has 27 guided checkpoints and a home-screen entry point visible on narrow screens. Requests and sample reasons are prepared, with explicit reviewer submission/confirmation. Six additional automated tests cover checkpoint gating, document reassessment, loan-stage order, stale-policy checks, modal closure and feature coverage (35 total tests). On 15 November 2026, browser verification completed all 27 checkpoints, including real Gemini lookup, policy retrieval and eligibility tool calls; document review; approval through simulated disbursement; decline; policy activation and reassessment; and application creation. Finishing restored the original 240 applications and their previous stages. Guided state is kept separate from persisted workspace records and restored on exit/finish.

## BigQuery integration — 15 November 2026

Created `niveus-testing-514806.lendwise_demo` with seven actual BigQuery tables and three joined views using ADC. Batch loads contain 240 customers, 240 applications, 1,440 salary credits, 240 bureau responses, one policy version, eight source documents and 24 extracted chunks. `bq:verify` passed live cloud reads, the Rohan declared/verified income distinction, unknown-ID behaviour, policy-version exclusion and missing-statement gating. The local `/api/data-layer` endpoint returned connected=true and 240 cloud-backed applications with actual query-job provenance. The Gemini status smoke test resolved Priya from her mobile number via BigQuery-backed tools and reported the missing statement without writing a decision.

The current automated suite includes six BigQuery tests covering source lineage, joins, authoritative cloud facts, trace provenance, failure without fallback and null/missing evidence mapping. Earlier notes describing BigQuery as unconnected reflect the earlier version. At this stage original files and semantic vectors remained local; the vector-search follow-up below supersedes that detail. Workflow writes are not synchronised to the evidence snapshot.

The live Gemini eligibility request recorded a passing assessment for PL-1001 (EMI INR 16,607; FOIR 30.1%) without a final decision. Cloud-backed semantic search retrieved policy section 3.3, page 1. Browser verification displayed a successful `get_application` tool execution with BigQuery SQL, bound application ID, cloud job ID and bytes processed. All 41 automated tests, TypeScript and the final production build passed.

## BigQuery vector retrieval follow-up — 15 November 2026

Loaded 18 policy/employee-guide embeddings (Gemini embedding model, 768 dimensions) into a derived document_embeddings table. BigQuery VECTOR_SEARCH now handles exact cosine matching with document-kind, policy-version and embedding-model pre-filters. Retrieved sources are joined back to current document evidence by chunk ID, text and checksum. Applicant source documents remain application-scoped and are excluded from general semantic search.

Live bq:verify-rag passed: rate citation section 3.3/page 1, employee approval guide retrieval, exclusion of v1 policy under v2, applicant isolation, and agreement between BigQuery similarity scores/rankings and an independent local calculation. The rate query processed 132,033 bytes. All 44 automated tests and the production build passed. Browser inspection was blocked by the browser security policy during this follow-up; no new visual verification is claimed.

The complete local assistant API request also passed: Gemini selected search_documents, which ran BigQuery VECTOR_SEARCH (job 2547f229-b609-4a30-8350-c01407a97719, 132,033 bytes processed), and returned the 12% illustrative rate with the original policy v1/page 1/section 3.3 citation. Activity output contained the actual SQL, vector-parameter summary, similarity scores and job provenance.

## Final UI review — 15 November 2026

Renamed the fictional bank to Mangalore Bank in the workspace, assistant instructions, employee guide and original policy PDF. Rendered and inspected the revised policy PDF, refreshed only document metadata/chunks in BigQuery, rebuilt 18 embeddings, and passed live RAG ranking/citation verification again. Customer, application, salary-credit and bureau tables were unchanged.

Browser review covered the assistant, applications, policy, approach, architecture and FAQ pages at desktop and 390-pixel mobile widths. Checked application capture, document-register rows, evidence-map scrolling, policy controls and all dropdown arrow insets. Select controls reserve 34 pixels for the arrow and inset it 10 pixels from the right. No document-wide horizontal overflow was observed on mobile; tables, tabs, navigation and the evidence map scroll within their own containers. Fixed loading placeholders, page-navigation scroll position and the customer-statement receipt wording.
