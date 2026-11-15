# Next integration increment

## Server-side assistant

The local server-side Gemini API integration is implemented. The model chooses application lookup, record retrieval, semantic document search using Gemini query embeddings and BigQuery VECTOR_SEARCH over stored document embeddings, deterministic eligibility checks and scoped navigation. Source excerpts and real tool events are returned to the UI. The API key remains server-side. The OpenAI attempt was blocked by lack of credits. Gemini generation, embeddings and a cited policy answer have now been verified with the user’s free-tier key.

Workflow snapshots are currently supplied by the browser. Before public deployment, move them to an authenticated operational database and enforce real server roles, row access, persistent audit logs, usage budgets and per-user rate limits. Approval, decline, policy activation and disbursement remain outside model-callable actions.

Evaluation set: rate query, processing target versus status, insufficient policy evidence, stale rule, ambiguous percentage, applicant context isolation, missing document, income conflict, forbidden approval action and unavailable API. Verify correct citations and abstention live.

## BigQuery evidence layer

The BigQuery setup script now batch-loads 240 customers/applications, six months of salary-credit transactions per applicant, mock bureau responses, policy snapshots and extracted document metadata/chunks into a dedicated dataset. Joined evidence views feed server tools when DATA_BACKEND=bigquery. See bigquery-setup.md for authentication, live verification and current limits. Store synthetic document originals in Cloud Storage and document metadata with URI/page fields in BigQuery. Add validated views joined by application_id/customer_id; preserve received_at, valid_from/to, source_id and extraction confidence.

Operational states and writes should live in an authenticated operational store; asynchronously copy audit/assessment records to BigQuery. Do not use BigQuery as a high-frequency transactional application database.

## Policy retrieval

Separate authoritative source documents from editable bank-approved rule configuration. Keep policy_id, version, clause_id, product, effective_from/to, review_status and supersedes_clause_id. A reviewer must validate alignment between prose and executable rules. Retrieve approved, applicable clauses only. The implementation now preserves original fixed source files, extracted page/section text and file checksums. Retrieval uses the policy PDF rather than prose regenerated from rules. Arbitrary uploads, OCR and automatic policy/rule reconciliation remain future work. The evidence map visualises explicit metadata and assessment relationships; no graph retrieval or automatic relation extraction is claimed.

## Access needed

User signs into Google Cloud and selects a project. BigQuery and Cloud Storage permissions must be scoped to the demo dataset/bucket. A model-provider credential belongs in a server secret store. No payment/bureau/government integrations are required. Public sharing is a separate audience decision from the current private preview.
