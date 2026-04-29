import { type ReactNode } from "react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  EMPTY_STATE_CONTENT,
  type EmptyStateVariant,
} from "@/components/feedback/feedback-content";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  variant: EmptyStateVariant;
  action?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
};

export function EmptyState({
  variant,
  action,
  className,
  title,
  description,
}: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[variant];
  const Icon = content.icon;

  return (
    <Empty className={cn("border border-border bg-secondary/45", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" aria-hidden>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title ?? content.title}</EmptyTitle>
        <EmptyDescription>{description ?? content.message}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
