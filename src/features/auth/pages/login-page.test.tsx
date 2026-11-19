import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { useAuthStore } from "@/store/auth-store";
import { useUiStore } from "@/store/ui-store";

function renderLogin() {
  return render(
    <MemoryRouter
      initialEntries={["/login"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/app" element={<div>Workspace destination</div>} />
        <Route path="/onboarding" element={<div>Onboarding destination</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, onboardingComplete: false });
    useUiStore.setState({ theme: "light" });
  });

  it("validates credentials before signing in", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /^sign in$/i }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter at least 6 characters.")).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();
  });

  it("opens the populated demo workspace", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /open demo workspace/i }));

    expect(await screen.findByText("Workspace destination")).toBeInTheDocument();
    expect(useAuthStore.getState().session?.email).toBe("maya.chen@northlight.edu");
    expect(useAuthStore.getState().onboardingComplete).toBe(true);
  });

  it("toggles the interface theme", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: /switch to dark mode/i }));

    expect(useUiStore.getState().theme).toBe("dark");
    expect(screen.getByRole("button", { name: /switch to light mode/i })).toBeInTheDocument();
  });
});
