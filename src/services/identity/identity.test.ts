import { beforeEach, describe, expect, it } from "vitest";
import {
  assertPermission,
  can,
  getCurrentActor,
  identityProvider,
  permissionsForRole,
} from "@/services/identity";
import { DEMO_DB_KEY } from "@/services/mock/storage";

describe("development identity provider", () => {
  beforeEach(() => {
    window.localStorage.removeItem(DEMO_DB_KEY);
  });

  it("resolves the single development principal and workspace", async () => {
    const identity = await identityProvider.getIdentity();

    expect(identity.provider).toBe("development");
    expect(identity.user.id).toBe("user_maya");
    expect(identity.workspace.id).toBe("ws_northlight");
    expect(identity.role).toBe("owner");
    expect(identity.permissions).toContain("log:write");
    expect(identity.permissions).toContain("member:manage");
  });

  it("stamps the current actor from the centralized provider", async () => {
    const actor = await getCurrentActor();
    expect(actor).toMatchObject({
      userId: "user_maya",
      workspaceId: "ws_northlight",
      name: expect.any(String),
      initials: expect.any(String),
    });
  });

  it("maps roles to the expected permission sets", () => {
    expect(permissionsForRole("viewer")).toEqual(["artifact:read"]);
    expect(permissionsForRole("commenter")).toEqual(
      expect.arrayContaining(["artifact:read", "log:write", "review:submit"]),
    );
    expect(permissionsForRole("commenter")).not.toContain("artifact:delete");
    expect(permissionsForRole("editor")).toContain("artifact:delete");
    expect(permissionsForRole("owner")).toContain("member:manage");
  });

  it("checks and asserts permissions", () => {
    const owner = { permissions: permissionsForRole("owner") };
    const viewer = { permissions: permissionsForRole("viewer") };

    expect(can(owner, "artifact:write")).toBe(true);
    expect(can(viewer, "artifact:write")).toBe(false);
    expect(can(null, "artifact:read")).toBe(false);

    expect(() => assertPermission(owner, "data:export")).not.toThrow();
    expect(() => assertPermission(viewer, "data:export")).toThrow(
      /Missing permission/,
    );
  });
});
