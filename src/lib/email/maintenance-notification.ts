import { prisma } from "@/lib/db/prisma";
import { sendMail, isSmtpConfigured } from "./mailer";
import {
  maintenanceNoticeEmailHtml,
  maintenanceNoticeEmailText,
} from "./maintenance-email";

export type MaintenanceNotificationResult = {
  sent: number;
  failed: number;
  skipped: number;
};

export async function getAllUserEmails(): Promise<string[]> {
  const users = await prisma.public_users.findMany({
    select: { email: true },
    where: {
      email: { not: null },
    },
  });
  return users.map((u) => u.email).filter((e): e is string => Boolean(e));
}

export async function sendMaintenanceNotification(
  message: string,
  scheduledAt: string
): Promise<MaintenanceNotificationResult> {
  if (!isSmtpConfigured()) {
    return { sent: 0, failed: 0, skipped: 0 };
  }

  const emails = await getAllUserEmails();
  const html = maintenanceNoticeEmailHtml({ message, scheduledAt });
  const text = maintenanceNoticeEmailText({ message, scheduledAt });
  const subject = "Pryrox scheduled maintenance notice";

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendMail({ to: email, subject, html, text });
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, skipped: 0 };
}
