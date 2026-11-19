import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { identityProvider } from "./index";
import type { Permission } from "./types";

/**
 * Read the current principal from the configured identity provider.
 * Feature code should use this hook instead of reading the demo user directly.
 */
export function useIdentity() {
  return useQuery({
    queryKey: queryKeys.identity,
    queryFn: () => identityProvider.getIdentity(),
    staleTime: 60_000,
  });
}

export function usePermissions() {
  const { data, isLoading } = useIdentity();
  return {
    identity: data,
    role: data?.role ?? "viewer",
    isLoading,
    can: (permission: Permission) => Boolean(data?.permissions.includes(permission)),
  };
}
