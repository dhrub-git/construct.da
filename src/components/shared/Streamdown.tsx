"use client";

import { Streamdown as StreamdownRenderer } from "streamdown";

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StreamdownProps = {
  markdown: string | null | undefined;
  loading?: boolean;
  className?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

function StreamdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-7 w-72 max-w-full" />
        </CardTitle>
        <CardDescription>
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
        <Skeleton className="h-40 w-full rounded-[16px]" />
      </CardContent>
    </Card>
  );
}

export function Streamdown({
  markdown,
  loading = false,
  className,
  emptyTitle = "No report available",
  emptyDescription = "Run processing to generate the latest compliance report for this project.",
}: StreamdownProps) {
  if (loading) {
    return <StreamdownSkeleton />;
  }

  if (!markdown) {
    return (
      <Empty className={cn("border border-border bg-secondary/40", className)}>
        <EmptyHeader>
          <EmptyMedia variant="icon" aria-hidden>
            <span className="text-lg font-semibold">R</span>
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className={cn("w-full max-w-5xl", className)}>
      <StreamdownRenderer
        mode="static"
        animated={false}
        className="w-full max-w-none text-sm text-foreground"
      >
        {markdown}
      </StreamdownRenderer>
    </div>
  );
}