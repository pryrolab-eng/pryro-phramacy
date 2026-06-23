import type { NextRequest } from "next/server";

/** Parse JSON or form-encoded webhook bodies (some gateways differ from local dev). */
export async function parseIncomingWebhookBody(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const fromQuery: Record<string, unknown> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    fromQuery[key] = value;
  });

  let text = "";
  try {
    text = await request.text();
  } catch {
    return fromQuery;
  }

  return parseIncomingWebhookText(request, text, fromQuery);
}

export function parseIncomingWebhookText(
  request: NextRequest,
  text: string,
  fromQueryInput?: Record<string, unknown>,
): Record<string, unknown> {
  const fromQuery: Record<string, unknown> = fromQueryInput ?? {};
  if (!fromQueryInput) {
    request.nextUrl.searchParams.forEach((value, key) => {
      fromQuery[key] = value;
    });
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return fromQuery;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(trimmed) as Record<string, unknown>;
      return { ...fromQuery, ...parsed };
    } catch {
      /* try form fallback */
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    (!trimmed.startsWith("{") && trimmed.includes("="))
  ) {
    const params = new URLSearchParams(trimmed);
    const form: Record<string, unknown> = { ...fromQuery };
    params.forEach((value, key) => {
      form[key] = value;
    });
    if (Object.keys(form).length > 0) {
      return form;
    }
  }

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return { ...fromQuery, ...parsed };
  } catch {
    throw new Error("Unsupported webhook body format");
  }
}

export function pickString(
  body: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = body[key] ?? body[key.toLowerCase()] ?? body[key.toUpperCase()];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return undefined;
}
