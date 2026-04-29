"use client";

import { useMemo, useState } from "react";

import type { NotificationGroup } from "@data/notifications";
import { NotificationCard } from "@/components/notifications/notification-card";
import { NotificationEmpty } from "@/components/notifications/notification-empty";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type NotificationListProps = {
  groups: NotificationGroup[];
};

type NotificationFilter = "all" | "unread";

export function NotificationList({ groups }: NotificationListProps) {
  const [filter, setFilter] = useState<NotificationFilter>("all");

  const filteredGroups = useMemo(() => {
    if (filter === "all") {
      return groups;
    }

    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.isUnread),
      }))
      .filter((group) => group.items.length > 0);
  }, [filter, groups]);

  const hasItems = filteredGroups.some((group) => group.items.length > 0);

  return (
    <Tabs value={filter} onValueChange={(next) => setFilter(next as NotificationFilter)}>
      <TabsList className="w-fit">
        <TabsTrigger value="all">All</TabsTrigger>
        <TabsTrigger value="unread">Unread</TabsTrigger>
      </TabsList>

      <TabsContent value={filter} className="mt-4 flex flex-col gap-6">
        {hasItems ? (
          filteredGroups.map((group) => (
            <section key={group.id} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-white/56">
                {group.label}
              </h3>
              <div className="grid gap-3">
                {group.items.map((item) => (
                  <NotificationCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        ) : (
          <NotificationEmpty />
        )}
      </TabsContent>
    </Tabs>
  );
}
