/**
 * Update the URL without a Next.js navigation — safe for tab/query sync and
 * avoids "Router action dispatched before initialization" during dev HMR.
 */
export function replaceUrlShallow(url: string): void {
  if (typeof window === "undefined") return;
  window.history.replaceState(window.history.state, "", url);
}
