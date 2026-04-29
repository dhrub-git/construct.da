import { ShieldCheckIcon } from "lucide-react";

import {
  preferenceItems,
  profileItems,
  securityActions,
  workspaceStats,
} from "@data/settings-sections";
import { PreferenceToggle } from "@/components/settings/preference-toggle";
import { SettingsCard } from "@/components/settings/settings-card";
import { SettingsSection } from "@/components/settings/settings-section";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 lg:px-10 lg:py-10 max-h-screen overflow-y-auto">
      <PageHeader
        title="Settings"
        description="Manage profile details, workspace defaults, notification preferences, and account security in one place."
        actions={
          <Badge variant="outline" className="gap-1.5">
            <ShieldCheckIcon data-icon="inline-start" />
            Secure workspace
          </Badge>
        }
      />

      <SettingsSection
        title="Profile"
        description="Read-only account profile details used across the approvals workspace."
      >
        <SettingsCard
          title="Identity"
          description="These values are synced from your account and workspace membership."
        >
          {profileItems.map((item, index) => (
            <div key={item.label} className="flex flex-col gap-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <p className="text-sm font-semibold text-white/88">{item.label}</p>
                <p className="text-sm text-white">{item.value}</p>
              </div>
              <p className="text-xs text-white/56">{item.helperText}</p>
              {index < profileItems.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Preferences"
        description="Configure workspace behavior and personal notification defaults."
      >
        <SettingsCard
          title="Workspace Preferences"
          description="These controls are static in this slice and model future persisted preferences."
        >
          {preferenceItems.map((item) => (
            <PreferenceToggle key={item.id} item={item} />
          ))}
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Security"
        description="Review account access options and strengthen your sign-in posture."
      >
        <SettingsCard
          title="Account Security"
          description="Use these actions to manage password and active sessions."
        >
          {securityActions.map((action, index) => (
            <div key={action.id} className="flex flex-col gap-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white/88">{action.title}</p>
                  <p className="text-sm text-white/62">{action.description}</p>
                </div>
                <Button variant="outline" size="sm">
                  {action.ctaLabel}
                </Button>
              </div>
              {index < securityActions.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </SettingsCard>
      </SettingsSection>

      <SettingsSection
        title="Workspace"
        description="Current subscription and environment settings for this account."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {workspaceStats.map((item) => (
            <SettingsCard key={item.label} title={item.label} description={item.detail}>
              <p className="text-3xl font-semibold tracking-[-0.02em] text-white">{item.value}</p>
            </SettingsCard>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
