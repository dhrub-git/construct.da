import Link from "next/link";
import {
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AuthPageShellProps = {
  children: React.ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

type TrustPoint = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const trustPoints: TrustPoint[] = [
  {
    icon: FileSearch,
    title: "Official-source-first checks",
    description: "Start with the pathway, constraints, and likely evidence gaps.",
  },
  {
    icon: ClipboardCheck,
    title: "Guided pre-lodgement intake",
    description: "Collect the minimum project context before deeper review work.",
  },
  {
    icon: ShieldCheck,
    title: "Advisory only",
    description: "Keep decisions clear while formal authority advice remains separate.",
  },
];

export function AuthPageShell({
  children,
  description,
  eyebrow,
  title,
}: AuthPageShellProps) {
  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgb(30_58_138_/_0.14),transparent_32rem),linear-gradient(180deg,var(--background),var(--secondary))]" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgb(15_23_42_/_0.035)_1px,transparent_1px),linear-gradient(90deg,rgb(15_23_42_/_0.035)_1px,transparent_1px)] bg-[size:28px_28px]" />

      <div className="mx-auto grid min-h-svh w-full max-w-7xl gap-10 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:grid-rows-[auto_auto] lg:items-center lg:px-10">
        <section className="flex min-w-0 flex-col gap-8 lg:col-start-1 lg:row-start-1 lg:max-w-2xl lg:self-end">
          <Link
            href="/"
            aria-label="construct.da home"
            className={cn(
              "inline-flex min-h-11 w-fit items-center gap-3 rounded-full border bg-card/82 px-3 py-2 text-primary shadow-[0_10px_30px_rgb(15_23_42_/_0.06)] backdrop-blur-sm",
              "transition-colors duration-200 hover:border-primary/30 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-bold tracking-[-0.05em] text-primary-foreground">
              da
            </span>
            <span className="text-[22px] font-bold leading-none tracking-[-0.04em]">
              construct.da
            </span>
          </Link>

          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Residential MVP</Badge>
              <Badge variant="secondary">Pre-lodgement clarity</Badge>
            </div>

            <div className="max-w-2xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="text-balance text-[40px] font-bold leading-[1.02] tracking-[-0.04em] sm:text-[56px]">
                {title}
              </h1>
              <p className="max-w-xl text-[18px] leading-8 text-muted-foreground sm:text-[20px]">
                {description}
              </p>
            </div>
          </div>

        </section>

        <section
          aria-label="Account access form"
          className="w-full rounded-[2rem] border bg-card/74 p-2 shadow-[0_24px_70px_rgb(15_23_42_/_0.14)] backdrop-blur-xl lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
        >
          <div className="rounded-[1.5rem] bg-card/92 p-1">{children}</div>
        </section>

        <dl className="grid gap-3 sm:grid-cols-3 lg:col-start-1 lg:row-start-2 lg:grid-cols-1 lg:self-start">
          {trustPoints.map((point) => (
            <div
              key={point.title}
              className="flex gap-3 rounded-2xl border bg-card/72 p-4 shadow-[0_12px_32px_rgb(15_23_42_/_0.055)] backdrop-blur-sm"
            >
              <dt className="mt-0.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <point.icon aria-hidden="true" className="size-4" />
                </span>
              </dt>
              <dd className="min-w-0 space-y-1">
                <p className="font-semibold leading-6 text-foreground">
                  {point.title}
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  {point.description}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
