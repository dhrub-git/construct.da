# Context Snapshot — AU DA Compliance Audit

## Task statement
Create a full detailed plan for an application that audits Australian building/development approval documentation for builders and homeowners. Users upload existing documentation; the system determines the relevant approval/compliance rules from the property address and local council, checks documentation completeness/compliance, and returns recommendations and service handoff options.

## Desired outcome
A research-grounded product/compliance plan covering scope, data sources, architecture, operating model, risks, and phased delivery for a DA/compliance audit platform.

## Known facts / evidence
- Workspace currently has no application code; only `.omx/` session files exist.
- NSW has multiple planning approval pathways, with consent authority guided by the EP&A Act, EP&A Regulation, SEPPs and LEPs.
- NSW local development requires checking zoning/constraints via the Planning Portal Spatial Viewer and typically lodges to local council with supporting plans and environmental assessment.
- NSW online planning certificates can surface zoning, controls, contamination/flood/bushfire and related land constraints.
- Victoria uses council-specific planning schemes built from the Victoria Planning Provisions; there are both regular permit and VicSmart permit processes.
- Queensland uses local planning schemes plus Planning Act / Regulation concepts such as assessable development, properly made applications, DA Form 1, assessment manager and referrals.
- South Australia’s PlanSA exposes address-based zoning/policies/overlays and a development application checklist.
- WA, ACT and NT also have distinct portals/processes, indicating strong jurisdictional variance.
- The NCC is national but planning/development approval remains state/territory and council-specific.
- G-NAF is a quarterly-updated national geocoded address dataset suitable for address normalization / lookup.

## Constraints
- Must use Ref MCP and web research.
- Need a detailed plan, not implementation.
- Scope is potentially Australia-wide and highly heterogeneous across states/territories/councils.
- Compliance outcomes must likely be advisory-first unless legal/accountable sign-off is explicitly staffed.

## Unknowns / open questions
- Nationwide launch vs phased rollout.
- Primary user persona: homeowner self-serve, builder/professional workflow, or council-adjacent B2B.
- Desired legal posture: information assistant vs formal compliance pre-check vs managed service.
- Depth of automation expected for document drafting/fixing versus checklist/reporting only.
- Commercial priority: residential first vs broader development types.

## Likely touchpoints
- Research/spec artifacts under `.omx/` or `docs/` if later requested.
- Data acquisition for address, council, zoning, overlays, planning schemes, DA checklists, building code references.
- RAG/rules engine architecture planning.
