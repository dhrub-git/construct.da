"use client";

import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ERROR_STATE_CONTENT,
  type ErrorStateVariant,
} from "@/components/feedback/feedback-content";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  variant: ErrorStateVariant;
  message?: string;
  technicalMessage?: string;
  onRetry?: () => void;
  backHref?: string;
  supportHref?: string;
  className?: string;
};

export function ErrorState({
  variant,
  message,
  technicalMessage,
  onRetry,
  backHref,
  supportHref,
  className,
}: ErrorStateProps) {
  const content = ERROR_STATE_CONTENT[variant];
  const Icon = content.icon;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon aria-hidden />
          {content.title}
        </CardTitle>
        <CardDescription>{message ?? content.message}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {technicalMessage || content.technicalMessage ? (
          <Alert variant="destructive" aria-live="polite">
            <Icon aria-hidden />
            <AlertTitle>Technical details</AlertTitle>
            <AlertDescription>
              {technicalMessage ?? content.technicalMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {onRetry && content.retryLabel ? (
            <Button onClick={onRetry} aria-label={content.retryLabel}>
              {content.retryLabel}
            </Button>
          ) : null}

          {backHref && content.backLabel ? (
            <Button variant="outline" render={<Link href={backHref} />}>
              {content.backLabel}
            </Button>
          ) : null}

          {supportHref && content.supportLabel ? (
            <Button variant="ghost" render={<Link href={supportHref} />}>
              {content.supportLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
