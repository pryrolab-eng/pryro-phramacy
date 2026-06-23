import { NextRequest, NextResponse } from "next/server";
import { requirePlatformAdminApi } from "@/lib/admin/require-platform-admin";
import { prisma } from "@/lib/db/prisma";
import { confirmationEmailHtml, recoveryEmailHtml } from "@/lib/email/templates";
import { staffInviteEmailHtml } from "@/lib/email/staff-invite";

const DEFAULT_TEMPLATES = [
  {
    templateKey: "auth.signup_confirm",
    subject: "Confirm your Pryrox email",
    html: confirmationEmailHtml("{{actionUrl}}"),
    text: "Confirm your Pryrox email: {{actionUrl}}",
  },
  {
    templateKey: "auth.password_reset",
    subject: "Reset your Pryrox password",
    html: recoveryEmailHtml("{{actionUrl}}"),
    text: "Reset your Pryrox password: {{actionUrl}}",
  },
  {
    templateKey: "auth.staff_invite",
    subject: "You're invited to {{pharmacyName}} on Pryrox",
    html: staffInviteEmailHtml({
      fullName: "{{fullName}}",
      pharmacyName: "{{pharmacyName}}",
      role: "{{role}}",
      signInUrl: "{{signInUrl}}",
      temporaryPassword: "{{temporaryPassword}}",
    }),
    text: "Hi {{fullName}},\n\nYou've been invited to {{pharmacyName}} on Pryrox as {{role}}.\n\nSign in: {{signInUrl}}\nTemporary password: {{temporaryPassword}}",
  },
  {
    templateKey: "billing.payment_receipt",
    subject: "Pryrox receipt — {{planName}} ({{invoiceNumber}})",
    html: `<!DOCTYPE html>
<html>
<body>
  <h2>Thanks for your payment!</h2>
  <p>Pharmacy: {{pharmacyName}}</p>
  <p>Plan: {{planName}}</p>
  <p>Amount: {{amount}} {{currency}}</p>
  <p>Invoice number: {{invoiceNumber}}</p>
  <p>Payment method: {{paymentMethod}}</p>
  <p>Paid at: {{paidAt}}</p>
</body>
</html>`,
    text: "Thanks for your payment! Plan: {{planName}}, Amount: {{amount}} {{currency}}, Invoice: {{invoiceNumber}}.",
  },
  {
    templateKey: "platform.admin_notice",
    subject: "Pryrox Administrative Notice: {{title}}",
    html: `<!DOCTYPE html>
<html>
<body>
  <h2>Pryrox Administrative Notice</h2>
  <p>{{message}}</p>
</body>
</html>`,
    text: "Pryrox Administrative Notice: {{message}}",
  },
];

export async function GET() {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let templates = await prisma.platform_email_templates.findMany({
      orderBy: { template_key: "asc" },
    });

    if (templates.length === 0) {
      // Seed default templates
      await Promise.all(
        DEFAULT_TEMPLATES.map((tpl) =>
          prisma.platform_email_templates.create({
            data: {
              template_key: tpl.templateKey,
              subject: tpl.subject,
              html: tpl.html,
              text: tpl.text,
              is_active: true,
            },
          }),
        ),
      );
      templates = await prisma.platform_email_templates.findMany({
        orderBy: { template_key: "asc" },
      });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("GET /api/admin/email-templates", error);
    return NextResponse.json({ error: "Failed to load email templates" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requirePlatformAdminApi();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { templateKey, subject, html, text, isActive } = await request.json();
    if (!templateKey || !subject || !html) {
      return NextResponse.json({ error: "templateKey, subject, and html are required" }, { status: 400 });
    }

    const template = await prisma.platform_email_templates.upsert({
      where: { template_key: templateKey },
      create: {
        template_key: templateKey,
        subject,
        html,
        text: text ?? null,
        is_active: isActive !== false,
      },
      update: {
        subject,
        html,
        text: text ?? null,
        is_active: isActive !== false,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("PUT /api/admin/email-templates", error);
    return NextResponse.json({ error: "Failed to save email template" }, { status: 500 });
  }
}
