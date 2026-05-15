/**
 * Low-level JSON fetch helpers for Next.js Route Handlers (`/api/...`).
 * Hooks and UI should call domain modules (e.g. `getStaffUsers`) instead of this directly.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorMessageFromBody(data: unknown, fallback: string): string {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return fallback;
}

/**
 * `fetch` then `res.json()`, throwing {@link ApiError} when `!res.ok`.
 */
export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  let data: unknown = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (!res.ok) {
    const message = errorMessageFromBody(
      data,
      `Request failed (${res.status})`,
    );
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/**
 * Some route handlers return HTTP 200 with `{ success: false, error }` (e.g. admin pharmacy create).
 */
export function ensureApiSuccess(data: unknown, fallbackMessage: string): void {
  if (
    data &&
    typeof data === "object" &&
    "success" in data &&
    (data as { success: unknown }).success === false
  ) {
    const err = (data as { error?: unknown }).error;
    throw new Error(typeof err === "string" ? err : fallbackMessage);
  }
}
