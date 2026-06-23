import { SignJWT, jwtVerify } from "jose";
import { getAppUrl } from "@/lib/app-url";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type GoogleUserProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function getGoogleOAuthRedirectUri(): string {
  return `${getAppUrl()}/api/auth/google/callback`;
}

export async function signGoogleOAuthState(nextPath?: string): Promise<string> {
  const jwt = new SignJWT({
    purpose: "google_oauth",
    next: nextPath?.startsWith("/") ? nextPath : undefined,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(Math.floor((Date.now() + OAUTH_STATE_TTL_MS) / 1000))
    .setIssuedAt();
  return jwt.sign(getAuthSecret());
}

export async function verifyGoogleOAuthState(
  state: string,
): Promise<{ nextPath?: string } | null> {
  try {
    const { payload } = await jwtVerify(state, getAuthSecret());
    if (payload.purpose !== "google_oauth") return null;
    const next =
      typeof payload.next === "string" && payload.next.startsWith("/")
        ? payload.next
        : undefined;
    return { nextPath: next };
  } catch {
    return null;
  }
}

export function buildGoogleAuthorizationUrl(state: string): string {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleOAuthRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleAuthCode(
  code: string,
): Promise<{ accessToken: string }> {
  const clientId = process.env.GOOGLE_CLIENT_ID!.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!.trim();

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: getGoogleOAuthRedirectUri(),
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Google token response missing access_token");
  }

  return { accessToken: data.access_token };
}

export async function fetchGoogleUserProfile(
  accessToken: string,
): Promise<GoogleUserProfile> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to load Google profile");
  }

  const data = (await res.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!data.sub || !data.email) {
    throw new Error("Google profile missing required fields");
  }

  return {
    sub: data.sub,
    email: data.email.trim().toLowerCase(),
    emailVerified: data.email_verified === true,
    name: data.name ?? null,
    picture: data.picture ?? null,
  };
}
