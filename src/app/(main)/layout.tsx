import { type ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

type MainAppLayoutProps = {
  children: ReactNode;
};

export default function MainAppLayout({ children }: MainAppLayoutProps) {
  return <AppShell>{children}</AppShell>;
}
