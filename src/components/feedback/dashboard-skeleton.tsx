import { SKELETON_LAYOUT } from "@/components/feedback/feedback-content";
import { PageSkeleton } from "@/components/feedback/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <PageSkeleton>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: SKELETON_LAYOUT.dashboard.kpiCards }).map((_, index) => (
          <Card key={`dashboard-kpi-skeleton-${index}`} size="sm" className="bg-secondary/45">
            <CardHeader className="flex flex-col gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-20" />
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <div className="rounded-[18px] border border-white/8 bg-secondary/35 p-3">
              <Skeleton className="h-10 w-full" />
              <div className="mt-3 hidden grid-cols-7 gap-3 rounded-[14px] border border-white/8 bg-secondary/55 px-4 py-3 lg:grid">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={`dashboard-table-head-${index}`} className="h-3 w-full" />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {Array.from({ length: SKELETON_LAYOUT.dashboard.tableRows }).map((_, index) => (
                  <Skeleton key={`dashboard-table-row-${index}`} className="h-11 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {Array.from({ length: SKELETON_LAYOUT.dashboard.activityRows }).map((_, index) => (
              <div
                key={`dashboard-activity-row-${index}`}
                className="rounded-[14px] border border-white/10 bg-secondary/45 p-3"
              >
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </PageSkeleton>
  );
}
