import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

const FOCUS_PARAM = "focus";

export interface GraphFocusState {
  /** Valid focus id from `?focus=`, or null. */
  focusId: string | null;
  /** The param value when it does not match a visible node. */
  invalidFocusId: string | null;
  /** Select a node and push a URL entry that back/forward can restore. */
  setFocus: (id: string | null) => void;
  clearFocus: () => void;
}

/**
 * Shared `?focus=` state for every graph view.
 *
 * - Direct loads and reloads focus the node named in the URL.
 * - Invalid ids never break the view; once nodes are available the dead
 *   parameter is removed with `replace` so it does not add history.
 * - Selecting a different node pushes history, so Back restores the previous
 *   focus. Re-selecting the current node is a no-op.
 */
export function useGraphFocus(nodeIds: readonly string[]): GraphFocusState {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusParam = searchParams.get(FOCUS_PARAM);

  const idSet = useMemo(() => new Set(nodeIds), [nodeIds]);
  const focusId = focusParam && idSet.has(focusParam) ? focusParam : null;
  const invalidFocusId =
    focusParam && nodeIds.length > 0 && !idSet.has(focusParam) ? focusParam : null;

  const setFocus = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set(FOCUS_PARAM, id);
      else next.delete(FOCUS_PARAM);
      if (next.toString() === searchParams.toString()) return;
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const clearFocus = useCallback(() => setFocus(null), [setFocus]);

  useEffect(() => {
    if (!invalidFocusId) return;
    const next = new URLSearchParams(searchParams);
    next.delete(FOCUS_PARAM);
    setSearchParams(next, { replace: true });
  }, [invalidFocusId, searchParams, setSearchParams]);

  return { focusId, invalidFocusId, setFocus, clearFocus };
}
