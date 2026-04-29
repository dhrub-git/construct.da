import { type ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type PageSkeletonProps = {
  titleWidthClass?: string;
  subtitleWidthClass?: string;
  actionWidthClass?: string;
  children?: ReactNode;
};

export function PageSkeleton({
  titleWidthClass = "w-72",
  subtitleWidthClass = "w-[32rem]",
  actionWidthClass = "w-48",
  children,
}: PageSkeletonProps) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <section className="flex flex-col gap-4 border-b border-white/8 pb-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className={`h-10 max-w-full ${titleWidthClass}`} />
          <Skeleton className={`h-5 max-w-full ${subtitleWidthClass}`} />
        </div>
        <Skeleton className={`h-10 max-w-full rounded-[13px] ${actionWidthClass}`} />
      </section>

      {children}
    </div>
  );
}
