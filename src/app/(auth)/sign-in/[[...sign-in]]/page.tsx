import { SignIn } from "@clerk/nextjs";

import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { authClerkAppearance } from "@/lib/auth/clerk-appearance";

export default async function SignInPage() {
  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title="Return to your approval workspace"
      description="Continue reviewing project readiness, likely consent pathways, and document gaps from your dashboard."
    >
      <SignIn appearance={authClerkAppearance} signUpUrl="/sign-up" />
    </AuthPageShell>
  );
}
