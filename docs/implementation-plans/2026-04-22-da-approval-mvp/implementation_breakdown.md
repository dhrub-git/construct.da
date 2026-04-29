# DA Approval MVP - Implementation Breakdown

## Verdict
No, the repo did **not** yet have a full implementation breakdown for the actual product build.

What existed before this document:
- `.omx/plans/prd-da-approval-advisory-checker.md` - strong product/architecture PRD
- `.omx/plans/test-spec-da-approval-advisory-checker.md` - strong verification spec
- `docs/implementation-plans/2026-04-17-construct-da-approval-mockups/phase_01.md` - implementation plan for the static mockups only

What was missing:
- a build-ready engineering to-do list that decomposes the PRD into concrete epics, tasks, dependencies, deliverables, and verification gates

## Scope assumptions
- This breakdown is for the **actual MVP product**, not just the concept mockups.
- The target architecture remains the PRD's Vercel-first setup: Next.js + Vercel Functions + Blob + Postgres + Edge Config.
- MVP scope remains advisory-only for NSW, Victoria, and Queensland residential cases.
- This is a sequencing and handoff document, not a commitment that every item must ship on day one.

## Definition of done for the breakdown
This plan is complete if it gives the team:
1. clear workstreams,
2. task ordering,
3. dependencies,
4. verification checkpoints,
5. MVP vs later boundaries.

---

# 1. Delivery structure

## Workstreams
1. Product and domain model
2. Platform foundation
3. Source registry and ingestion
4. Address and property-context resolution
5. Document intake and storage
6. OCR, classification, and fact extraction
7. Rules engine and findings generation
8. Report generation and advisory UX
9. Reviewer workflow and legal guardrails
10. Operations, replay testing, and launch readiness

## Suggested implementation order
1. Foundation and schema
2. Source registry
3. Intake and uploads
4. Address resolution
5. Document extraction
6. Rules engine
7. Report UI
8. Reviewer queue
9. Replay/ops hardening
10. Pilot launch

---

# 2. Epic-by-epic implementation to-do list

## Epic 0 - Project setup and guardrails
**Goal:** create the minimum scaffold so subsequent work lands in stable boundaries.

### Tasks
- Create the production app workspace structure.
- Establish environment variable contract for Blob, Postgres, auth, and model providers.
- Add shared config for supported jurisdictions, supported project types, and feature flags.
- Define repository conventions for domain modules, ingestion modules, and verification fixtures.
- Add baseline README for local development and deployment flow.
- Add a decision log/ADR location if not already standardized.

### Deliverables
- runnable app scaffold
- env template
- project conventions doc

### Verify
- app boots locally
- env validation fails clearly when required keys are missing
- CI/basic checks run successfully

### Dependencies
- none

---

## Epic 1 - Canonical domain model and database schema
**Goal:** lock the core nouns before implementation spreads.

### Tasks
- Define schemas/tables for:
  - `jurisdiction_pack`
  - `source_document`
  - `rule`
  - `rule_condition`
  - `document_requirement`
  - `property_context`
  - `project_case`
  - `project_document`
  - `extracted_fact`
  - `finding`
  - `recommendation`
  - `confidence_event`
  - `human_review_event`
- Define enumerations for:
  - state/jurisdiction
  - project type
  - source tier
  - finding severity
  - finding status
  - confidence band
  - escalation reason
- Add ruleset versioning model.
- Add provenance fields to all user-visible findings.
- Add audit fields to reviewer actions.

### Deliverables
- schema diagrams or table definitions
- initial migrations
- typed server models

### Verify
- migrations apply cleanly
- typed models match database schema
- seed data can create a minimal project -> source -> finding flow

### Dependencies
- Epic 0

---

## Epic 2 - Supported-scope matrix and business rules boundary
**Goal:** prevent silent scope creep.

