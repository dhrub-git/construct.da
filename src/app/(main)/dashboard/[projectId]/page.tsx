import { ProjectDetailsPageClient } from "@/components/projects/project-details-page-client";
import { resolveUserIdByClerkIdentity } from "@/lib/actions/users";
import { auth, currentUser } from "@clerk/nextjs/server";

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const { userId } = await auth();
  if(!userId) {
    throw new Error("User must be authenticated to view project details.");
  }
  const user = await currentUser();
  const resolvedUserId = await resolveUserIdByClerkIdentity({
    clerkUserId: userId,
    email: user?.primaryEmailAddress?.emailAddress,
    name: user?.fullName ?? undefined,
  });

  return <ProjectDetailsPageClient projectId={projectId} userId={resolvedUserId} />;
}
