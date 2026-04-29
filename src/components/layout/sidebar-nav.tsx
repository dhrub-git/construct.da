"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { SidebarLink } from "@data/sidebar-links";
import { cn } from "@/lib/utils";

type SidebarNavProps = {
  links: SidebarLink[];
  onNavigate?: () => void;
};

function isActiveRoute(pathname: string, href: SidebarLink["href"]): boolean {
  if (href === "/dashboard") {
    return pathname === href || pathname.startsWith("/dashboard/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ links, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-2">
      {links.map((link) => {
        const active = isActiveRoute(pathname, link.href);
        const Icon = link.icon;

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-[14px] border px-3 py-3 transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45",
              active
                ? "border-primary/40 bg-primary/12 text-primary shadow-[0_8px_20px_rgba(46,230,214,0.16)]"
                : "border-transparent text-muted-foreground hover:-translate-y-px hover:border-border hover:bg-secondary hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-[12px] border transition-colors",
                active
                  ? "border-primary/30 bg-primary/12 text-primary"
                  : "border-border bg-secondary/70 text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon data-icon="inline-start" />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-semibold tracking-[-0.01em]">{link.label}</span>
              <span className="truncate text-xs text-muted-foreground">{link.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
