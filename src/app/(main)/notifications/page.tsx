import { BellIcon, CheckCheckIcon } from "lucide-react";

import { notificationGroups } from "@data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function countUnread(): number {
  return notificationGroups.flatMap((group) => group.items).filter((item) => item.isUnread)
    .length;
}

export default function NotificationsPage() {
  const unreadCount = countUnread();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-10 lg:py-10">
      <PageHeader
        title="Notifications"
        description="Stay on top of project activity, processing milestones, and pending actions across your workspace."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1.5">
              <BellIcon data-icon="inline-start" />
              {unreadCount} unread
            </Badge>
            <Button variant="outline" size="sm">
              <CheckCheckIcon data-icon="inline-start" />
              Mark all as read
            </Button>
          </div>
        }
      />

      <NotificationList groups={notificationGroups} />
    </div>
  );
}
