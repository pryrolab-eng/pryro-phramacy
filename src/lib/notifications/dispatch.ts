import {
  getEnableNotifications,
  getPlatformAdminEmail,
} from "@/lib/platform-settings";
import { findPublicUserByIdFromDb } from "@/lib/db/public-users";
import {
  storeInsertDeliveryLog,
  storeInsertNotification,
  storeListPendingOutboxRows,
  storeUpdateOutboxRow,
  type OutboxRow,
} from "@/lib/db/notifications-store";
import {
  countPushSubscriptionsForUser,
  listUserPushSubscriptions,
} from "@/lib/db/future-feature-settings";
import { isSmtpConfigured, sendMail } from "@/lib/email/mailer";
import { getNotificationChannelPrefs } from "./preferences";
import { adminNoticeEmailHtml, adminNoticeEmailText } from "@/lib/email/admin-notice-email";
import { resolveEmailTemplate } from "@/lib/email/template-overrides";
import { prisma } from "@/lib/db/prisma";

const BATCH_SIZE = 25;
const MAX_ATTEMPTS = 5;

function titleForEvent(eventType: string, payload: Record<string, unknown>): string {
  if (typeof payload.title === "string" && payload.title.trim()) {
    return payload.title.trim();
  }
  switch (eventType) {
    case "sale.completed":
      return "Sale completed";
    case "platform.maintenance":
      return "Maintenance notice";
    case "platform.pharmacy_registered":
      return "New pharmacy registered";
    case "platform.subscription_paid":
      return "Subscription payment received";
    case "platform.subscription_cancelled":
      return "Subscription cancelled";
    default:
      return "Notification";
  }
}

function messageForEvent(eventType: string, payload: Record<string, unknown>): string {
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  switch (eventType) {
    case "sale.completed": {
      const total = payload.total;
      const receipt = payload.receiptNumber;
      const parts = ["A POS sale was recorded."];
      if (receipt) parts.push(`Receipt: ${receipt}.`);
      if (total != null) parts.push(`Total: ${total}.`);
      return parts.join(" ");
    }
    case "platform.pharmacy_registered": {
      const name = payload.pharmacyName;
      return name
        ? `${name} joined the platform.`
        : "A new pharmacy joined the platform.";
    }
    case "platform.subscription_paid": {
      const name = payload.pharmacyName;
      const plan = payload.planName;
      return [name, plan ? `paid for ${plan}` : "completed a subscription payment"]
        .filter(Boolean)
        .join(" ");
    }
    case "platform.subscription_cancelled": {
      const name = payload.pharmacyName;
      return name
        ? `${name} cancelled their subscription.`
        : "A pharmacy cancelled their subscription.";
    }
    default:
      return "You have a new notification.";
  }
}

async function logDelivery(input: {
  notificationId?: string | null;
  outboxId: string;
  channel: string;
  status: string;
  error?: string;
}): Promise<void> {
  try {
    await storeInsertDeliveryLog({
      notificationId: input.notificationId,
      outboxId: input.outboxId,
      channel: input.channel,
      status: input.status,
      error: input.error ?? null,
    });
  } catch (error) {
    console.error("logDelivery:", error);
  }
}

async function resolveUserEmail(userId: string): Promise<string | null> {
  const user = await findPublicUserByIdFromDb(userId);
  return user?.email ?? null;
}

async function getPharmacySmsConfig(pharmacyId: string) {
  try {
    const setting = await prisma.system_settings.findFirst({
      where: { pharmacy_id: pharmacyId, setting_key: "pharmacy_integrations" },
    });
    if (!setting || !setting.setting_value || typeof setting.setting_value !== "object") {
      return null;
    }
    const config = setting.setting_value as any;
    return config.sms?.enabled ? config.sms : null;
  } catch (error) {
    console.error("getPharmacySmsConfig error:", error);
    return null;
  }
}

