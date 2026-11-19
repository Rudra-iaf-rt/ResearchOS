/**
 * Centralized identity contract.
 *
 * Phase 1 ships a development-only provider. Phase 9 will add
 * `ClerkIdentityProvider` implementing this same interface, so feature code
 * never needs to know how the current principal was authenticated.
 */

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "editor"
  | "commenter"
  | "viewer";

export type Permission =
  | "artifact:read"
  | "artifact:write"
  | "artifact:delete"
  | "log:write"
  | "review:submit"
  | "member:manage"
  | "workspace:manage"
  | "integration:manage"
  | "data:export";

export interface IdentityUser {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: string;
  institution: string;
  avatarColor: string;
}

export interface IdentityWorkspace {
  id: string;
  name: string;
  slug: string;
}

export interface Identity {
  user: IdentityUser;
  workspace: IdentityWorkspace;
  role: WorkspaceRole;
  permissions: Permission[];
  /** Which provider produced this identity. */
  provider: "development" | "clerk";
}

export interface IdentityProvider {
  readonly kind: Identity["provider"];
  getIdentity(): Promise<Identity>;
}

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [
    "artifact:read",
    "artifact:write",
    "artifact:delete",
    "log:write",
    "review:submit",
    "member:manage",
    "workspace:manage",
    "integration:manage",
    "data:export",
  ],
  admin: [
    "artifact:read",
    "artifact:write",
    "artifact:delete",
    "log:write",
    "review:submit",
    "member:manage",
    "workspace:manage",
    "integration:manage",
    "data:export",
  ],
  editor: [
    "artifact:read",
    "artifact:write",
    "artifact:delete",
    "log:write",
    "review:submit",
    "data:export",
  ],
  commenter: ["artifact:read", "log:write", "review:submit"],
  viewer: ["artifact:read"],
};

export function permissionsForRole(role: WorkspaceRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

export function can(
  identity: Pick<Identity, "permissions"> | null | undefined,
  permission: Permission,
): boolean {
  return Boolean(identity?.permissions.includes(permission));
}

export function assertPermission(
  identity: Pick<Identity, "permissions"> | null | undefined,
  permission: Permission,
) {
  if (!can(identity, permission)) {
    throw new Error(`Missing permission: ${permission}`);
  }
}
