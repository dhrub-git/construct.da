import type { LucideIcon } from "lucide-react";
import { BellIcon, GaugeIcon, SettingsIcon } from "lucide-react";

export type SidebarLink = {
  href: "/dashboard" | "/notifications" | "/settings";
  label: string;
  description: string;
  icon: LucideIcon;
};

export const sidebarLinks: SidebarLink[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Projects and progress",
    icon: GaugeIcon,
  },
  {
    href: "/notifications",
    label: "Notifications",
    description: "Team and workflow updates",
    icon: BellIcon,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Preferences and workspace",
    icon: SettingsIcon,
  },
];
