import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { isPharmacyOwnerRole } from "@/lib/rbac/pharmacy-roles";
import { storeFindMembershipAtPharmacy } from "@/lib/db/pharmacy-users-store";
import { upsertPharmacyLocaleFromDb } from "@/lib/db/pharmacy-locale";
import { signEmailChangeToken } from "@/lib/auth/native/auth-tokens";
import {
  sendEmailChangeVerification,
  sendEmailChangeNotification,
} from "@/lib/email/native-auth-emails";
import { consumeRateLimit } from "@/lib/rate-limit/buckets";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import {
  storeGetTwoFactorAuthData,
  storeSaveTwoFactorSetup,
  storeEnableTwoFactor,
} from "@/lib/db/public-users-store";
import { getAllowUserTwoFactor } from "@/lib/platform-security-policy";
import { writeAuditLog } from "@/lib/db/audit-logs";

// ─── Context ──────────────────────────────────────────────────

export type SettingsToolContext = {
  userId: string;
  userEmail: string;
  pharmacyId?: string | null;
};

type ToolResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

// ─── Tool 1: update_profile ───────────────────────────────────

const updateProfileParams = z
  .object({
    displayName: z.string().optional().describe("New display name"),
    fullName: z.string().optional().describe("New full name"),
  })
  .refine((obj) => obj.displayName || obj.fullName, {
    message: "At least one of displayName or fullName is required",
  });

