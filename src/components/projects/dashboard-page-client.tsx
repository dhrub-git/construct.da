"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangleIcon,
  Building2Icon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FolderKanbanIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react";
import {
  fetchUserProjects,
  selectDashboardState,
  setUserId,
} from "@/redux/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/redux/useDispatch";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectTable } from "@/components/projects/project-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { InlineError } from "@/components/feedback/inline-error";
import { EMPTY_STATE_CONTENT } from "@/components/feedback/feedback-content";
import { Badge } from "@/components/ui/badge";
import { buildDashboardMetrics, type DashboardMetrics } from "@/lib/project-presentation";
import { cn } from "@/lib/utils";

const DASHBOARD_COPY = {
  eyebrow: "Advisory approval workspace",
  heading: "Approval workspace",
  description: "Track pre-lodgement readiness, document evidence, and projects that need planner review before formal submission work.",
  sectionTitle: "Project register",
  sectionDescription: "Search by project name, address, or council. Open a project to continue the advisory workflow.",
  searchPlaceholder: "Search projects",
  clearSearchLabel: "Clear search",
} as const;

interface DashboardPageClientProps {
  userId: string;
}

type DashboardMetricDefinition = {
  key: keyof DashboardMetrics;
  label: string;
  description: string;
  icon: LucideIcon;
  emphasis?: "primary" | "warning" | "success";
  format?: (value: number) => string;
};

const metricDefinitions: DashboardMetricDefinition[] = [
  {
    key: "total",
    label: "Total projects",
    description: "All approval files in this workspace",
    icon: FolderKanbanIcon,
  },
  {
    key: "active",
    label: "Active files",
    description: "Created or currently processing",
    icon: ClipboardListIcon,
    emphasis: "primary",
  },
  {
    key: "needsReview",
    label: "Projects needing review",
    description: "Requires attention before the next step",
    icon: AlertTriangleIcon,
    emphasis: "warning",
  },
  {
    key: "completed",
    label: "Completed checks",
    description: "Reports generated for review",
    icon: CheckCircle2Icon,
    emphasis: "success",
  },
  {
    key: "councils",
    label: "Councils",
    description: "Responsible authorities represented",
    icon: Building2Icon,
    format: (value) => `${value} ${value === 1 ? "council" : "councils"}`,
  },
];

