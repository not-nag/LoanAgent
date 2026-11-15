# Lendwise · Mangalore Bank

A loan-review workspace with an AI assistant, document-backed answers, configurable eligibility rules and an application-to-disbursement workflow.

[Open the review site](https://assignment-loan-lending.turfyactor1.chatgpt.site/) and select **Take a guided tour** to explore the features. No sign-in is required. Review access closes on 29 November 2026 at 23:59 IST.

Built with Next.js, React, TypeScript, Tailwind CSS, Gemini tool calling and BigQuery vector search. The assistant retrieves evidence and runs eligibility checks; employees confirm decisions.

## Run locally

Use Node.js 22.12+ or 24 LTS.

```sh
npm ci
cp .env.example .env.local
```

Add your `GEMINI_API_KEY` to `.env.local`, then start the app:

```sh
npm run dev
```

Open [localhost:3000](http://127.0.0.1:3000). The default local mode uses the included sample records. A Gemini key with available quota is required for assistant answers. Keys stay server-side; `.env.local` is excluded from Git.

For cloud evidence and vector retrieval, follow the [BigQuery setup guide](docs/bigquery-setup.md). The local Next.js server binds to localhost; the hosted review uses a separate Sites Worker adapter.

## Checks

```sh
npm run typecheck
npm test
npm run build
```

## Assignment documents

- [Research note](public/documents/research-note.pdf)
- [AI usage log](public/documents/ai-usage-log.pdf)

## Scope

Applicant records and bank policies are illustrative. Workflow changes persist in the browser; BigQuery holds the evidence snapshot. Role selection demonstrates responsibilities rather than authentication. Disbursement is simulated. Arbitrary uploads, OCR and real banking integrations are outside the current implementation.
