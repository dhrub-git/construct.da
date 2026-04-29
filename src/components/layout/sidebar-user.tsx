"use client";

import { UserButton, useUser } from "@clerk/nextjs";

export function SidebarUser() {
  const { user, isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return (
      <div className="rounded-[14px] border border-border bg-secondary/70 p-3">
        <div className="mb-3 flex items-start gap-3 animate-pulse">
          <div className="size-10 rounded-full bg-secondary" />
          <div className="min-w-0 flex-1">
            <div className="mb-2 h-4 w-32 rounded bg-secondary" />
            <div className="h-3 w-44 rounded bg-secondary" />
          </div>
        </div>
        <div className="h-3 w-56 rounded bg-secondary animate-pulse" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-[14px] border border-border bg-secondary/70 p-3">
        <p className="text-sm font-semibold text-foreground">Sign in</p>
      </div>
    );
  }

  return (
    <div className="rounded-[14px] border border-border bg-secondary/70 p-3">
      <div className="mb-3 flex items-start gap-3">
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-10",
            },
          }}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.fullName ?? "Workspace User"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {user?.primaryEmailAddress?.emailAddress ?? "Signed in"}
          </p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Manage your account from the menu.
      </p>
    </div>
  );
}
