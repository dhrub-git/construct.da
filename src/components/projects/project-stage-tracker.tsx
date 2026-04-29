import { CheckIcon } from "lucide-react";
import { ProjectStage } from "@models/data";
import { cn } from "@/lib/utils";

const orderedStages: ProjectStage[] = [
  ProjectStage.CREATED,
  ProjectStage.FILES_UPLOADED,
  ProjectStage.PARSING,
  ProjectStage.ANALYSIS,
  ProjectStage.COMPLIANCE_REVIEW,
  ProjectStage.COMPLETED,
];

const labels: Record<ProjectStage, string> = {
  CREATED: "Created",
  FILES_UPLOADED: "Files uploaded",
  PARSING: "Parsing",
  ANALYSIS: "Analysis",
  COMPLIANCE_REVIEW: "Compliance review",
  COMPLETED: "Completed",
};

type ProjectStageTrackerProps = {
  stage: ProjectStage;
};

export function ProjectStageTracker({ stage }: ProjectStageTrackerProps) {
  const activeIndex = orderedStages.indexOf(stage);

  return (
    <ol className="grid gap-3 md:grid-cols-3" aria-label="Project stages">
      {orderedStages.map((item, index) => {
        const isCompleted = index < activeIndex;
        const isActive = index === activeIndex;

        return (
          <li
            key={item}
            className={cn(
              "rounded-xl border p-3",
              isActive && "border-primary bg-primary/5",
              isCompleted && "border-border bg-muted/40",
            )}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-xs",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary text-primary",
                  !isCompleted && !isActive && "border-border text-muted-foreground",
                )}
              >
                {isCompleted ? <CheckIcon /> : index + 1}
              </span>
              <span>{labels[item]}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
