import { ErrorState } from "@/components/feedback/error-state";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-7xl px-6 py-10 lg:px-10 lg:py-12">
      <ErrorState variant="notFound" backHref="/dashboard" />
    </div>
  );
}
