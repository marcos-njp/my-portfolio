"use client";

// lib/data-analyst-sandbox/use-media-query.ts
//
// A media query as React state, SSR-safe.
//
// `useSyncExternalStore` rather than `useState` plus an effect. `matchMedia` is
// exactly what that hook is for: an external store with a subscription and a
// snapshot. The effect version has to call `setState` during mount to pick up
// the initial match, which schedules a second render every time the query is
// true and is what `react-hooks/set-state-in-effect` warns about.
//
// The server snapshot is `false`, so the server HTML and the hydrating client
// agree; React swaps to the live snapshot once hydration finishes. Reading
// `matchMedia` during render instead would make the two disagree whenever the
// query matched, and React would discard the subtree with a hydration warning.
//
// Used by the profiler workspace to decide which of the two inspector slots gets
// the rail. Only one is ever filled, so the rail's `useId` values and its live
// regions are never duplicated.

import { useCallback, useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return () => {};
      }
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }
    // A boolean, so React's identity check compares by value and recomputing
    // this on every render is safe.
    return window.matchMedia(query).matches;
  }, [query]);

  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
