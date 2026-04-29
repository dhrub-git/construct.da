import { DashboardPageClient } from "@/components/projects/dashboard-page-client";
import { resolveUserIdByClerkIdentity } from "@/lib/actions/users";
import { auth, currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User must be authenticated to view project details.");
  }
  const user = await currentUser();
  const resolvedUserId = await resolveUserIdByClerkIdentity({
    clerkUserId: userId,
    email: user?.primaryEmailAddress?.emailAddress,
    name: user?.fullName ?? undefined,
  });
  return <DashboardPageClient userId={resolvedUserId} />;
}
