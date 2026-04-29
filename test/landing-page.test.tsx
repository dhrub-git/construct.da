import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LandingPage } from "@/components/marketing/landing-page";

describe("LandingPage", () => {
  it("renders the advisory-first hero with a CTA into intake", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", {
        name: /pre-lodgement clarity before you lodge/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /start approval check/i }),
    ).toHaveAttribute("href", "/dashboard");

    expect(
      screen.getByText(/advisory only - not formal council or certifier advice/i),
    ).toBeInTheDocument();

    expect(screen.getByText(/^New South Wales$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Victoria$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Queensland$/i)).toBeInTheDocument();

    const workflowSection = screen.getByRole("heading", {
      name: /one clear job per section\. no dashboard-card clutter/i,
    });
    expect(within(workflowSection.closest("section")!).getByText(/map the likely approval path/i)).toBeInTheDocument();
  });
});
