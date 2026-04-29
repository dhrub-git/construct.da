"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/feedback/error-state";

type ProjectRouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ProjectRouteErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
      <ErrorState
        variant="routeCrash"
        message="The project view could not be rendered due to an unexpected error."
        technicalMessage={error.digest ? `Error digest: ${error.digest}` : undefined}
        onRetry={reset}
        backHref="/dashboard"
        supportHref="#"
      />
    </div>
  );
}