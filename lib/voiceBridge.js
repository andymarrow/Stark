"use client";
/**
 * Voice command bridge
 * ---------------------
 * The Voxide client is a single instance mounted at the app root (see
 * components/Assistant.jsx). Most voice capabilities (navigate, search,
 * notifications, theme…) run entirely inside that singleton. But some actions
 * live in page-local React state — filtering the Explore hub, sending a chat
 * message, pre-filling the Create form. Those pages can't be reached from the
 * root singleton directly, so this tiny bus lets them opt in.
 *
 * A page registers a handler with `useVoiceCommand("explore.filter", fn)`.
 * A capability handler in the Assistant then either:
 *   - `emitVoiceCommand(name, payload)` — fire now if the page is mounted, or
 *   - `deliverVoiceCommand(name, payload)` — fire now, else QUEUE it so the
 *     page runs it the moment it mounts (used right after navigating there).
 *
 * `pending` intents survive client-side navigation because this module is a
 * singleton that is never re-evaluated between route changes.
 */

import { useEffect, useRef } from "react";

const listeners = new Map(); // name -> Set<handler>
const pending = new Map(); // name -> payload (drained by the page on mount)

/** Subscribe a live handler. Returns an unsubscribe function. */
export function onVoiceCommand(name, handler) {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(handler);
  return () => {
    set.delete(handler);
    if (set.size === 0) listeners.delete(name);
  };
}

/** Fire immediately if at least one listener is mounted. Returns whether it was handled. */
export function emitVoiceCommand(name, payload) {
  const set = listeners.get(name);
  if (!set || set.size === 0) return false;
  let handled = false;
  set.forEach((fn) => {
    try {
      fn(payload);
      handled = true;
    } catch (err) {
      console.error(`[voiceBridge] handler for "${name}" threw`, err);
    }
  });
  return handled;
}

/** Queue an intent for a page that isn't mounted yet. */
export function queueVoiceCommand(name, payload) {
  pending.set(name, payload ?? {});
}

/** Consume (and clear) a queued intent, if any. */
export function drainVoiceCommand(name) {
  if (!pending.has(name)) return undefined;
  const payload = pending.get(name);
  pending.delete(name);
  return payload;
}

/**
 * Deliver now if the target page is mounted, otherwise queue it so the page
 * picks it up on its next mount. Use after navigating to that page.
 */
export function deliverVoiceCommand(name, payload) {
  if (emitVoiceCommand(name, payload)) return true;
  queueVoiceCommand(name, payload);
  return false;
}

/**
 * React hook a page uses to receive a voice command. Subscribes to live
 * emissions AND drains any intent that was queued before this page mounted.
 */
export function useVoiceCommand(name, handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const unsub = onVoiceCommand(name, (payload) => ref.current && ref.current(payload));

    // Drain a queued intent on the next tick so the page's own mount effects
    // (data fetches, initial state) have a chance to run first.
    const queued = drainVoiceCommand(name);
    let timer;
    if (queued !== undefined) {
      timer = setTimeout(() => ref.current && ref.current(queued), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
}
