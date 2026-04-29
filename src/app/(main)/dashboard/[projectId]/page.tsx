import { ProjectDetailsPageClient } from "@/components/projects/project-details-page-client";
import { resolveUserIdByClerkIdentity } from "@/lib/actions/users";
import { auth } from "@clerk/nextjs/server";

type ProjectDetailsPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { projectId } = await params;
  const { userId } = await auth();
  if(!userId) {
    throw new Error("User must be authenticated to view project details.");
  }
  const resolvedUserId = await resolveUserIdByClerkIdentity({ clerkUserId: userId });

  return <ProjectDetailsPageClient projectId={projectId} userId={resolvedUserId} />;
}
