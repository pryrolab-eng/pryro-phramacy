import { Worker, Job } from "bullmq";
import { getRedisConnection, isRedisConfigured } from "./redis";
import { sendMail, isSmtpConfigured } from "@/lib/email/mailer";
import { authEmailLayout } from "@/lib/email/templates";
import { prisma } from "@/lib/db/prisma";
import type { MaintenanceNotifyJobData, MaintenanceNotifyJobResult } from "./maintenance-notify";

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

async function processEmailJob(job: Job): Promise<MaintenanceNotifyJobResult> {
  const { email, message, scheduledAt } = job.data as MaintenanceNotifyJobData;

  if (!isSmtpConfigured()) {
    return { email, sent: false, error: "SMTP not configured" };
  }

  try {
    const html = maintenanceNotificationHtml(message, scheduledAt);
    await sendMail({
      to: email,
      subject: "Pryrox Scheduled Maintenance Notice",
      html,
    });
    return { email, sent: true };
  } catch (error) {
    return {
      email,
      sent: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

let _worker: Worker | null = null;

export function getMaintenanceNotifyWorker(): Worker | null {
  if (_worker) return _worker;
  if (!isRedisConfigured()) return null;

  _worker = new Worker(
    "maintenance-notify",
    processEmailJob,
    {
      connection: getRedisConnection(),
      concurrency: 50,
      limiter: {
        max: 50,
        duration: 1000,
      },
    }
  );

  _worker.on("completed", async (job) => {
    const result = job.returnvalue as MaintenanceNotifyJobResult | undefined;
    const data = job.data as MaintenanceNotifyJobData;
    if (result?.sent) {
      await prisma.maintenance_notification_log.create({
        data: {
          batch_id: data.batchId,
          email: data.email,
          status: "sent",
        },
      });
    }
  });

  _worker.on("failed", async (job, error) => {
    if (job) {
      const data = job.data as MaintenanceNotifyJobData;
      await prisma.maintenance_notification_log.create({
        data: {
          batch_id: data.batchId,
          email: data.email,
          status: "failed",
          error: error.message,
        },
      });
    }
  });

  return _worker;
}

const worker = getMaintenanceNotifyWorker();
if (worker) {
  console.log("[worker] Maintenance email worker connected to Redis");
  process.on("SIGTERM", async () => {
    console.log("[worker] Shutting down...");
    await worker.close();
    process.exit(0);
  });
} else {
  console.log("[worker] Redis not configured — worker not started");
  console.log("[worker] Set REDIS_HOST or REDIS_URL in .env to enable");
}