async function updateProfile(
  ctx: SettingsToolContext,
  params: z.infer<typeof updateProfileParams>,
): Promise<ToolResult> {
  try {
    const data: { name?: string; full_name?: string; updated_at: Date } = {
      updated_at: new Date(),
    };
    if (params.displayName !== undefined) data.name = params.displayName;
    if (params.fullName !== undefined) data.full_name = params.fullName;

    await prisma.public_users.update({
      where: { id: ctx.userId },
      data,
    });

    await writeAuditLog({
      pharmacyId: ctx.pharmacyId ?? null,
      userId: ctx.userId,
      action: "UPDATE",
      tableName: "public.users",
      recordId: ctx.userId,
      newValues: { ...(params.displayName !== undefined && { name: params.displayName }),
        ...(params.fullName !== undefined && { full_name: params.fullName }) },
    });

    return {
      success: true,
      data: {
        ...(params.displayName !== undefined && { name: params.displayName }),
        ...(params.fullName !== undefined && { full_name: params.fullName }),
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool 2: update_business_profile ──────────────────────────

const updateBusinessProfileParams = z
  .object({
    name: z.string().optional().describe("Pharmacy business name"),
    phone: z.string().optional().describe("Business phone number"),
    email: z.string().optional().describe("Business contact email"),
    location: z
      .string()
      .optional()
      .describe("Location as 'City, Province'"),
    currency: z.string().optional().describe("Currency code (e.g. RWF)"),
    language: z.string().optional().describe("Language code (e.g. en, rw)"),
  })
  .refine(
    (obj) =>
      obj.name || obj.phone || obj.email || obj.location || obj.currency || obj.language,
    { message: "At least one field is required" },
  );

async function updateBusinessProfile(
  ctx: SettingsToolContext,
  params: z.infer<typeof updateBusinessProfileParams>,
): Promise<ToolResult> {
  try {
    if (!ctx.pharmacyId) {
      return {
        success: false,
        error: "No pharmacy context available. This tool is for pharmacy owners only.",
      };
    }

    const membership = await storeFindMembershipAtPharmacy(
      ctx.userId,
      ctx.pharmacyId,
    );
    if (!membership || !isPharmacyOwnerRole(membership.role)) {
      return {
        success: false,
        error: "Only the pharmacy owner can update business settings.",
      };
    }

    const updateData: Record<string, unknown> = {};
    if (params.name) updateData.name = params.name;
    if (params.phone) updateData.phone = params.phone;
    if (params.email) updateData.email = params.email;
    if (params.location) {
      const parts = params.location.split(",").map((p: string) => p.trim());
      updateData.city = parts[0] || null;
      updateData.province = parts[1] || null;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.pharmacies.update({
        where: { id: ctx.pharmacyId },
        data: updateData,
      });
    }

    if (params.currency || params.language) {
      await upsertPharmacyLocaleFromDb(ctx.pharmacyId, {
        currency: params.currency,
        language: params.language,
      });
    }

    await writeAuditLog({
      pharmacyId: ctx.pharmacyId,
      userId: ctx.userId,
      action: "UPDATE",
      tableName: "pharmacies",
      recordId: ctx.pharmacyId,
      newValues: { businessProfile: updateData },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool 3: initiate_email_change ────────────────────────────

const initiateEmailChangeParams = z.object({
  newEmail: z.string().email("Invalid email format"),
});

async function initiateEmailChange(
  ctx: SettingsToolContext,
  params: z.infer<typeof initiateEmailChangeParams>,
): Promise<ToolResult> {
  try {
    const newEmail = params.newEmail.trim().toLowerCase();

    // Rate limit: 3 per hour per user
    const result = await consumeRateLimit({
      bucketKey: `changeEmail:${ctx.userId}`,
      max: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!result.allowed) {
      return {
        success: false,
        error: "Too many email change requests. Please wait about an hour and try again.",
      };
    }

    // Generic response — don't reveal if email is taken
    const genericSuccess = {
      success: true as const,
      message:
        "If this email is available, a verification link has been sent. A notification has also been sent to your current email for security.",
    };

    // Check uniqueness silently
    const existing = await prisma.auth_users.findFirst({
      where: { email: newEmail },
      select: { id: true },
    });
    if (existing && existing.id !== ctx.userId) {
      return genericSuccess;
    }

    // Sign token and store pending state
    const token = await signEmailChangeToken(ctx.userId, newEmail);
    await prisma.auth_users.update({
      where: { id: ctx.userId },
      data: {
        email_change: newEmail,
        email_change_token_new: token,
        email_change_sent_at: new Date(),
        email_change_confirm_status: 0,
      },
    });

    // Send emails
    await sendEmailChangeVerification(newEmail, token);
    await sendEmailChangeNotification(ctx.userEmail, newEmail);

    await writeAuditLog({
      pharmacyId: ctx.pharmacyId ?? null,
      userId: ctx.userId,
      action: "UPDATE",
      tableName: "auth.users",
      recordId: ctx.userId,
      newValues: { emailChangeInitiated: true, newEmail },
    });

    return genericSuccess;
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool 4: setup_2fa ───────────────────────────────────────

const setup2faParams = z.object({});

async function setup2fa(
  ctx: SettingsToolContext,
  _params: z.infer<typeof setup2faParams>,
): Promise<ToolResult> {
  try {
    const platformAllows = await getAllowUserTwoFactor();
    if (!platformAllows) {
      return {
        success: false,
        error: "Two-factor authentication is disabled by the platform administrator.",
      };
    }

    // Rate limit: 5 per 15 min per user
    const result = await consumeRateLimit({
      bucketKey: `2fa_setup:${ctx.userId}`,
      max: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (!result.allowed) {
      return {
        success: false,
        error: "Too many setup attempts. Please wait a few minutes and try again.",
      };
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(
      ctx.userEmail || "user",
      "Pryrox",
      secret,
    );
    const qrCode = await QRCode.toDataURL(otpauthUrl);
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString("hex").toUpperCase(),
    );

    await storeSaveTwoFactorSetup(ctx.userId, secret, backupCodes);

    return {
      success: true,
      data: { qrCode, backupCodes, secret },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool 5: verify_2fa ──────────────────────────────────────

const verify2faParams = z.object({
  token: z.string().min(6).max(8).describe("6-digit TOTP code from authenticator app"),
});

async function verify2fa(
  ctx: SettingsToolContext,
  params: z.infer<typeof verify2faParams>,
): Promise<ToolResult> {
  try {
    const authData = await storeGetTwoFactorAuthData(ctx.userId);
    if (!authData?.two_factor_secret) {
      return {
        success: false,
        error: "No pending 2FA setup found. Please run setup_2fa first.",
      };
    }

    const isValid = authenticator.verify({
      token: params.token,
      secret: authData.two_factor_secret,
    });

    if (!isValid) {
      return {
        success: false,
        error: "Invalid verification code. Please check your authenticator app and try again.",
      };
    }

    await storeEnableTwoFactor(ctx.userId);

    await writeAuditLog({
      pharmacyId: ctx.pharmacyId ?? null,
      userId: ctx.userId,
      action: "UPDATE",
      tableName: "auth.users",
      recordId: ctx.userId,
      newValues: { twoFactorEnabled: true },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Tool Registry ────────────────────────────────────────────

export const settingsTools = {
  update_profile: {
    description:
      "Update the user's display name and/or full name. Requires at least one field.",
    parameters: updateProfileParams,
    execute: (
      ctx: SettingsToolContext,
      params: z.infer<typeof updateProfileParams>,
    ) => updateProfile(ctx, params),
  },
  update_business_profile: {
    description:
      "Update the pharmacy's business profile (name, phone, email, location, currency, language). Only available to pharmacy owners.",
    parameters: updateBusinessProfileParams,
    execute: (
      ctx: SettingsToolContext,
      params: z.infer<typeof updateBusinessProfileParams>,
    ) => updateBusinessProfile(ctx, params),
  },
  initiate_email_change: {
    description:
      "Initiate an email address change. Sends a verification link to the new email and a notification to the current email. The change takes effect only after the user clicks the verification link.",
    parameters: initiateEmailChangeParams,
    execute: (
      ctx: SettingsToolContext,
      params: z.infer<typeof initiateEmailChangeParams>,
    ) => initiateEmailChange(ctx, params),
  },
  setup_2fa: {
    description:
      "Set up two-factor authentication. Generates a QR code for the user to scan with their authenticator app, plus backup codes. After setup, the user must call verify_2fa with the 6-digit code to complete activation.",
    parameters: setup2faParams,
    execute: (ctx: SettingsToolContext) => setup2fa(ctx, {}),
  },
  verify_2fa: {
    description:
      "Verify a 6-digit TOTP code from the user's authenticator app to complete 2FA setup. Only works after setup_2fa has been called.",
    parameters: verify2faParams,
    execute: (
      ctx: SettingsToolContext,
      params: z.infer<typeof verify2faParams>,
    ) => verify2fa(ctx, params),
  },
};
