import {
  DevelopmentIdentityProvider,
  type CurrentActor,
} from "./development-provider";
import type { IdentityProvider } from "./types";

/**
 * Single place where the identity implementation is selected.
 *
 * Phase 9 swaps this line for `new ClerkIdentityProvider()`; every feature,
 * API service and permission check keeps working unchanged.
 */
export const identityProvider: IdentityProvider = new DevelopmentIdentityProvider();

/** Resolve the actor used to stamp new records and activity events. */
export async function getCurrentActor(): Promise<CurrentActor> {
  const identity = await identityProvider.getIdentity();
  return {
    userId: identity.user.id,
    workspaceId: identity.workspace.id,
    name: identity.user.name,
    initials: identity.user.initials,
  };
}

export { DEVELOPMENT_IDENTITY_NOTICE } from "./development-provider";
export type { CurrentActor } from "./development-provider";
export {
  assertPermission,
  can,
  permissionsForRole,
  type Identity,
  type IdentityProvider,
  type IdentityUser,
  type IdentityWorkspace,
  type Permission,
  type WorkspaceRole,
} from "./types";
