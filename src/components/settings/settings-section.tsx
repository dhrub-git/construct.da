import { type ReactNode } from "react";

import { SectionHeader } from "@/components/shared/section-header";

type SettingsSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <SectionHeader title={title} description={description} />
      {children}
    </section>
  );
}
