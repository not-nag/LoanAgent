# Next integration increment

## Server-side assistant

Replace local retrieval/tool routing with a server-side endpoint. Supply only authorised case evidence and approved policy clauses. Tools: get_application_evidence(application_id), search_policy(query, product, as_of), calculate_affordability(application_id, policy_version), navigate_allowed_screen(screen), start_tour(tour_id), run_mock_checks(application_id). Validate tool input and scope on the server. Never expose API keys in a static export.

Keep approval, decline, policy activation and disbursement outside model-callable actions. Server checks role, application state and current evidence before each mutation. The LLM drafts explanations; calculators and rule evaluators return numeric results. Treat uploaded text as untrusted evidence, not tool instructions.

Evaluation set: rate query, processing-target versus status, insufficient policy evidence, stale rule, ambiguous percentage, applicant context isolation, missing document, income conflict, forbidden approval action and unavailable mock API. Expected answers must include correct citations and abstain when unsupported.

## BigQuery evidence layer

Use the export script to generate 240 applicant/application records, 6 months of salary-credit transactions per applicant, mock bureau records and policy snapshots. Load into a dedicated demo dataset. Store synthetic document originals in Cloud Storage and document metadata with URI/page fields in BigQuery. Add validated views joined by application_id/customer_id; preserve received_at, valid_from/to, source_id and extraction confidence.

Operational states and writes should live in an authenticated operational store; asynchronously copy audit/assessment records to BigQuery. Do not use BigQuery as a high-frequency transactional application database.

## Policy retrieval

Separate authoritative source documents from editable bank-approved rule configuration. Keep policy_id, version, clause_id, product, effective_from/to, review_status and supersedes_clause_id. A reviewer must validate alignment between prose and executable rules. Retrieve approved, applicable clauses only. A genuine document-driven pipeline must preserve originals and extracted text; generating prose from rules is merely this prototype's simplification.

## Access needed

User signs into Google Cloud and selects a project. BigQuery and Cloud Storage permissions must be scoped to the demo dataset/bucket. A model-provider credential belongs in a server secret store. No payment/bureau/government integrations are required. Public sharing is a separate audience decision from the current private preview.
