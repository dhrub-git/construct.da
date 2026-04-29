export type IntakeStep = {
  id: string;
  label: string;
  heading: string;
  description: string;
};

export const intakeSteps: IntakeStep[] = [
  {
    id: "project",
    label: "Project details",
    heading: "Project details",
    description:
      "Capture the applicant type and the kind of residential work being screened.",
  },
  {
    id: "property",
    label: "Property context",
    heading: "Property context",
    description:
      "Anchor the address and jurisdiction details before any rules or document checks begin.",
  },
  {
    id: "scope",
    label: "Scope notes",
    heading: "Scope notes",
    description:
      "Summarise the proposed work so later extraction and review steps have the right context.",
  },
  {
    id: "documents",
    label: "Document readiness",
    heading: "Document readiness",
    description:
      "Confirm which plans and reports already exist so the later upload flow has the right expectations.",
  },
];
