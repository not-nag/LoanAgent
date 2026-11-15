"""Build D5/D6 exports and publish identical copies at the app's existing URLs."""
from pathlib import Path
from shutil import copyfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

PAPER = colors.HexColor('#f7f4ee')
INK = colors.HexColor('#312e2a')
WINE = colors.HexColor('#692d3d')
MUTED = colors.HexColor('#696159')
LINE = colors.HexColor('#ded7cd')
OUTPUT = Path('output/pdf')
PUBLIC = Path('public/documents')
STYLES = getSampleStyleSheet()
for name, font, size, leading, colour, after in [
    ('DocTitle', 'Times-Roman', 29, 33, INK, 10),
    ('DocLabel', 'Helvetica', 8.2, 12, WINE, 9),
    ('DocSub', 'Helvetica', 9, 14, MUTED, 13),
    ('DocHead', 'Helvetica-Bold', 10.5, 14, WINE, 6),
    ('DocBody', 'Helvetica', 9.2, 14, INK, 8),
    ('DocSmall', 'Helvetica', 8.1, 12, MUTED, 5),
    ('DocCell', 'Helvetica', 8.6, 12.5, INK, 0),
]:
    STYLES.add(ParagraphStyle(name=name, fontName=font, fontSize=size,
                             leading=leading, textColor=colour, spaceAfter=after))
STYLES['DocHead'].spaceBefore = 11
STYLES['DocHead'].keepWithNext = True


def p(text, style='DocBody'):
    return Paragraph(text, STYLES[style])


def heading(text):
    return p(text, 'DocHead')


def title(label, name, sub):
    return [p(label, 'DocLabel'), p(name, 'DocTitle'), p(sub, 'DocSub')]


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, 595, 842, fill=1, stroke=0)
    canvas.setStrokeColor(LINE)
    canvas.line(44, 45, 551, 45)
    canvas.setFillColor(MUTED)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(44, 30, 'MANGALORE BANK / LENDWISE / ASSIGNMENT')
    canvas.drawRightString(551, 30, str(doc.page))
    canvas.restoreState()


def write(name, story):
    OUTPUT.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    destination = OUTPUT / name
    SimpleDocTemplate(str(destination), pagesize=(595, 842), leftMargin=44,
                      rightMargin=44, topMargin=37, bottomMargin=61,
                      title='Personal-loan origination' if name == 'research-note.pdf' else 'AI usage log',
                      author='Lendwise assignment', subject='Mangalore Bank point-of-view demonstration').build(
                          story, onFirstPage=footer, onLaterPages=footer)
    copyfile(destination, PUBLIC / name)


