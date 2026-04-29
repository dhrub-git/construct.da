"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { intakeSteps } from "@/lib/intake/steps";
import { cn } from "@/lib/utils";

const PROJECT_TYPES = [
  { value: "new-home", label: "New home" },
  { value: "extension", label: "Extension / renovation" },
  { value: "secondary-dwelling", label: "Secondary dwelling" },
];

export function IntakeShell() {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = intakeSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === intakeSteps.length - 1;

  const stepSummary = useMemo(
    () => `Step ${stepIndex + 1} of ${intakeSteps.length}: ${currentStep.heading}`,
    [currentStep.heading, stepIndex],
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10 lg:flex-row lg:px-10 lg:py-12">
        <aside className="w-full max-w-xl space-y-6 lg:sticky lg:top-10 lg:w-88 lg:self-start">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Intake shell
            </p>
            <h1 className="text-[32px] font-bold leading-tight tracking-[-0.02em]">Start the approval check</h1>
            <p className="leading-7 text-muted-foreground">
              This first slice stays local-state only. It proves the step flow, the tone,
              and the advisory guardrails before any uploads or rules logic are added.
            </p>
          </div>

          <div className="space-y-3 rounded-[18px] border border-border bg-secondary/55 px-6 py-5 shadow-[0_14px_34px_rgba(1,6,20,0.3)]">
            <p className="text-sm font-semibold text-foreground">
              Advisory only - we flag likely gaps before formal lodgement.
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              Final requirements still depend on the relevant council, certifier, and the
              current official ruleset for the property.
            </p>
          </div>

          <ol className="flex flex-col gap-2" aria-label="Approval intake steps">
            {intakeSteps.map((step, index) => {
              const isActive = index === stepIndex;
              const isComplete = index < stepIndex;

              return (
                <li key={step.id}>
                  <div
                    aria-current={isActive ? "step" : undefined}
                    className={cn(
                      "flex items-start gap-3 rounded-[18px] border border-transparent px-4 py-4 transition-all duration-200 ease-out",
                      isActive && "border-border bg-secondary/70 shadow-[0_8px_24px_rgba(1,6,20,0.24)]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                        isComplete && "border-primary bg-primary text-primary-foreground",
                        isActive && !isComplete && "border-primary text-primary",
                        !isActive && !isComplete && "border-border text-muted-foreground",
                      )}
                    >
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{step.label}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </aside>

        <main className="flex-1 space-y-6">
          <div className="space-y-3">
            <p aria-live="polite" className="text-sm font-semibold text-muted-foreground">
              {stepSummary}
            </p>
            <h2 className="text-[32px] font-bold tracking-[-0.02em]">{currentStep.heading}</h2>
            <p className="max-w-2xl leading-7 text-muted-foreground">
              {currentStep.description}
            </p>
          </div>

          <Separator />

          <div className="max-w-3xl space-y-8">
            {currentStep.id === "project" ? (
              <section className="space-y-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium" htmlFor="applicant-name">
                    Applicant or practice name
                  </label>
                  <Input
                    id="applicant-name"
                    placeholder="Example Projects Pty Ltd"
                    defaultValue="Example Projects Pty Ltd"
                  />
                </div>

                <fieldset className="space-y-4">
                  <legend className="text-sm font-medium">Project type</legend>
                  <RadioGroup defaultValue="extension" className="gap-3">
                    {PROJECT_TYPES.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 rounded-[14px] border border-border bg-secondary/45 px-4 py-3 text-foreground transition-all duration-200 ease-out hover:border-border hover:bg-secondary/65"
                      >
                        <RadioGroupItem value={option.value} />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>
              </section>
            ) : null}

            {currentStep.id === "property" ? (
              <section className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="site-address">
                    Site address
                  </label>
                  <Input
                    id="site-address"
                    placeholder="12 Example Street, Newcastle NSW"
                    defaultValue="12 Example Street, Newcastle NSW"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium" htmlFor="state">
                    State
                  </label>
                  <Input id="state" defaultValue="New South Wales" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium" htmlFor="council">
                    Council / local authority
                  </label>
                  <Input id="council" defaultValue="City of Newcastle" />
                </div>
              </section>
            ) : null}

            {currentStep.id === "scope" ? (
              <section className="space-y-3">
                <label className="text-sm font-medium" htmlFor="scope-notes">
                  Proposed works
                </label>
                <Textarea
                  id="scope-notes"
                  className="min-h-36"
                  defaultValue="Rear extension with internal reconfiguration, updated glazing, and a refreshed approval pack before full lodgement preparation."
                />
              </section>
            ) : null}

            {currentStep.id === "documents" ? (
              <section className="space-y-4">
                <p className="leading-7 text-muted-foreground">
                  File upload is a later slice. For now, this shell makes the expected case
                  pack visible before the real storage and OCR pipeline lands.
                </p>
                <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                  <li className="rounded-[14px] border border-border bg-secondary/45 px-4 py-3">
                    Site plan and floor plans
                  </li>
                  <li className="rounded-[14px] border border-border bg-secondary/45 px-4 py-3">
                    Elevations and setbacks
                  </li>
                  <li className="rounded-[14px] border border-border bg-secondary/45 px-4 py-3">
                    Supporting consultant reports
                  </li>
                  <li className="rounded-[14px] border border-border bg-secondary/45 px-4 py-3">
                    Any previous council correspondence
                  </li>
                </ul>
              </section>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
            <Button
              variant="outline"
              size="lg"
              disabled={isFirstStep}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            >
              Back
            </Button>
            <Button
              size="lg"
              onClick={() =>
                setStepIndex((current) =>
                  isLastStep ? current : Math.min(intakeSteps.length - 1, current + 1),
                )
              }
            >
              {isLastStep ? "Review intake shell" : "Next step"}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
