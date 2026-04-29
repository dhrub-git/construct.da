# Phase 01 — construct.da concept mockups

I'm using the writing-implementation-plans skill to create the implementation plan.

## Scope assumption
This workspace is not a git repo and contains no application code. The deliverable is a static concept prototype only.

## Review mode assumption
Because interactive review tooling is unavailable in this session and the user explicitly asked to proceed, this plan is written to disk in one pass for review afterwards.

## Frontend-skill framing
- **Visual thesis:** A light, premium, trust-first approvals product that blends calm property-tech guidance with professional compliance clarity.
- **Content plan:** hero + product value, guided intake, evidence-backed advisory dashboard, final service CTA.
- **Interaction thesis:** screen switching via top nav tabs, intake step progression, subtle hover/state transitions for dashboard severity modules.

## Files to create
- `mockups/approval-concept/index.html`
- `mockups/approval-concept/styles.css`
- `mockups/approval-concept/script.js`
- `mockups/approval-concept/README.md`

## Tasks
1. Create the `mockups/approval-concept/` directory.
2. Create `styles.css` with reusable tokens for the light construct.da palette, spacing, shadows, type, buttons, cards, and mock device/surface shells.
3. Create `index.html` with a shared shell and three switchable screens:
   - landing page
   - intake wizard
   - advisory dashboard
4. Create `script.js` for:
   - screen tab switching
   - intake step switching
   - lightweight dashboard filter/state interactions
5. Create `README.md` with how to open or serve the prototype locally.
6. Run a static verification pass by opening the HTML and checking for missing file references or broken basic interactions.

## Verification
- `index.html` loads `styles.css` and `script.js` successfully.
- All three screens are reachable from the top navigation.
- Intake wizard next/back interactions work.
- Dashboard filters toggle visual state.
- Styling reflects the approved light theme and construct.da branding.
