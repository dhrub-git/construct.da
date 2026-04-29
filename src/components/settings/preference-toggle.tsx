"use client";

import { useState } from "react";

import type { PreferenceToggleItem } from "@data/settings-sections";
import { Switch } from "@/components/ui/switch";

type PreferenceToggleProps = {
  item: PreferenceToggleItem;
};

export function PreferenceToggle({ item }: PreferenceToggleProps) {
  const [enabled, setEnabled] = useState(item.enabled);

  return (
    <div className="flex items-start justify-between gap-4 rounded-[14px] border border-border bg-secondary/45 px-4 py-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{item.title}</p>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        aria-label={`Toggle ${item.title}`}
      />
    </div>
  );
}
