"use client";

// lib/use-persisted-flag.ts
//
// A single boolean that remembers itself in `localStorage` across reloads,
// generalized out of `lib/data-analyst-sandbox/use-rail-state.ts` so a
// one-off flag (a dismissed banner, a seen-once notice) does not have to
// import a hook named after an unrelated feature.
//
// Read through `useSyncExternalStore` rather than `useState` plus an effect,
// for the same reason as `use-rail-state.ts` and `use-media-query.ts`: the
// server cannot know the stored value, so `getServerSnapshot` returns the
// fallback and React swaps to the real one after hydration, with no
// `setState` during an effect and no cascading render.
//
// Every access is wrapped. Safari's private mode throws on `setItem`, and a
// browser configured to block site data throws on read; in both cases the
// flag still works for the session, it just does not remember.

import { useCallback, useSyncExternalStore } from "react";

/** In-tab subscribers. The `storage` event only fires in OTHER tabs. */
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Session fallback for when `localStorage` is unavailable. */
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

function write(key: string, value: boolean): void {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable: the flag still updates, it just will not persist.
  }
  emit();
}

/**
 * Returns `[value, setValue]`. `value` starts at `fallback` on the server and
 * on first client render, then resolves to the stored value once hydration
 * settles.
 */
export function usePersistedFlag(
  key: string,
  fallback: boolean,
): [boolean, (next: boolean) => void] {
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

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: boolean) => write(key, next),
    [key],
  );

  return [value, setValue];
}