### Tasks
- Encode supported case types for MVP by jurisdiction.
- Encode unsupported-case policy and escalation reasons.
- Define the first-pass approval pathway taxonomy.
- Define the first-pass document taxonomy.
- Define finding categories:
  - missing document
  - likely control breach
  - contradiction
  - unsupported case
  - review required
- Define confidence thresholds that force human review.

### Deliverables
- supported-case matrix
- unsupported-case matrix
- taxonomy constants/shared domain file

### Verify
- unsupported case can be detected before deep processing
- sample cases map consistently into one supported flow

### Dependencies
- Epic 1

---

## Epic 3 - Source registry and source ingestion foundation
**Goal:** create the authoritative source inventory before compliance logic.

### Tasks
- Build source registry model for Tier 1 and Tier 2 sources.
- Add ingestion metadata fields:
  - source URL
  - authority owner
  - jurisdiction
  - council/LGA
  - source type
  - fetch status
  - checksum/hash
  - last fetched at
  - effective date
  - reviewed/promoted status
- Implement fetch pipeline for pilot sources.
- Persist raw source snapshots.
- Add source diff detection.
- Add analyst-review status before activating changed rules.

### NSW pilot tasks
- Register NSW Planning Portal references.
- Register BASIX-related guidance sources used by MVP.
- Register pilot council DCP/checklist sources.

### Victoria pilot tasks
- Register planning scheme references.
- Register VicPlan/property-report-related references.
- Register pilot council-linked scheme sources.

### Queensland pilot tasks
- Register DA Rules, SPP, SDAP, and SARA-related references.
- Register local planning scheme and planning scheme policy sources for pilot councils.

### Deliverables
- source registry tables/data
- fetch jobs
- source snapshot storage layout
- source diff report output

### Verify
- pilot sources fetch successfully
- source metadata persists correctly
- checksum changes are detected
- changed sources do not auto-promote without review status

### Dependencies
- Epic 1
- Epic 2

---

## Epic 4 - Address intake and property-context resolution
**Goal:** turn a user-entered address into jurisdiction + council + controls context.

### Tasks
- Build intake form for address, project type, and project description.
- Add address normalization and validation.
- Resolve state and local authority from address.
- Attach planning-scheme/control references to a `property_context` record.
- Add edge-case handling for incomplete or ambiguous addresses.
- Record resolution confidence and review triggers.

### Deliverables
- intake form/API
- address resolution service
- `property_context` persistence

### Verify
- NSW sample addresses map to correct LGA/context
- Victoria sample addresses map to planning scheme/zone/overlay context
- Queensland sample addresses map to local scheme + state-interest review context
- ambiguous addresses route to review instead of pretending certainty

### Dependencies
- Epic 1
- Epic 2
- Epic 3

---

## Epic 5 - Authentication, project workspace, and uploads
**Goal:** support a real per-project workflow with secure document handling.

### Tasks
- Implement authenticated project workspace.
- Create project/case creation flow.
- Add server-mediated or signed upload flow to private Blob storage.
- Persist uploaded document metadata and linkage to project cases.
- Add document type labels and upload states.
- Add basic file validation: size, type, duplicate detection.

### Deliverables
- project dashboard shell
- upload flow
- document metadata model

### Verify
- authenticated user can create a case
- documents upload to private storage
- unauthorized access is blocked
- metadata survives reloads and reprocessing

### Dependencies
- Epic 0
- Epic 1

---

## Epic 6 - OCR, classification, and structured fact extraction
**Goal:** extract enough structured evidence to drive deterministic checks.

### Tasks
- Define extraction pipeline states.
- Implement OCR processing for PDFs/scanned files.
- Classify uploaded files into known document classes.
- Extract first-pass facts:
  - site area
  - lot/DP or title references
  - setbacks
  - building height
  - number of storeys
  - room/use hints
  - presence of consultant reports
- Store extraction confidence per fact.
- Add re-run capability for failed/updated extraction.
- Add review-required flags for low-confidence core facts.

