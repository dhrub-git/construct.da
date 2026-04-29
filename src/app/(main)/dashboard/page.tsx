import { DashboardPageClient } from "@/components/projects/dashboard-page-client";
import { resolveUserIdByClerkIdentity } from "@/lib/actions/users";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User must be authenticated to view project details.");
  }
  const resolvedUserId = await resolveUserIdByClerkIdentity({
    clerkUserId: userId,
  });
  return <DashboardPageClient userId={resolvedUserId} />;
}
