import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const clerkMocks = vi.hoisted(() => ({
  signUp: vi.fn((props: Record<string, unknown>) => (
    <div data-testid="clerk-sign-up" data-sign-in-url={String(props.signInUrl)}>
      Clerk sign-up form
    </div>
  )),
}));

vi.mock("@clerk/nextjs", () => ({
  SignUp: clerkMocks.signUp,
}));

import SignUpPage from "@/app/(auth)/sign-up/[[...sign-up]]/page";

describe("SignUpPage", () => {
  it("presents a high-trust sign-up shell around the Clerk form", async () => {
    render(await SignUpPage());

    expect(
      screen.getByRole("link", { name: /construct\.da home/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("heading", { name: /create your construct\.da workspace/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/official-source-first checks/i)).toBeInTheDocument();
    expect(screen.getByText(/advisory only/i)).toBeInTheDocument();
    expect(screen.getByTestId("clerk-sign-up")).toHaveAttribute(
      "data-sign-in-url",
      "/sign-in",
    );
  });

  it("configures Clerk controls for accessible contrast and touch target sizing", async () => {
    render(await SignUpPage());

    const props = clerkMocks.signUp.mock.calls.at(-1)?.[0] as {
      appearance?: { elements?: Record<string, string> };
      forceRedirectUrl?: string;
    };

    expect(props.forceRedirectUrl).toBe("/dashboard");
    expect(props.appearance?.elements?.formButtonPrimary).toContain("!min-h-11");
    expect(props.appearance?.elements?.socialButtonsBlockButton).toContain("!min-h-11");
    expect(props.appearance?.elements?.formFieldInput).toContain("!text-base");
  });
});
