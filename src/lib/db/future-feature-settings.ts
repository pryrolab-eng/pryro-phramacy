import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type AccountingExpenseInput = {
  pharmacyId: string;
  category: string;
  amount: number;
  description?: string | null;
  expenseDate?: string | null;
  createdBy?: string | null;
};

export type ReportScheduleInput = {
  pharmacyId: string;
  reportType: string;
  frequency: string;
  recipients: string[];
  isActive: boolean;
};

export type PushSubscriptionInput = {
  userId: string;
  pharmacyId: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string | null;
};

export type EmailTemplateInput = {
  templateKey: string;
  subject: string;
  html: string;
  text?: string | null;
  isActive: boolean;
};

export async function listAccountingExpenses(
  pharmacyId: string,
  range?: { from?: Date; to?: Date },
) {
  return prisma.accounting_expenses.findMany({
    where: {
      pharmacy_id: pharmacyId,
      ...(range?.from || range?.to
        ? {
            expense_date: {
              ...(range.from ? { gte: range.from } : {}),
              ...(range.to ? { lt: range.to } : {}),
            },
          }
        : {}),
    },
    orderBy: { expense_date: "desc" },
    take: 200,
  });
}

export async function createAccountingExpense(input: AccountingExpenseInput) {
  return prisma.accounting_expenses.create({
    data: {
      pharmacy_id: input.pharmacyId,
      category: input.category,
      amount: input.amount,
      description: input.description ?? null,
      expense_date: input.expenseDate ? new Date(input.expenseDate) : new Date(),
      source: "manual",
      created_by: input.createdBy ?? null,
    },
  });
}

export async function deleteAccountingExpense(
  id: string,
  pharmacyId: string,
): Promise<boolean> {
  const result = await prisma.accounting_expenses.deleteMany({
    where: { id, pharmacy_id: pharmacyId },
  });
  return result.count > 0;
}

export async function listReportSchedules(pharmacyId: string) {
  return prisma.report_schedules.findMany({
    where: { pharmacy_id: pharmacyId },
    orderBy: { report_type: "asc" },
  });
}

export async function upsertReportSchedule(input: ReportScheduleInput) {
  return prisma.report_schedules.upsert({
    where: {
      pharmacy_id_report_type: {
        pharmacy_id: input.pharmacyId,
        report_type: input.reportType,
      },
    },
    create: {
      pharmacy_id: input.pharmacyId,
      report_type: input.reportType,
      frequency: input.frequency,
      recipients: input.recipients as Prisma.InputJsonValue,
      is_active: input.isActive,
    },
    update: {
      frequency: input.frequency,
      recipients: input.recipients as Prisma.InputJsonValue,
      is_active: input.isActive,
      updated_at: new Date(),
    },
  });
}

export async function upsertPushSubscription(input: PushSubscriptionInput) {
  return prisma.push_subscriptions.upsert({
    where: { endpoint: input.endpoint },
    create: {
      user_id: input.userId,
      pharmacy_id: input.pharmacyId,
      endpoint: input.endpoint,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
    },
    update: {
      user_id: input.userId,
      pharmacy_id: input.pharmacyId,
      p256dh: input.p256dh,
      auth: input.auth,
      user_agent: input.userAgent ?? null,
      updated_at: new Date(),
    },
  });
}

export async function countUserPushSubscriptions(
  userId: string,
  pharmacyId: string | null,
): Promise<number> {
  return prisma.push_subscriptions.count({
    where: { user_id: userId, pharmacy_id: pharmacyId },
  });
}

export async function listUserPushSubscriptions(
  userId: string,
  pharmacyId: string | null,
) {
  return prisma.push_subscriptions.findMany({
    where: { user_id: userId, pharmacy_id: pharmacyId },
    select: { id: true, endpoint: true, created_at: true, updated_at: true },
    orderBy: { updated_at: "desc" },
  });
}

export async function deletePushSubscription(
  endpoint: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.push_subscriptions.deleteMany({
    where: { endpoint, user_id: userId },
  });
  return result.count > 0;
}

export async function countPushSubscriptionsForUser(
  userId: string,
  pharmacyId: string | null,
): Promise<number> {
  return prisma.push_subscriptions.count({
    where: { user_id: userId, pharmacy_id: pharmacyId },
  });
}

export async function listEmailTemplates() {
  return prisma.platform_email_templates.findMany({
    orderBy: { template_key: "asc" },
  });
}

export async function getEmailTemplate(templateKey: string) {
  return prisma.platform_email_templates.findUnique({
    where: { template_key: templateKey },
  });
}

export async function upsertEmailTemplate(input: EmailTemplateInput) {
  return prisma.platform_email_templates.upsert({
    where: { template_key: input.templateKey },
    create: {
      template_key: input.templateKey,
      subject: input.subject,
      html: input.html,
      text: input.text ?? null,
      is_active: input.isActive,
    },
    update: {
      subject: input.subject,
      html: input.html,
      text: input.text ?? null,
      is_active: input.isActive,
      updated_at: new Date(),
    },
  });
}