function DashboardMetricCard({
  definition,
  value,
}: {
  definition: DashboardMetricDefinition;
  value: number;
}) {
  const Icon = definition.icon;
  const formattedValue = definition.format ? definition.format(value) : String(value);

  return (
    <Card
      size="sm"
      className={cn(
        "h-full bg-card/82 shadow-[0_14px_34px_rgb(15_23_42_/_0.07)]",
        definition.emphasis === "primary" && "border-primary/25",
        definition.emphasis === "warning" && "border-accent/35",
        definition.emphasis === "success" && "border-emerald-600/25",
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardDescription className="text-xs font-semibold uppercase tracking-[0.12em]">
            {definition.label}
          </CardDescription>
          <CardTitle className="text-3xl font-bold tracking-[-0.04em]">
            {formattedValue}
          </CardTitle>
        </div>
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
            definition.emphasis === "warning" && "bg-accent/12 text-accent",
            definition.emphasis === "success" && "bg-emerald-600/10 text-emerald-700",
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {definition.description}
        </p>
      </CardContent>
    </Card>
  );
}

export function DashboardPageClient({ userId }: DashboardPageClientProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { projects, loading, error } = useAppSelector(selectDashboardState);

  const [search, setSearch] = useState("");

  useEffect(() => {

    const bootstrap = async () => {

      dispatch(setUserId(userId));
      await dispatch(fetchUserProjects(userId));
    };

    void bootstrap();
  }, [dispatch, userId]);

  const filteredProjects = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) {
      return projects;
    }

    return projects.filter((project) => {
      return (
        project.name.toLowerCase().includes(normalized)
        || project.address.toLowerCase().includes(normalized)
        || project.council.toLowerCase().includes(normalized)
      );
    });
  }, [projects, search]);

  const metrics = useMemo(() => buildDashboardMetrics(projects), [projects]);
  const hasSearch = search.trim().length > 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-6 lg:px-10 lg:py-12">
      <section className="rounded-[28px] border bg-card/74 p-5 shadow-[0_18px_54px_rgb(15_23_42_/_0.08)] backdrop-blur-sm sm:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex max-w-3xl flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Official-source-first</Badge>
              <Badge variant="secondary">Residential MVP</Badge>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {DASHBOARD_COPY.eyebrow}
              </p>
              <h1 className="text-[36px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[48px]">
                {DASHBOARD_COPY.heading}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-[18px] sm:leading-8">
                {DASHBOARD_COPY.description}
              </p>
            </div>
          </div>
          {userId ? (
            <div className="flex shrink-0 flex-col gap-2 sm:items-start xl:items-end">
              <CreateProjectDialog userId={userId} onCreated={(projectId) => router.push(`/dashboard/${projectId}`)} />
              <p className="text-xs leading-5 text-muted-foreground">
                Start with address, council, and core DA documents.
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {metricDefinitions.map((definition) => (
            <DashboardMetricCard
              key={definition.key}
              definition={definition}
              value={metrics[definition.key]}
            />
          ))}
        </div>
      </section>

      <Card className="bg-card/86 shadow-[0_18px_54px_rgb(15_23_42_/_0.08)]">
        <CardHeader className="gap-4 border-b border-border pb-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <CardTitle>{DASHBOARD_COPY.sectionTitle}</CardTitle>
              <CardDescription>{DASHBOARD_COPY.sectionDescription}</CardDescription>
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {filteredProjects.length} of {projects.length} project
              {projects.length === 1 ? "" : "s"} shown
            </p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full max-w-xl">
              <SearchIcon className="pointer-events-none absolute top-3.5 left-3.5 size-4 text-muted-foreground" data-icon="inline-start" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-11"
                placeholder={DASHBOARD_COPY.searchPlaceholder}
                aria-label={DASHBOARD_COPY.searchPlaceholder}
              />
            </div>

            {hasSearch && filteredProjects.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch("")}
                aria-label={DASHBOARD_COPY.clearSearchLabel}
              >
                {DASHBOARD_COPY.clearSearchLabel}
              </Button>
            ) : null}
          </div>

          {loading ? (
            <div className="rounded-[18px] border border-border bg-secondary/45 p-3">
              <div className="hidden grid-cols-7 gap-3 rounded-[14px] border border-border bg-secondary/55 px-4 py-3 lg:grid">
                {Array.from({ length: 7 }).map((_, index) => (
                  <Skeleton key={`dashboard-head-skeleton-${index}`} className="h-3 w-full" />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={`dashboard-row-skeleton-${index}`} className="h-11 w-full" />
                ))}
              </div>
            </div>
          ) : null}

          {!loading && error ? (
            <InlineError
              variant="tableFetch"
              message={error}
              onRetry={() => userId && dispatch(fetchUserProjects(userId))}
            />
          ) : null}

          {!loading && !error && filteredProjects.length === 0 ? (
            search.trim() ? (
              <EmptyState
                variant="noSearchResults"
                title="No matching projects"
                description="Adjust the project name, address, or council search to return to your register."
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearch("")}
                    aria-label={DASHBOARD_COPY.clearSearchLabel}
                  >
                    {DASHBOARD_COPY.clearSearchLabel}
                  </Button>
                }
              />
            ) : (
              <EmptyState
                variant="noProjects"
                action={
                  userId ? (
                    <CreateProjectDialog
                      userId={userId}
                      onCreated={(projectId) => router.push(`/dashboard/${projectId}`)}
                      triggerLabel={EMPTY_STATE_CONTENT.noProjects.ctaLabel}
                    />
                  ) : null
                }
              />
            )
          ) : null}

          {!loading && !error && filteredProjects.length > 0 ? (
            <>
              <div className="hidden lg:block">
                <ProjectTable projects={filteredProjects} />
              </div>
              <div className="grid gap-3 lg:hidden">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
