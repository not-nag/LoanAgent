from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from pathlib import Path
import sys
from xml.sax.saxutils import escape
out=Path('public/documents');out.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleLW',fontName='Helvetica-Bold',fontSize=25,leading=30,textColor=colors.HexColor('#203d63'),spaceAfter=13))
styles.add(ParagraphStyle(name='SubLW',fontName='Helvetica',fontSize=9,leading=14,textColor=colors.HexColor('#8294ac'),spaceAfter=17))
styles.add(ParagraphStyle(name='HeadLW',fontName='Helvetica-Bold',fontSize=12,leading=16,textColor=colors.HexColor('#315f98'),spaceBefore=14,spaceAfter=7))
styles.add(ParagraphStyle(name='BodyLW',fontName='Helvetica',fontSize=9.4,leading=15,textColor=colors.HexColor('#52677f'),spaceAfter=8))
styles.add(ParagraphStyle(name='SmallLW',fontName='Helvetica',fontSize=8,leading=12,textColor=colors.HexColor('#7e91a8'),spaceAfter=7))
def p(t,style='BodyLW'):return Paragraph(t,styles[style])
def head(t):return p(t,'HeadLW')
def footer(c,d):
 c.setStrokeColor(colors.HexColor('#dfe7f0'));c.line(44,43,551,43);c.setFont('Helvetica',8);c.setFillColor(colors.HexColor('#91a0b4'));c.drawString(44,29,'LENDWISE / SYNTHETIC PRESALES DEMONSTRATION');c.drawRightString(551,29,str(d.page))
def build(name,story):
 if '--policy-only' in sys.argv and name!='sample-personal-loan-policy.pdf':return
 if '--submission-only' in sys.argv and name=='sample-personal-loan-policy.pdf':return
 SimpleDocTemplate(str(out/name),pagesize=(595,842),leftMargin=44,rightMargin=44,topMargin=42,bottomMargin=59).build(story,onFirstPage=footer,onLaterPages=footer)
def title(k,t,sub):return [p(k,'SmallLW'),p(t,'TitleLW'),p(sub,'SubLW')]
if '--policy-only' not in sys.argv:
 from submission_documents import build_submission_documents
 build_submission_documents()
policy=title('SYNTHETIC BANK POLICY / PL-V1','Personal Loan Policy','Fictional Mangalore Bank. Effective 14 November 2026. Demo assumptions only; not official bank policy, regulatory guidance or a lending offer.')
policy += [head('2. Applicant eligibility'),p('<b>2.1 Age:</b> minimum 21 at application and maximum 60 at final repayment.<br/><b>2.2 Income:</b> verified net monthly income at least INR 25,000.<br/><b>2.3 Employment:</b> 12 months total employment and 6 months with current employer. Shorter history requires review. Scope is salaried applicants only.'),head('3. Product terms'),p('<b>3.1 Amount:</b> INR 50,000 to INR 10 lakh.<br/><b>3.2 Tenure:</b> 12 to 60 months, subject to maturity-age limit.<br/><b>3.3 Rate:</b> illustrative fixed annual interest rate 12%, reducing-balance monthly EMI. Fees are not modelled. A real offer would require complete APR/fee and KFS disclosures.'),head('4. Credit and affordability'),p('<b>4.1 Bureau:</b> score 750+ meets the score criterion; 700-749 requires review; below 700 recommends decline. No score or a current overdue flag requires review.<br/><b>4.2 Obligation ratio:</b> existing monthly EMIs plus proposed EMI must be no more than 50% of verified net monthly income. Failure defaults to review.<br/><b>4.3 Consistency:</b> declared income differing from verified salary credits by more than 10% requires review; it is not proof of fraud.'),head('5. Evidence requirements'),p('<b>5.1 Documents and identity:</b> identity evidence, three months of salary slips and six months of bank statements are required for this demo. Missing evidence or incomplete mock identity verification blocks approval. Applicant consent is simulated. No real government identifiers are collected.'),head('6. Workflow and service target'),p('<b>6.1 Timeline:</b> illustrative review target is 2 working days after complete evidence and checks. This is not a guarantee, measured result or regulatory deadline.<br/><b>6.2 Authority:</b> the credit officer reviews evidence and records the final decision and reason. A review recommendation needs an exception justification if approved. A pending or stale assessment cannot be approved. Approval precedes sanction; acceptance, agreement and mandate precede simulated disbursement.'),head('7. Configuration and traceability'),p('Policy admins may edit supported numerical thresholds and failure routes. A separate simulated reviewer activates a validated version. The current app activates immediately; future-dated scheduling is not implemented. Previous assessment snapshots remain available in the audit trail. Final employee approval and evidence requirements cannot be removed through these settings. This file records v1; the app displays the active configuration after later changes.','SmallLW')]
build('sample-personal-loan-policy.pdf',policy)
print('Updated D5/D6.' if '--submission-only' in sys.argv else 'Updated sample policy.' if '--policy-only' in sys.argv else 'Created research note, AI usage log and sample policy.')
