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
};

export function EmptyState({ variant, action, className }: EmptyStateProps) {
  const content = EMPTY_STATE_CONTENT[variant];
  const Icon = content.icon;

  return (
    <Empty className={cn("border border-white/10 bg-secondary/45", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon" aria-hidden>
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{content.title}</EmptyTitle>
        <EmptyDescription>{content.message}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
