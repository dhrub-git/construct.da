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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/88 backdrop-blur-xl supports-backdrop-filter:bg-background/78">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              construct.da
            </span>
            <span className="text-sm text-muted-foreground">
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
        <section className="px-6 py-10 lg:px-10 lg:py-14">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:min-h-[calc(100svh-7rem)] lg:grid-cols-[minmax(0,0.78fr)_minmax(34rem,1.22fr)] lg:items-center">
            <div className="flex flex-col gap-7">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Advisory only</Badge>
                <Badge variant="secondary">Official-source-first</Badge>
                <Badge variant="outline">Residential MVP</Badge>
              </div>

              <div className="max-w-3xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  NSW / Victoria / Queensland MVP
                </p>
                <h1 className="max-w-4xl text-balance text-[34px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[44px] lg:text-[60px]">
                  Pre-lodgement clarity before you lodge.
                </h1>
                <p className="max-w-2xl text-[18px] leading-8 text-muted-foreground">
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
                    "min-w-52",
                  )}
                >
                  Review the first slice
                </Link>
              </div>

              <div className="max-w-2xl space-y-4 rounded-lg border bg-card/72 px-6 py-5 shadow-[0_18px_40px_rgba(61,50,31,0.08)]">
                <p className="text-sm font-semibold text-foreground">
                  Advisory only - not formal council or certifier advice.
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  This MVP highlights likely issues, missing evidence, and escalation
                  triggers. Final requirements still depend on the responsible authority,
                  council, certifier, and the current official ruleset.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {supportedJurisdictions.map((jurisdiction) => (
                  <Badge key={jurisdiction} variant="outline">
                    {jurisdiction}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border bg-card shadow-[0_26px_56px_rgba(61,50,31,0.13)]">
              <Image
                src="/da-approval-hero-v2.png"
                alt="Development approval workspace with plans, zoning overlays, evidence cards, and advisory review checklist"
                width={1768}
                height={890}
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="h-full min-h-[360px] w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 space-y-4 bg-linear-to-t from-card via-card/88 to-transparent px-6 pb-6 pt-24 sm:px-8 sm:pb-8">
                <div className="flex flex-wrap gap-2">
                  {landingHighlights.map((highlight) => (
                    <Badge key={highlight} variant="secondary">
                      {highlight}
                    </Badge>
                  ))}
                </div>
                <div className="max-w-md space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Advisory review workspace
                  </p>
                  <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
                    Plans, evidence, and review triggers arranged before lodgement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 pb-20 lg:px-10 lg:pb-24">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
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
