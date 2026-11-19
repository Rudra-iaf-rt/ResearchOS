import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRouter } from "@/app/router";
import { useAuthStore } from "@/store/auth-store";

function renderAt(path: string) {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AppRouter />
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, onboardingComplete: false });
  });

  it("redirects signed-out visitors from the workspace to login", async () => {
    renderAt("/app/projects");

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  });

  it("renders a not-found page for unknown routes", async () => {
    renderAt("/missing-page");

    expect(
      await screen.findByRole("heading", { name: "This page is outside the notebook." }),
    ).toBeInTheDocument();
  });
});
