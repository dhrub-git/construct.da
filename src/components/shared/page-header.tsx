import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        <h1 className="text-[32px] font-bold tracking-[-0.02em] text-white">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
