# Lending assistant

The home workspace supports typed requests and browser speech recognition. Requests go to a server-side model that chooses tools; no scripted fallback is used. A Gemini API key with available free-tier quota is required. The key, text generation, embeddings and a source-backed policy question have been verified.

Example requests:

- Check Priya Sharma's status
- Check application PL-1002
- Check mobile 9000001002
- Check account ID 001000001002
- Why is it pending? (after selecting a case)
- Open her documents
- Run eligibility checks
- Show declined applications, then choose a result and ask why
- What is the interest rate?
- How long does review take?
- Help me review an application
- Start a guided tour

These are examples, not a fixed command vocabulary. Model interpretation of paraphrases and spoken identifiers must be evaluated live. Ambiguous names should prompt selection; unknown exact identifiers should not fall back to a previous applicant. Numeric assessment uses code rather than model arithmetic.

Approval, decline, policy activation and disbursement remain explicit employee actions. The assistant can navigate and record eligibility assessments only. Failed requests display the actual service limitation; no artificial delay or hardcoded answer is inserted.

Microphone capture requires browser permission and device testing. The app listens only after a click, shows the transcript, and preserves typing when voice is unavailable. Browser recognition may use a cloud service.
