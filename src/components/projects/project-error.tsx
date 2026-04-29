"use client";

import { ErrorState } from "@/components/feedback/error-state";

type ProjectErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export function ProjectError({ message, onRetry }: ProjectErrorProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
      <ErrorState
        variant="projectFetch"
        message={message}
        onRetry={onRetry}
        backHref="/dashboard"
        supportHref="#"
      />
    </div>
  );
}
