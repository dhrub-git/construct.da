export type NotificationType =
  | "project"
  | "file"
  | "milestone"
  | "payment"
  | "reminder";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isUnread: boolean;
  type: NotificationType;
};

export type NotificationGroup = {
  id: string;
  label: string;
  items: NotificationItem[];
};

export const notificationGroups: NotificationGroup[] = [
  {
    id: "today",
    label: "Today",
    items: [
      {
        id: "n-1",
        title: "New project created",
        message: "Bondi Rear Extension has been created and is ready for intake review.",
        timestamp: "5 min ago",
        isUnread: true,
        type: "project",
      },
      {
        id: "n-2",
        title: "File uploaded successfully",
        message: "A Site Plan PDF was uploaded to Newcastle Secondary Dwelling.",
        timestamp: "18 min ago",
        isUnread: true,
        type: "file",
      },
      {
        id: "n-3",
        title: "Milestone approved",
        message: "Pre-lodgement evidence pack has been approved by your reviewer.",
        timestamp: "42 min ago",
        isUnread: false,
        type: "milestone",
      },
    ],
  },
  {
    id: "yesterday",
    label: "Yesterday",
    items: [
      {
        id: "n-4",
        title: "Payment received",
        message: "Invoice INV-2038 has been paid and the project is now unlocked.",
        timestamp: "Yesterday at 4:18 PM",
        isUnread: false,
        type: "payment",
      },
      {
        id: "n-5",
        title: "Reminder pending action",
        message: "Project Wollongong DA Check is waiting for consultant report upload.",
        timestamp: "Yesterday at 9:03 AM",
        isUnread: false,
        type: "reminder",
      },
    ],
  },
];
