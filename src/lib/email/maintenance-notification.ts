import { prisma } from "@/lib/db/prisma";
import { sendMail, isSmtpConfigured } from "./mailer";
import { authEmailLayout } from "./templates";

export type MaintenanceNotificationResult = {
  sent: number;
  failed: number;
  skipped: number;
};

function maintenanceNotificationHtml(message: string, scheduledAt: string): string {
  const date = new Date(scheduledAt);
  const formatted = date.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return authEmailLayout(
    "Scheduled Maintenance Notice",
    `<p>We wanted to let you know that Pryrox will undergo scheduled maintenance.</p>
     <p><strong>When:</strong> ${formatted}</p>
     <p><strong>What to expect:</strong> ${message}</p>
     <p>During this time, you may experience limited access to the platform. We recommend saving your work before the maintenance window begins.</p>
     <p>We apologize for any inconvenience and will work to complete the maintenance as quickly as possible.</p>`
  );
}

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
  const html = maintenanceNotificationHtml(message, scheduledAt);
  const subject = "Pryrox Scheduled Maintenance Notice";

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      await sendMail({ to: email, subject, html });
      sent++;
    } catch {
      failed++;
    }
  }

  return { sent, failed, skipped: 0 };
}