### Deliverables
- extraction service
- classified document records
- extracted-fact persistence

### Verify
- sample plan/report bundle produces classified outputs
- extracted facts persist with confidence
- low-confidence extraction triggers review
- failed extraction does not create fake facts

### Dependencies
- Epic 5
- Epic 2

---

## Epic 7 - Rules representation and deterministic compliance engine
**Goal:** evaluate completeness and likely issues using traceable rules.

### Tasks
- Define machine-readable rule representation.
- Implement rule loading by jurisdiction pack + council context.
- Implement document requirement checks.
- Implement pathway screening checks.
- Implement contradiction checks across extracted facts/documents.
- Implement overlay/referral trigger checks where MVP supports them.
- Implement unsupported-case guardrails so the engine declines gracefully.
- Attach source provenance to every finding.
- Record confidence and escalation reason on every finding.

### Deliverables
- rules engine module
- rule evaluation trace model
- first rulesets for pilot jurisdictions/councils

### Verify
- test fixtures produce expected missing-document findings
- contradictory documents produce contradiction findings
- unsupported cases never emit overconfident rule claims
- every finding includes source/version/confidence

### Dependencies
- Epic 3
- Epic 4
- Epic 6

---

## Epic 8 - Recommendation generation and report assembly
**Goal:** turn findings into a usable advisory report without losing provenance.

### Tasks
- Define report structure:
  - executive summary
  - property/project context
  - missing documents
  - likely issues
  - recommendations
  - confidence and escalation section
  - disclaimer/next steps
- Generate structured report payload from findings.
- Add explanation layer that converts deterministic findings into readable guidance.
- Ensure no explanation can drop or alter source provenance.
- Add exportable report artifact generation.

### Deliverables
- report view
- report payload schema
- generated report artifact

### Verify
- every report section renders with expected data
- every surfaced finding shows source/version/confidence
- ambiguous cases show review/escalation language
- no report uses pass/fail language for high-risk outcomes

### Dependencies
- Epic 7
- Epic 5

---

## Epic 9 - Reviewer workflow and operations console
**Goal:** support human review where the system is uncertain or risk is high.

### Tasks
- Build reviewer queue page.
- Show escalation reason, confidence events, extracted facts, findings, and source evidence.
- Allow reviewer override/confirm/reject actions.
- Persist audit trail for reviewer actions.
- Add status model for cases:
  - intake received
  - processing
  - awaiting review
  - report ready
  - escalated
  - closed
- Add analyst tooling for source/ruleset approval state.

### Deliverables
- reviewer queue
- case review detail page
- audit trail storage

### Verify
- low-confidence cases enter queue automatically
- reviewer action updates case status
- audit log captures actor, time, and reason
- changed source/ruleset can be held from promotion

### Dependencies
- Epic 3
- Epic 7
- Epic 8

---

## Epic 10 - Legal posture and user-facing guardrails
**Goal:** ensure the product stays advisory-only in both logic and copy.

### Tasks
- Add disclaimer acceptance in intake/report flow.
- Standardize advisory wording in UI and reports.
- Block forbidden language such as definitive approval claims where not allowed.
- Add unsupported-case messaging.
- Add managed-service handoff CTA for escalated cases.
- Add visibility of report date, ruleset date, and source freshness context.

### Deliverables
- legal copy set
- disclaimer acceptance flow
- advisory-language guardrails in report generation

### Verify
- report text uses advisory wording only
- unsupported/high-risk cases route to escalation copy
- freshness/version info is visible to the user

### Dependencies
- Epic 8
- Epic 9

---

## Epic 11 - Replay harness, fixture packs, and quality gates
**Goal:** prove the engine behaves consistently before pilot release.

### Tasks
- Build fixture packs for gold-set pilot cases.
- Add source-ingestion tests.
- Add address-resolution tests.
- Add extraction tests.
- Add deterministic rules regression tests.
- Add report/provenance tests.
- Add stale-source and rollback tests.
- Add reviewer-flow integration tests.

