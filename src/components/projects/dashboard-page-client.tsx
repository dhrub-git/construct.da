"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "lucide-react";
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

const DASHBOARD_COPY = {
  heading: "Projects dashboard",
  description: "Track project readiness, upload documents, and continue processing.",
  sectionTitle: "All projects",
  sectionDescription: "Search by project name, address, or council.",
  searchPlaceholder: "Search projects",
  clearSearchLabel: "Clear search",
} as const;

interface DashboardPageClientProps {
  userId: string;
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-bold tracking-[-0.02em]">{DASHBOARD_COPY.heading}</h1>
          <p className="text-sm text-muted-foreground">
            {DASHBOARD_COPY.description}
          </p>
        </div>
        {userId ? (
          <CreateProjectDialog userId={userId} onCreated={(projectId) => router.push(`/dashboard/${projectId}`)} />
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{DASHBOARD_COPY.sectionTitle}</CardTitle>
          <CardDescription>{DASHBOARD_COPY.sectionDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-lg">
            <SearchIcon className="pointer-events-none absolute top-3.5 left-3.5 text-muted-foreground" data-icon="inline-start" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-11"
              placeholder={DASHBOARD_COPY.searchPlaceholder}
              aria-label={DASHBOARD_COPY.searchPlaceholder}
            />
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
