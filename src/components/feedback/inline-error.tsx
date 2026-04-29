import { AlertCircleIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ERROR_STATE_CONTENT,
  type ErrorStateVariant,
} from "@/components/feedback/feedback-content";

type InlineErrorProps = {
  variant: Extract<ErrorStateVariant, "widgetFetch" | "tableFetch">;
  message?: string;
  onRetry?: () => void;
};

export function InlineError({ variant, message, onRetry }: InlineErrorProps) {
  const content = ERROR_STATE_CONTENT[variant];

  return (
    <Alert variant="destructive" className="rounded-[14px] border-white/14 bg-destructive/10 p-4">
      <AlertCircleIcon aria-hidden />
      <AlertTitle>{content.title}</AlertTitle>
      <AlertDescription>{message ?? content.message}</AlertDescription>
      {onRetry && content.retryLabel ? (
        <div className="mt-2">
          <Button variant="outline" size="sm" onClick={onRetry} aria-label={content.retryLabel}>
            {content.retryLabel}
          </Button>
        </div>
      ) : null}
    </Alert>
  );
}
