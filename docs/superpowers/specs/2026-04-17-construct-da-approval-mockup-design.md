# construct.da Mockup Design

## Overview
This document defines the visual and UX direction for concept mockups of **construct.da**, an advisory pre-lodgement compliance checker for development/building approval documentation. The mockups are intended to communicate the concept clearly, not serve as production-ready UI.

## Goal
Create three light-themed concept screens in HTML/CSS/JS:
1. Landing page
2. Intake wizard
3. Advisory report dashboard

These mockups should help explain the product to stakeholders and provide a strong visual foundation for later implementation.

## Brand and positioning
- Product name: **construct.da**
- Tone: credible, modern, calm, and premium without feeling overly corporate or luxury-editorial
- Audience balance:
  - approachable for homeowners
  - trustworthy for builders, draftspersons, and professional reviewers

## Chosen visual direction
Selected direction: **C — hybrid professional dashboard**, modified to be **light-first** rather than dark-led.

Why this direction:
- It supports both homeowner and builder personas.
- It works across all three screens without changing visual language.
- It communicates seriousness and trust while remaining easy to understand.

## Visual system
### Color theme
The mockups should follow the same family as the provided reference theme, but interpreted for construct.da in a light interface.

#### Primary colors
- Warm ivory / off-white backgrounds
- Deep teal primary color for buttons, links, and key actions
- Soft duck-egg / mint accents for secondary highlights and trust states
- Navy/dark slate for headings and strong contrast text
- Amber/yellow reserved for warnings, readiness highlights, and attention states

#### Theme intent
- overall interface should read as **light and open**
- dark surfaces should be rare and used only as accents
- the palette should feel premium, calm, and structured

### Typography
- Sans-serif primary UI typography
- Optional serif accent for selected hero or marketing headings only if it strengthens the premium feel without making the product feel editorial-heavy
- Dashboard and form surfaces should stay clean and sans-serif-led for clarity

### Styling language
- Rounded corners
- Soft shadows
- Low-noise surfaces
- Clear spacing and hierarchy
- Strong use of card-based composition
- Premium but practical tone

## Screen definitions

### 1. Landing page
#### Purpose
Explain the product quickly and drive users into the approval check flow.

#### Core sections
- Header / top navigation
- Hero section with primary headline and CTA
- Supporting explanation of the product value
- “How it works” block
- Trust / coverage strip showing NSW, Victoria, and Queensland
- Optional sample report or advisory preview teaser
- CTA to start the process

#### Key content direction
The landing page should communicate:
- upload your documents
- we identify likely approval requirements based on address and council
- we flag missing items and potential risks
- this is advisory pre-lodgement guidance, not formal council approval

### 2. Intake wizard
#### Purpose
Guide users through the data collection flow in a way that feels simple, trustworthy, and manageable.

#### Steps to visually represent
- Address
- Local council / jurisdiction context
- Project type
- Document upload
- Review and start check

#### UX direction
- Multi-step layout
- Visible progress indicator or stepper
- Large, easy-to-understand input cards
- Drag-and-drop upload zone
- Guidance text that reduces anxiety for first-time users
- Optional helper tips or side panel for “what documents you may already have” 

#### Tone
This screen should feel supportive and guided, but not casual.

### 3. Advisory dashboard
#### Purpose
Present the output of the advisory compliance check in a structured, useful format.

#### Core modules
- Readiness summary / score / status banner
- Missing documents
- Risk flags / key issues
- Recommendations / next actions
- Evidence/source-backed advisory notes
- CTA for managed service or expert help

#### UX direction
- Use a dashboard card system
- Present issues by severity
- Make recommendations actionable and readable
- Show enough density to feel useful, but avoid enterprise UI clutter
- Include a clear “Need help fixing this?” conversion path

## Interaction design
- HTML/CSS/JS only
- Conceptual interaction only; lightweight simulated behavior is acceptable
- No backend integration required
- Small animations or state transitions are acceptable if they improve comprehension
- Focus on storytelling and clarity over technical completeness

## Layout intent across all three screens
- Consistent header and brand system
- Consistent card shapes and spacing rhythm
- Consistent use of color states:
  - teal = primary / safe / active
  - amber = warning / attention
  - slate/navy = text / emphasis
  - mint/duck-egg = calm support / informational trust

## Constraints
- Keep it conceptual and fast to understand
- Keep it light-themed
- Keep the three screens visually unified
- Avoid drifting into generic SaaS styling
- Avoid dark-heavy dashboards
- Avoid overcomplicated enterprise tables in the concept version

## Recommended implementation approach for mockups
Use a small static prototype with:
- one HTML entry screen or separate screen sections
- reusable CSS variables for palette and spacing
- light JS only for step switching, tab changes, and minor UI simulation

## Success criteria
The mockups are successful if they:
- make the concept immediately understandable
- feel aligned with the reference theme family
- look credible for a property/compliance product
- can be shown to stakeholders as a visual explanation of the concept
- clearly differentiate landing, intake, and advisory states

## Out of scope
- Production design system
- Responsive production polish across all breakpoints
- Real council/rules integration
- Full accessibility audit
- Backend workflows

## Next step
After user review of this spec, create the HTML/CSS/JS concept mockups for the three approved screens using the selected light-theme hybrid direction.