def build_submission_documents():
    research = title('D5 / RESEARCH NOTE / 15 NOVEMBER 2026', 'Personal-loan origination',
                     'Scope: salaried, unsecured personal loans at fictional Mangalore Bank. Public sources reviewed 14-15 November 2026; bank thresholds are illustrative assumptions.')
    research += [heading('The journey, roles and handoffs'),
                 p('A lending journey is a sequence of evidence and authority checks. The operating model below is a customer-discovery proposal, not a description of one bank\'s internal organisation.')]
    rows = [
        ('Stage / owner', 'Evidence, action and exit condition'),
        ('Application / branch or digital channel', 'Capture purpose, amount, tenure and consent; identify the applicant and record the request.'),
        ('Verification / operations', 'Check KYC and completeness; request missing evidence and reconcile resubmissions before reassessment.'),
        ('Appraisal / credit team', 'Compare salary evidence with account credits; examine bureau history, obligations, employment and policy eligibility.'),
        ('Decision / authorised officer', 'Review reasons and exceptions; approve, decline or request information within delegated authority.'),
        ('Sanction / credit and operations', 'Communicate approved terms, disclosures and conditions. Sanction alone does not release money.'),
        ('Acceptance and release / customer and operations', 'Complete agreement, mandate and remaining conditions; verify release readiness and record disbursement.'),
    ]
    table = Table([[p(cell, 'DocCell') for cell in row] for row in rows], colWidths=[148, 359], hAlign='LEFT')
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#eee8df')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LINEBELOW', (0, 0), (-1, -1), .45, LINE),
    ]))
    research += [table, heading('Evidence before eligibility'),
                 p('RBI requires borrower economic-profile information, including age, occupation and income, before digital lending, retained for audit. Its directions also address explicit consent, borrower disclosures and fund-flow controls. [1] ICICI Bank illustrates identity/residence evidence, salary slips and salary-credit statements; its public pages differ on slip periods, so the applicable product and channel must determine the checklist. [2,3]'),
                 heading('Credit judgement and product boundaries'),
                 p('Income, existing obligations, employment continuity, age, bureau history and repayment capacity inform appraisal. A calculator estimate is not final approval. [3] Missing evidence means pending; an income conflict warrants investigation, not an unsupported fraud allegation. Property valuation and CERSAI collateral checks sit outside this unsecured-product path.'),
                 heading('Sanction, conditions and disbursement'),
                 p('ICICI notes that mandates or confirmations may still be required after sanction. [2] The prototype preserves the approval-to-release sequence with human decisions, but acceptance and disbursement are simulated. It does not generate a complete regulatory KFS, model all fees/APR or move money. [1]'),
                 PageBreak()]
    research += title('D5 / RESEARCH NOTE / CONTINUED', 'Evidence into action',
                      'Business response, implementation boundaries and validation priorities.')
    research += [heading('Turnaround: distinguish a channel example from a promise'),
                 p('ICICI states that eligible customers using its digital journey can receive same-day disbursement. [4] This is a conditional channel example, not a universal turnaround benchmark. Document gaps and exception review add time. Mangalore Bank\'s two-working-day review target starts after complete evidence; it is a demo assumption, not a regulatory deadline or measured improvement.'),
                 heading('The two-act solution and business value'),
                 p('<b>Connect the evidence:</b> link bank records, applicant files and simulated external responses by customer/application identifiers; retain source, version and conflicting values.<br/><b>Use the evidence:</b> one assistant retrieves policy, reads scoped applicant evidence, calls calculation tools and explains findings. An officer owns the decision. Guided onboarding reduces uncertainty about the next step.'),
                 heading('What is implemented and what remains proposed'),
                 p('Live BigQuery contains 240 customers/applications, 1,440 salary credits, simulated bureau responses, policy configuration, document metadata/chunks and 18 policy/guide vectors. Gemini chooses tools; query embeddings and BigQuery VECTOR_SEARCH retrieve original-file excerpts with page/section citations. EMI and eligibility are computed in code. Policy versions and stale-assessment gates preserve traceability.'),
                 p('The 50% obligation limit, 750 pass-score threshold, INR 25,000 income floor and 12% rate are fictional bank settings, not RBI mandates. Original files are packaged with the app; decisions, new applications and policy edits remain browser-local. The temporary review site runs on ChatGPT Sites, with server-side Gemini/BigQuery access. Cloud Storage, OCR, arbitrary uploads, real external APIs and production authentication are not connected. Object tables are a possible future Cloud Storage/BigQuery integration, not the current implementation. [5]'),
                 heading('Research limits and pilot validation'),
                 p('No banking-practitioner interview is claimed. Candidate-supplied workflow notes informed discovery, without a verified interview attribution. Validate delegated limits, exception handling, accepted evidence and stage-level delays with a practitioner. Compare median/p90 turnaround, manual touches, document rework, citation correctness and employee time to a correct first review against a baseline; no improvement percentage is claimed.'),
                 heading('Primary sources'),
                 p('[1] RBI, <link href="https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=13156&amp;Mode=0" color="#692d3d">Commercial Banks - Credit Facilities Directions, 2025</link>, updated 1 October 2026; Chapter III, creditworthiness, disclosures and data/consent.', 'DocSmall'),
                 p('[2] ICICI Bank, <link href="https://www.icici.bank.in/personal-banking/loans/personal-loan/documentation" color="#692d3d">Personal Loan Documents</link>: salaried evidence and pre-disbursement conditions.', 'DocSmall'),
                 p('[3] ICICI Bank, <link href="https://www.icici.bank.in/personal-banking/loans/personal-loan/eligibility" color="#692d3d">Personal Loan Eligibility</link>: appraisal factors and calculator limitations.', 'DocSmall'),
                 p('[4] ICICI Bank, <link href="https://www.icici.bank.in/personal-banking/loans/personal-loan/personal-loans-faqs" color="#692d3d">Personal Loan FAQs</link>: conditional same-day digital disbursement.', 'DocSmall'),
                 p('[5] Google Cloud, <link href="https://docs.cloud.google.com/bigquery/docs/object-table-introduction" color="#692d3d">Introduction to object tables</link>. Reference design: <link href="https://pnb-frontend-7kxckvikva-uc.a.run.app/" color="#692d3d">PNB Policy Intelligence</link>; inspiration for provenance and applicability, not authoritative bank policy.', 'DocSmall')]
    write('research-note.pdf', research)

    log = title('D6 / AI USAGE LOG / 15 NOVEMBER 2026', 'AI-assisted, transparently',
                'Tools, representative prompts, corrections and validation for the Mangalore Bank assignment.')
    log += [heading('Tools and division of responsibility'),
            p('ChatGPT/Codex supported research, solution design, synthetic-data generation, implementation, tests, UI exploration and these documents. Browser tools reviewed the supplied reference and exercised the app. Gemini is the application\'s runtime model for tool selection and answers; Gemini embeddings support retrieval. Claude was discussed but not used. The candidate directed scope, challenged outputs and chose the final design.'),
            heading('Representative prompts and resulting decisions'),
            p('<b>"What and how do we store?"</b> shaped a two-act evidence-lakehouse and agent story.<br/><b>"Make these rules configurable by bank."</b> led to validated drafts, maker/reviewer activation, retained policy snapshots and stale-check blocking.<br/><b>"Employee onboarding is difficult ... walk through the features."</b> led to contextual guidance and a 27-step tour.<br/><b>"Where\'s AI agentic ... it\'s just hardcoded?"</b> exposed the scripted prototype\'s limits and drove real Gemini tool calling and source-backed retrieval.<br/><b>"BigQuery ... is important ... build it."</b> led to cloud evidence tables, joined views and VECTOR_SEARCH.<br/><b>"Simplify ... agent first"</b> led to a focused composer and prompt rows; separate colour/layout previews informed the burgundy editorial design.'),
            heading('What worked and what needed correction'),
            p('AI accelerated scaffolding, repeatable sample cases and boundary-test drafting. Candidate feedback corrected an overcrowded dashboard and shallow scripted Q&amp;A. An OpenAI integration could not run without credits, so the implementation switched to Gemini. Retrieval was strengthened from configured rule text to independent source files, then BigQuery vector search. The evidence map is explicitly a relationship visualisation, not GraphRAG. Earlier PDFs incorrectly described AI and BigQuery as unconnected; this revision corrects that drift.'),
            heading('Validation and remaining limits'),
            p('All 44 automated tests passed, covering EMI/rules, document gates, policy snapshots, agent boundaries, source isolation, cloud provenance and tour checkpoints. TypeScript and the production build passed. Live checks verified 240 cloud applications and a Gemini-selected search_documents call using BigQuery VECTOR_SEARCH; the answer cited the 12% policy rate at v1/page 1/section 3.3. Browser QA checked desktop/mobile layouts and tour prompts. Test-provider simulations do not establish model quality; live checks are smoke tests, not a full evaluation.'),
            p('Workflow persistence and role switching remain browser-local demonstrations; original files are fixed fixtures. OCR, arbitrary uploads, real bureau/identity services and production authentication are absent. The temporary public review site runs on ChatGPT Sites with a Worker API adapter and server-only secrets; live access to 240 BigQuery applications was verified. No practitioner interview or production outcome is claimed.'),
            heading('Time saved and ownership'),
            p('No manual baseline was timed, so no numeric saving is claimed. AI shortened drafting and iteration, while the candidate made product decisions and is responsible for understanding and defending the final submission. All applicant data and external-check responses are generated; no real customer information is used.')]
    write('ai-usage-log.pdf', log)


if __name__ == '__main__':
    build_submission_documents()
    print('Updated D5 and D6 exports and app copies.')
