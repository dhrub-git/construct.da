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
      <header className="sticky top-0 z-20 border-b border-white/6 bg-background/85 backdrop-blur-xl supports-backdrop-filter:bg-background/75">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-white/56">
              construct.da
            </span>
            <span className="text-sm text-white/72">
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
        <section className="px-6 py-12 lg:px-10 lg:py-16">
          <div className="mx-auto grid w-full max-w-7xl gap-10 lg:min-h-[calc(100svh-8rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(22rem,32rem)] lg:items-center">
            <div className="flex flex-col gap-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Advisory only</Badge>
                <Badge variant="secondary">Official-source-first</Badge>
                <Badge variant="outline">Residential MVP</Badge>
              </div>

              <div className="max-w-3xl space-y-6">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/56">
                  NSW / Victoria / Queensland MVP
                </p>
                <h1 className="max-w-4xl text-balance text-[32px] font-bold leading-[1.02] tracking-[-0.03em] sm:text-[42px] lg:text-[56px]">
                  Pre-lodgement clarity before you lodge.
                </h1>
                <p className="max-w-2xl text-[18px] leading-8 text-white/72">
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

              <div className="max-w-2xl space-y-4 rounded-[18px] border border-white/10 bg-secondary/55 px-6 py-5 shadow-[0_18px_40px_rgba(1,6,20,0.28)]">
                <p className="text-sm font-semibold text-foreground">
                  Advisory only - not formal council or certifier advice.
                </p>
                <p className="text-sm leading-7 text-white/72">
                  This MVP highlights likely issues, missing evidence, and escalation
                  triggers. Final requirements still depend on the responsible authority,
                  council, certifier, and the current official ruleset.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-white/60">
                {supportedJurisdictions.map((jurisdiction) => (
                  <Badge key={jurisdiction} variant="outline">
                    {jurisdiction}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-secondary shadow-[0_26px_56px_rgba(2,7,19,0.4)]">
              <div className="absolute inset-0 bg-linear-to-tr from-background via-background/10 to-transparent" />
              <Image
                src="/shero-image.webp"
                alt="Residential approval plans on a desk"
                width={900}
                height={1100}
                priority
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 space-y-4 bg-linear-to-t from-background via-background/88 to-transparent px-6 pb-6 pt-24 sm:px-8 sm:pb-8">
                <div className="flex flex-wrap gap-2">
                  {landingHighlights.map((highlight) => (
                    <Badge key={highlight} variant="secondary">
                      {highlight}
                    </Badge>
                  ))}
                </div>
                <div className="max-w-md space-y-2">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
                    First slice outcome
                  </p>
                  <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-foreground">
                    Landing page, intake shell, and test-backed navigation baseline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-6 pb-20 lg:px-10 lg:pb-24">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
            <div className="max-w-3xl space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/56">
                How the advisory workflow starts
              </p>
              <h2 className="text-[32px] font-bold tracking-[-0.02em] sm:text-[40px]">
                One clear job per section. No dashboard-card clutter.
              </h2>
            </div>

            <Separator />

            <ol className="grid gap-6 lg:grid-cols-3">
              {landingPrinciples.map((principle, index) => (
                <li key={principle.title} className="flex flex-col gap-4 rounded-[18px] border border-white/8 bg-secondary/45 p-6 transition-all duration-200 ease-out hover:-translate-y-px hover:border-white/16 hover:bg-secondary/60">
                  <span className="text-sm font-semibold text-white/56">
                    0{index + 1}
                  </span>
                  <h3 className="text-[28px] font-semibold leading-tight tracking-[-0.02em]">
                    {principle.title}
                  </h3>
                  <p className="max-w-sm leading-7 text-white/72">
                    {principle.description}
                  </p>
                </li>
              ))}
            </ol>

            <div className="flex flex-col gap-4 border-t border-white/8 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <p className="text-[22px] font-semibold leading-tight tracking-[-0.02em]">
                  Ready to turn the mockup into a working flow?
                </p>
                <p className="text-sm leading-7 text-white/72">
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
