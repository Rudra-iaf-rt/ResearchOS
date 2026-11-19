import { readDb } from "@/services/mock/client";
import {
  permissionsForRole,
  type Identity,
  type IdentityProvider,
} from "./types";

/**
 * DEVELOPMENT-ONLY identity provider.
 *
 * It resolves the demo profile and workspace from the local mock database so
 * every feature can rely on a single principal without hardcoded user IDs.
 * Replace this with `ClerkIdentityProvider` in Phase 9. Never deploy the
 * unauthenticated application publicly.
 */
export class DevelopmentIdentityProvider implements IdentityProvider {
  readonly kind = "development" as const;

  async getIdentity(): Promise<Identity> {
    return readDb((db) => ({
      user: {
        id: db.user.id,
        name: db.user.name,
        email: db.user.email,
        initials: db.user.initials,
        role: db.user.role,
        institution: db.user.institution,
        avatarColor: db.user.avatarColor,
      },
      workspace: {
        id: db.workspace.id,
        name: db.workspace.name,
        slug: db.workspace.slug,
      },
      // The development user owns the demo workspace.
      role: "owner" as const,
      permissions: permissionsForRole("owner"),
      provider: this.kind,
    }));
  }
}

export interface CurrentActor {
  userId: string;
  workspaceId: string;
  name: string;
  initials: string;
}

export const DEVELOPMENT_IDENTITY_NOTICE =
  "Development identity: the workspace owner is simulated until authentication ships in Phase 9.";
