"use client";

// lib/data-analyst-sandbox/use-rail-state.ts
//
// Remembers whether a collapsible panel is open, across reloads.
//
// Deliberately NOT part of `lib/data-profiler/use-profiler.ts`. That hook
// documents that it persists nothing: its whole state is derived from a file the
// visitor chose in this tab, and writing any of it to storage would outlive the
// tab that had permission to read the file. A panel's open/closed flag carries
// none of that, so it gets its own hook rather than an exception to that rule.
//
// `localStorage` is treated as the external store it is, and read through
// `useSyncExternalStore`, for the same reasons as `use-media-query.ts`: the
// server cannot know the stored value, so `getServerSnapshot` returns the
// fallback and React swaps to the real one after hydration, with no `setState`
// during an effect and no cascading render.
//
// Every access is wrapped. Safari's private mode throws on `setItem`, and a
// browser configured to block site data throws on read; in both cases the panel
// still works for the session, it just does not remember.

import { useCallback, useSyncExternalStore } from "react";

/**
 * In-tab subscribers.
 *
 * The `storage` event only fires in OTHER tabs, so a write here would not
 * notify this one. This set is how the writing tab tells itself.
 */
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/**
 * Session fallback for when `localStorage` is unavailable.
 *
 * Without it a browser blocking site data would leave the toggle inert: the
 * write would throw, the next read would return nothing, and the panel would
 * snap back to the fallback on every click. Persistence is the feature that
 * degrades there, not the control.
 */
const memory = new Map<string, boolean>();

/** `null` when nothing has been stored anywhere yet. */
function read(key: string): boolean | null {
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === "true") return true;
    if (stored === "false") return false;
  } catch {
    // Fall through to the in-memory value.
  }
  return memory.get(key) ?? null;
}

export function useRailState(key: string, fallback: boolean): [boolean, () => void] {
  const subscribe = useCallback((onStoreChange: () => void) => {
    listeners.add(onStoreChange);
    window.addEventListener("storage", onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
      window.removeEventListener("storage", onStoreChange);
    };
  }, []);

  const getSnapshot = useCallback(() => read(key) ?? fallback, [key, fallback]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);

  const open = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const next = !(read(key) ?? fallback);
    // Memory first, so the control works even when the write below throws.
    memory.set(key, next);
    try {
      window.localStorage.setItem(key, String(next));
    } catch {
      // Storage unavailable: the panel still toggles, it just will not
      // remember across a reload.
    }
    emit();
  }, [key, fallback]);

  return [open, toggle];
}
