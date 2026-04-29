import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  landingHighlights,
  landingPrinciples,
  supportedJurisdictions,
} from "@/lib/content/landing";
import { cn } from "@/lib/utils";

export function LandingPage() {
  const shellClassName = "mx-auto w-full max-w-7xl px-6 lg:px-10";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/88 backdrop-blur-xl supports-backdrop-filter:bg-background/78">
        <div
          className={cn(
            shellClassName,
            "flex min-h-20 items-center justify-between gap-6 py-4",
          )}
        >
          <div className="flex min-w-0 max-w-[44rem] flex-col gap-1">
            <span className="text-[22px] font-bold leading-none tracking-[-0.04em] text-primary">
              construct.da
            </span>
            <span className="text-sm leading-5 text-muted-foreground">
              Advisory pre-lodgement screening for residential approvals
            </span>
          </div>
          <Link
            href="/sign-up"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
          >
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="relative isolate min-h-[calc(100svh-6rem)] overflow-hidden border-b py-12 lg:py-16">
          <Image
            src="/da-approval-hero-v2.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="absolute inset-0 -z-20 size-full object-cover object-[58%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-r from-background via-background/92 to-background/18" />
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-background/82 via-transparent to-background/72" />

          <div
            className={cn(
              shellClassName,
              "flex min-h-[calc(100svh-14rem)] items-center",
            )}
          >
            <div className="flex max-w-3xl flex-col gap-7">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Advisory only</Badge>
                <Badge variant="secondary">Official-source-first</Badge>
                <Badge variant="outline">Residential MVP</Badge>
              </div>

              <div className="max-w-3xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  NSW / Victoria / Queensland MVP
                </p>
                <h1 className="max-w-4xl text-balance text-[38px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[52px] lg:text-[68px]">
                  Pre-lodgement clarity before you lodge.
                </h1>
                <p className="max-w-2xl text-[18px] leading-8 text-muted-foreground sm:text-[20px]">
                  Screen the likely approval path, document gaps, and review triggers
                  before you commit to full lodgement work.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/dashboard"
                  className={cn(buttonVariants({ size: "lg" }), "min-w-52")}
                >
                  Start Approval Check
                </Link>
                <Link
                  href="#how-it-works"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "min-w-52 bg-card/68 backdrop-blur-sm",
                  )}
                >
                  Review the first slice
                </Link>
              </div>

              <div className="flex max-w-2xl flex-wrap gap-2">
                {landingHighlights.map((highlight) => (
                  <Badge key={highlight} variant="secondary">
                    {highlight}
                  </Badge>
                ))}
              </div>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                Advisory only - not formal council or certifier advice. Final
                requirements still depend on the responsible authority, council,
                certifier, and current official ruleset.
              </p>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {supportedJurisdictions.map((jurisdiction) => (
                  <Badge key={jurisdiction} variant="outline">
                    {jurisdiction}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="pb-20 lg:pb-24">
          <div className={cn(shellClassName, "flex flex-col gap-8")}>
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                How the advisory workflow starts
              </p>
              <h2 className="text-[32px] font-bold tracking-[-0.02em] sm:text-[40px]">
                One clear job per section. No dashboard-card clutter.
              </h2>
            </div>

            <Separator />

            <ol className="grid gap-6 lg:grid-cols-3">
              {landingPrinciples.map((principle, index) => (
                <li key={principle.title} className="flex flex-col gap-4 rounded-lg border bg-card/68 p-6 shadow-[0_12px_30px_rgba(61,50,31,0.06)] transition-all duration-200 ease-out hover:-translate-y-px hover:border-primary/25 hover:bg-card">
                  <span className="text-sm font-semibold text-primary">
                    0{index + 1}
                  </span>
                  <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
                    {principle.title}
                  </h3>
                  <p className="max-w-sm leading-7 text-muted-foreground">
                    {principle.description}
                  </p>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">
                  Ready to turn the mockup into a working flow?
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  Start with the intake shell and keep the compliance engine out of scope for
                  this first slice.
                </p>
              </div>
              <Link
                href="/intake"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Continue to intake
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
