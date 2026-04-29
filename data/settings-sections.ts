export type SettingsProfileItem = {
  label: string;
  value: string;
  helperText: string;
};

export type SettingsSecurityAction = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
};

export type WorkspaceStat = {
  label: string;
  value: string;
  detail: string;
};

export type PreferenceToggleItem = {
  id: "dark-mode" | "email-notifications" | "push-notifications";
  title: string;
  description: string;
  enabled: boolean;
};

export const profileItems: SettingsProfileItem[] = [
  {
    label: "Name",
    value: "Dhrub Biswas",
    helperText: "Primary account owner",
  },
  {
    label: "Email",
    value: "dhrubjyoti.biswas@gmail.com",
    helperText: "Used for sign-in and account notices",
  },
  {
    label: "Role",
    value: "Operations Lead",
    helperText: "Approval workflows and final review",
  },
];

export const preferenceItems: PreferenceToggleItem[] = [
  {
    id: "dark-mode",
    title: "Dark Mode",
    description: "Use the dark workspace theme optimized for long review sessions.",
    enabled: true,
  },
  {
    id: "email-notifications",
    title: "Email Notifications",
    description: "Receive advisory milestones and project stage updates by email.",
    enabled: true,
  },
  {
    id: "push-notifications",
    title: "Push Notifications",
    description: "Enable desktop push alerts for urgent pending actions.",
    enabled: false,
  },
];

export const securityActions: SettingsSecurityAction[] = [
  {
    id: "change-password",
    title: "Password",
    description: "Change your password to keep your account secure.",
    ctaLabel: "Change Password",
  },
  {
    id: "sessions",
    title: "Active Sessions",
    description: "Review devices currently signed in to this workspace.",
    ctaLabel: "View Sessions",
  },
];

export const workspaceStats: WorkspaceStat[] = [
  {
    label: "Plan",
    value: "Growth",
    detail: "Includes unlimited advisory projects and role-based access.",
  },
  {
    label: "Region",
    value: "Sydney, AU",
    detail: "Data residency pinned to Australia East.",
  },
  {
    label: "Usage",
    value: "68%",
    detail: "4.1 GB of 6 GB monthly processing allocation used.",
  },
];
