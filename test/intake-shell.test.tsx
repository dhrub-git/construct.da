import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { IntakeShell } from "@/components/intake/intake-shell";

describe("IntakeShell", () => {
  it("keeps the advisory disclaimer visible and moves between steps", async () => {
    const user = userEvent.setup();

    render(<IntakeShell />);

    expect(
      screen.getByText(/advisory only - we flag likely gaps before formal lodgement/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /back/i })).toBeDisabled();

    expect(
      screen.getByRole("heading", { name: /project details/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next step/i }));

    expect(
      screen.getByRole("heading", { name: /property context/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next step/i }));
    await user.click(screen.getByRole("button", { name: /next step/i }));

    expect(
      screen.getByRole("heading", { name: /document readiness/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back/i }));

    expect(
      screen.getByRole("heading", { name: /scope notes/i }),
    ).toBeInTheDocument();

    expect(screen.getAllByText(/project details/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/property context/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/scope notes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/document readiness/i).length).toBeGreaterThan(0);
  });
});
