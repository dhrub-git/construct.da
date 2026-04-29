import { SKELETON_LAYOUT } from "@/components/feedback/feedback-content";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function ProjectSkeleton() {
  return (
    <PageSkeleton titleWidthClass="w-96" subtitleWidthClass="w-80" actionWidthClass="w-32">
      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-white/8 pb-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-28 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-32 rounded-full" />
            </div>
            <Skeleton className="h-8 w-72 max-w-full" />
            <Skeleton className="h-5 w-96 max-w-full" />
          </div>
          <Skeleton className="h-12 w-48 rounded-[14px]" />
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`project-header-meta-${index}`} className="rounded-[16px] border border-white/8 bg-secondary/40 p-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="mt-3 h-5 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-white/8 pb-4">
          <Skeleton className="h-10 w-80 max-w-full rounded-[14px]" />
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: SKELETON_LAYOUT.project.metaCards }).map((_, index) => (
              <div key={`project-metric-${index}`} className="rounded-[18px] border border-white/8 bg-secondary/40 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-4 h-8 w-16" />
                <Skeleton className="mt-2 h-4 w-40 max-w-full" />
              </div>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[18px] border border-white/8 bg-secondary/40 p-4">
              <Skeleton className="h-5 w-48" />
              <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`project-timeline-${index}`} className="h-14 w-full rounded-[14px]" />
                ))}
              </div>
            </div>
            <div className="rounded-[18px] border border-white/8 bg-secondary/40 p-4">
              <Skeleton className="h-5 w-32" />
              <div className="mt-4 flex flex-col gap-3">
                {Array.from({ length: SKELETON_LAYOUT.project.activityRows }).map((_, index) => (
                  <Skeleton key={`project-activity-${index}`} className="h-16 w-full rounded-[14px]" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageSkeleton>
  );
}
