# Lendwise

Personal-loan assessment and employee-assistance presales demo for a fictional Indian bank. All applicants, bank records, documents, policies, bureau responses and workflow actions are synthetic.

## Run

Use Node 22.12+ (or Node 24 LTS), then:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production export: `npm run build` produces `out/`.
On the supplied host's older Node 22.10, use `NODE_OPTIONS=--experimental-require-module npm run build` for Tailwind's ESM dependency.

## Validate

`npm test` runs domain tests. `npm run typecheck` checks TypeScript. The static export has been checked through the browser for the principal journey.

## Demo sequence

1. Open Aarav (PL-1001), run checks, inspect the EMI, affordability and policy citations. Approve with a reason, issue sanction, simulate customer acceptance/agreement/mandate, then simulate disbursement.
2. Open Priya (PL-1002); checks return pending information. Approval is disabled. In Documents, submit the sample statement, then rerun checks.
3. Open Rohan (PL-1003); review the bureau band, income discrepancy and affordability findings. Ask the Application assistant for an explanation.
4. Ask Policy assistant about rates, salary or processing time. Open a cited clause. Try an unsupported question; the assistant abstains.
5. Employee guide: request a tour; ask to run checks or open documents. Final approval and disbursement remain human actions.
6. Bank policy: switch demo role to Policy admin, edit a threshold, validate and submit; switch to Policy reviewer and activate. Return to an undecided assessed case: a new policy requires reassessment.

## Important implementation boundaries

This release is a frontend prototype, not a production agent system. The assistant uses local keyword retrieval and scripted tool selection; there is NO live LLM, OCR, BigQuery connection or real authentication. These are explicitly labelled in the UI. Browser-local state persists in localStorage (`lendwise-v1`), not a shared backend. Roles are demonstration switches, not security boundaries. No real external checks or financial actions occur.

Next integration steps: server-side LLM tool-calling endpoint; authenticated API and operational database; BigQuery evidence adapter and Cloud Storage samples; production policy review and consent controls. Do not put credentials in client components, public files or NEXT_PUBLIC variables.

## Structure

- `src/lib/domain.ts`: typed policy, synthetic applicants, deterministic assessment and approval gates.
- `src/lib/knowledge.ts`: policy/guide clauses generated from active policy and local retrieval.
- `src/components/workspace.tsx`: officer queue, case workflow, policy review, assistant and onboarding.
- `src/components/story.tsx`: two-act approach, architecture and FAQ.
- `src/components/ui`: Radix-backed shadcn-style components with Tailwind/CVA.
- `docs`: walkthrough and integration design.
- `scripts/export-data.ts`: seeded BigQuery-ready NDJSON data export.

The source reference was inspected for policy grounding, effective dates, amendments and evidence navigation. This demo focuses on personal-loan origination and adds employee onboarding; it does not reproduce official PNB policy or branding.
