import type { NotificationItem } from "@data/notifications";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";

type NotificationCardProps = {
  item: NotificationItem;
};

export function NotificationCard({ item }: NotificationCardProps) {
  const Icon = Bell;

  return (
    <Card
      size="sm"
      className={cn(
        "border-white/10 bg-secondary/45",
        item.isUnread && "border-primary/30 bg-primary/6",
      )}
    >
      <CardContent className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-[12px] border",
            item.isUnread
              ? "border-primary/35 bg-primary/12 text-primary"
              : "border-white/10 bg-secondary/80 text-white/64",
          )}
        >
          <Icon data-icon="inline-start" />
        </span>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-white/92">{item.title}</p>
            {item.isUnread ? <Badge variant="default">Unread</Badge> : null}
          </div>
          <p className="text-sm leading-6 text-white/66">{item.message}</p>
          <p className="text-xs text-white/48">{item.timestamp}</p>
        </div>
      </CardContent>
    </Card>
  );
}
