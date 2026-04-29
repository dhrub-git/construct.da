"use client";

import Link from "next/link";

import { sidebarLinks } from "@data/sidebar-links";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarUser } from "@/components/layout/sidebar-user";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  className?: string;
  onNavigate?: () => void;
};

export function AppSidebar({ className, onNavigate }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full min-h-0 flex-col border-r border-white/8 bg-secondary/45 px-4 py-5 backdrop-blur-xl",
        className,
      )}
    >
      <Link
        href="/dashboard"
        className="rounded-[14px] border border-white/10 bg-secondary/75 px-4 py-4 transition-all duration-200 ease-out hover:border-white/16 hover:bg-secondary"
        onClick={onNavigate}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/52">construct.da</p>
        <p className="text-lg font-semibold tracking-[-0.02em] text-white">Approvals Workspace</p>
      </Link>

      <Separator className="my-4" />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <SidebarNav links={sidebarLinks} onNavigate={onNavigate} />
      </div>

      <Separator className="my-4" />

      <SidebarUser />
    </aside>
  );
}
