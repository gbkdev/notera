"use client";
import { useCallback, useSyncExternalStore } from "react";

const KEY = "notera:saved";
const EVENT = "notera:saved-change";
export const SAVED_LIMIT = 60;

function parse(raw: string): string[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}

let lastRaw: string | null = null;
let lastVal: string[] = [];
function getSnapshot(): string[] {
  let raw = "[]";
  try { raw = localStorage.getItem(KEY) ?? "[]"; } catch { /* storage blocked */ }
  if (raw !== lastRaw) { lastRaw = raw; lastVal = parse(raw); }
  return lastVal;
}
// null on the server and during hydration, so pages can show a skeleton instead of a false "nothing saved".
const getServerSnapshot = (): string[] | null => null;

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVENT, cb); };
}

/** Bookmarks kept in this browser only. No account involved. */
export function useSaved() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ids = snap ?? [];
  const toggle = useCallback((id: string): "added" | "removed" | "full" | "blocked" => {
    const cur = getSnapshot();
    const has = cur.includes(id);
    if (!has && cur.length >= SAVED_LIMIT) return "full";
    const next = has ? cur.filter((x) => x !== id) : [id, ...cur];
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch { return "blocked"; }
    window.dispatchEvent(new Event(EVENT));
    return has ? "removed" : "added";
  }, []);
  return { ids, ready: snap !== null, has: (id: string) => ids.includes(id), toggle };
}