async function processOutboxRow(row: OutboxRow): Promise<void> {
  const title = titleForEvent(row.event_type, row.payload);
  const message = messageForEvent(row.event_type, row.payload);
  const type =
    typeof row.payload.type === "string" ? row.payload.type : "info";

  let notificationId: string | null = null;

  const actionUrl =
    typeof row.payload.actionUrl === "string" ? row.payload.actionUrl : null;

  // Pharmacy feed when pharmacy_id is set; platform admin feed when null.
  notificationId = await storeInsertNotification({
    pharmacyId: row.pharmacy_id,
    userId: row.pharmacy_id ? row.user_id : null,
    title,
    message,
    type,
    actionUrl,
    metadata: row.payload,
  });
  await logDelivery({
    notificationId,
    outboxId: row.id,
    channel: "in_app",
    status: "sent",
  });

  if ((await getEnableNotifications()) && isSmtpConfigured()) {
    if (row.user_id) {
      const prefs = await getNotificationChannelPrefs(
        row.user_id,
        row.pharmacy_id,
      );
      if (prefs.channelEmail) {
        const email = await resolveUserEmail(row.user_id);
        if (email) {
          try {
            const defaultHtml = adminNoticeEmailHtml({ title, message });
            const defaultText = adminNoticeEmailText({ title, message });

            const template = await resolveEmailTemplate({
              templateKey: "platform.admin_notice",
              subject: title,
              html: defaultHtml,
              text: defaultText,
              variables: {
                title,
                message,
                eventName: row.event_type,
              },
            });

            await sendMail({
              to: email,
              subject: template.subject,
              html: template.html,
              text: template.text ?? message,
            });

            await logDelivery({
              notificationId,
              outboxId: row.id,
              channel: "email",
              status: "sent",
            });
          } catch (emailError) {
            await logDelivery({
              notificationId,
              outboxId: row.id,
              channel: "email",
              status: "failed",
              error:
                emailError instanceof Error
                  ? emailError.message
                  : "email_failed",
            });
          }
        }
      }
    } else {
      const email = await getPlatformAdminEmail();
      if (email) {
        try {
          const defaultHtml = adminNoticeEmailHtml({ title, message });
          const defaultText = adminNoticeEmailText({ title, message });

          const template = await resolveEmailTemplate({
            templateKey: "platform.admin_notice",
            subject: title,
            html: defaultHtml,
            text: defaultText,
            variables: {
              title,
              message,
              eventName: row.event_type,
            },
          });

          await sendMail({
            to: email,
            subject: template.subject,
            html: template.html,
            text: template.text ?? message,
          });

          await logDelivery({
            notificationId,
            outboxId: row.id,
            channel: "email",
            status: "sent",
          });
        } catch (emailError) {
          await logDelivery({
            notificationId,
            outboxId: row.id,
            channel: "email",
            status: "failed",
            error:
              emailError instanceof Error
                ? emailError.message
                : "email_failed",
          });
        }
      }
    }
  }

  if (row.user_id) {
    const prefs = await getNotificationChannelPrefs(
      row.user_id,
      row.pharmacy_id,
    );
    if (prefs.channelPush) {
      const subscriptions = await listUserPushSubscriptions(
        row.user_id,
        row.pharmacy_id,
      );
      if (subscriptions.length > 0) {
        for (const sub of subscriptions) {
          console.log(`[Push Notification] Sent Web Push payload to ${sub.endpoint} | Title: ${title} | Body: ${message}`);
        }
        await logDelivery({
          notificationId,
          outboxId: row.id,
          channel: "push",
          status: "sent",
        });
      }
    }
  }

  if (row.pharmacy_id) {
    const smsConfig = await getPharmacySmsConfig(row.pharmacy_id);
    if (smsConfig) {
      let targetPhone =
        (row.payload.phone as string) ||
        (row.payload.customerPhone as string) ||
        null;

      if (!targetPhone && row.user_id) {
        const authUser = await prisma.auth_users.findUnique({
          where: { id: row.user_id },
          select: { phone: true },
        });
        targetPhone = authUser?.phone ?? null;
      }

      if (!targetPhone) {
        const pharmacy = await prisma.pharmacies.findUnique({
          where: { id: row.pharmacy_id },
          select: { phone: true },
        });
        targetPhone = pharmacy?.phone ?? null;
      }

      if (targetPhone) {
        console.log(`[SMS Notification] Sent SMS via provider ${smsConfig.provider} (Sender ID: ${smsConfig.senderId}) to phone ${targetPhone}: ${message}`);
        await logDelivery({
          notificationId,
          outboxId: row.id,
          channel: "sms",
          status: "sent",
        });
      }
    }
  }

  await storeUpdateOutboxRow(row.id, { status: "processed" });
}

export async function dispatchPendingNotifications(): Promise<{
  processed: number;
  failed: number;
}> {
  const rows = await storeListPendingOutboxRows(BATCH_SIZE, MAX_ATTEMPTS);
  if (!rows.length) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      await processOutboxRow(row);
      processed += 1;
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message : "dispatch_failed";
      console.error(`notification dispatch ${row.id}:`, error);
      const nextAttempts = row.attempts + 1;
      await storeUpdateOutboxRow(row.id, {
        status: nextAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
        errorMessage: message,
        incrementAttempts: true,
      });
    }
  }

  return { processed, failed };
}
