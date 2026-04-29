import { SignUp } from "@clerk/nextjs";
import Link from "next/link";


export default async function SignUpPage() {

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary-900 via-primary-800 to-primary-900">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <span className="text-3xl font-bold text-white">construct.da</span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-primary-200">Start your development application journey</p>
        </div>
        
        <SignUp 
          appearance={{
            baseTheme: undefined,
            elements: {
              rootBox: "w-full",
              card: "bg-white rounded-2xl shadow-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              socialButtonsBlockButton: "w-full border border-neutral-300 hover:bg-neutral-50 rounded-lg py-3",
              socialButtonsBlockButtonText: "text-neutral-700 font-medium",
              dividerLine: "bg-neutral-200",
              dividerText: "text-neutral-500",
              formFieldInput: "border border-neutral-300 rounded-lg px-4 py-3 focus:border-primary-500 focus:ring-2 focus:ring-primary-500",
              formButtonPrimary: "bg-primary-600 hover:bg-primary-700 w-full rounded-lg py-3 text-base font-medium",
              footerActionLink: "text-primary-600 hover:text-primary-700 font-medium",
            },
          }}
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
