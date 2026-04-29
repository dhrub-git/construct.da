"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";

type DashboardRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: DashboardRouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
      <ErrorState
        variant="routeCrash"
        message="The dashboard encountered an unexpected issue and could not finish rendering."
        technicalMessage={error.digest ? `Error digest: ${error.digest}` : undefined}
        onRetry={reset}
        backHref="/dashboard"
        supportHref="#"
      />
    </div>
  );
}