### Deliverables
- automated test suites
- gold-set fixture library
- regression dashboard/report

### Verify
- tests cover the acceptance thresholds from the test spec
- findings are reproducible across reruns for fixed inputs/ruleset versions
- stale-source simulation blocks release path

### Dependencies
- Epics 3 through 10

---

## Epic 12 - Scheduled operations and production readiness
**Goal:** make the MVP operable after internal demos.

### Tasks
- Add Cron jobs for source refresh.
- Add Cron jobs for source diff detection.
- Add Cron jobs for replay scheduling.
- Add operational alerts for stale sources and failed runs.
- Add emergency kill switch for jurisdiction-pack disablement.
- Document incident response steps.
- Validate preview -> production promotion workflow.

### Deliverables
- scheduled jobs
- operational runbook
- alerting configuration
- kill-switch path

### Verify
- Cron jobs run successfully
- jurisdiction pack can be disabled without redeploy
- failed refresh/replay generates an operational signal
- preview and production environments have correct config wiring

### Dependencies
- Epic 3
- Epic 11

---

# 3. Cross-cutting task list

## Data and provenance
- Ensure all findings are explainable.
- Ensure every source snapshot is versioned.
- Ensure report output never contains uncited rule claims.

## Security and privacy
- Private document storage only.
- Minimal retention/access policy for uploaded plans.
- Audit access to review flows and project artifacts.

## Performance
- Keep standard case turnaround under target median.
- Separate long-running extraction/compliance tasks from user-facing request latency.

## Product analytics
- Track case volume, escalation rate, time-to-report, managed-service CTA clicks, and reviewer outcomes.

---

# 4. MVP cut line vs later work

## Must-have for MVP
- supported-case matrix
- pilot source registry for NSW/VIC/QLD
- address intake and property-context resolution
- private uploads
- OCR/classification/fact extraction for core residential docs
- deterministic missing-document and pathway checks
- provenance-backed report
- reviewer queue
- legal/advisory guardrails
- replay suite and source freshness checks

## Can wait until after MVP
- broad council expansion beyond pilot councils
- advanced geometric plan analysis
- automated payment/checkout sophistication
- white-label partner workflows
- commercial/non-residential support
- full lodgement automation

---

# 5. Practical build sequence by sprint

## Sprint 1
- Epic 0
- Epic 1
- Epic 2
- start Epic 3 source registry skeleton

## Sprint 2
- finish Epic 3
- Epic 4
- Epic 5

## Sprint 3
- Epic 6
- start Epic 7

## Sprint 4
- finish Epic 7
- Epic 8
- start Epic 9

## Sprint 5
- finish Epic 9
- Epic 10
- start Epic 11

## Sprint 6
- finish Epic 11
- Epic 12
- pilot-readiness review

---

# 6. Immediate next tasks

If the team wants to start now, the next concrete actions should be:
1. Convert the PRD domain nouns into actual schema/migration files.
2. Freeze the supported-case matrix for NSW/VIC/QLD MVP.
3. Stand up the source registry with 6 pilot councils.
4. Build the authenticated case + upload flow.
5. Create the first 20 gold-set case fixtures from the test spec.

---

# 7. Recommended owner split

## Product/domain lane
- supported-case matrix
- taxonomy
- advisory wording
- ruleset acceptance

## Platform lane
- app scaffold
- auth
- uploads
- Blob/Postgres/Edge Config wiring
- Cron/ops setup

## Data/compliance lane
- source registry
- ingestion
- extraction
- rules engine
- replay suite

## Reviewer/UX lane
- project workspace
- report UI
- reviewer queue
- handoff UX

---

# 8. Final assessment
You now have the missing implementation breakdown.

Short answer to your original question:
- **Before this file:** no, not fully.
- **Now:** yes, there is a full engineering to-do list for implementation planning.
