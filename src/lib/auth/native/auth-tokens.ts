import { SignJWT, jwtVerify } from "jose";

const PURPOSES = {
  passwordReset: "password_reset",
  emailConfirm: "email_confirm",
  emailChange: "email_change",
} as const;

type TokenPurpose = (typeof PURPOSES)[keyof typeof PURPOSES];

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set (min 32 chars)");
  }
  return new TextEncoder().encode(secret);
}

async function signPurposeToken(
  purpose: TokenPurpose,
  userId: string,
  ttlMs: number,
  extra?: Record<string, string>,
): Promise<string> {
  const jwt = new SignJWT({ purpose, ...extra })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime(Math.floor((Date.now() + ttlMs) / 1000))
    .setIssuedAt();
  return jwt.sign(getAuthSecret());
}

async function verifyPurposeToken(
  token: string,
  expectedPurpose: TokenPurpose,
): Promise<{ userId: string; email?: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (payload.purpose !== expectedPurpose || !payload.sub) return null;
    return {
      userId: payload.sub,
      email:
        typeof payload.email === "string" ? payload.email : undefined,
    };
  } catch {
    return null;
  }
}

const HOUR_MS = 60 * 60 * 1000;

export async function signPasswordResetToken(
  userId: string,
): Promise<string> {
  return signPurposeToken(PURPOSES.passwordReset, userId, HOUR_MS);
}

export async function verifyPasswordResetToken(
  token: string,
): Promise<{ userId: string } | null> {
  const result = await verifyPurposeToken(token, PURPOSES.passwordReset);
  return result ? { userId: result.userId } : null;
}

export async function signEmailConfirmToken(
  userId: string,
  email: string,
): Promise<string> {
  return signPurposeToken(PURPOSES.emailConfirm, userId, 24 * HOUR_MS, {
    email,
  });
}

export async function verifyEmailConfirmToken(
  token: string,
): Promise<{ userId: string; email?: string } | null> {
  return verifyPurposeToken(token, PURPOSES.emailConfirm);
}

export async function signEmailChangeToken(
  userId: string,
  newEmail: string,
): Promise<string> {
  return signPurposeToken(PURPOSES.emailChange, userId, HOUR_MS, {
    email: newEmail,
  });
}

export async function verifyEmailChangeToken(
  token: string,
): Promise<{ userId: string; newEmail: string } | null> {
  const result = await verifyPurposeToken(token, PURPOSES.emailChange);
  if (!result?.email) return null;
  return { userId: result.userId, newEmail: result.email };
}
