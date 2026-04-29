import { SignUp } from "@clerk/nextjs";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { authClerkAppearance } from "@/lib/auth/clerk-appearance";

export default async function SignUpPage() {
  return (
    <AuthPageShell
      eyebrow="Approval preparation workspace"
      title="Create your construct.da workspace"
      description="Set up a focused account for advisory pre-lodgement screening, document readiness, and evidence-backed approval pathway review."
    >
      <SignUp
        appearance={authClerkAppearance}
        signInUrl="/sign-in"
        forceRedirectUrl="/dashboard"
      />
    </AuthPageShell>
  );
}
