import { getEmailTemplate } from "@/lib/db/future-feature-settings";

export type EmailTemplateDefaults = {
  templateKey: string;
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, string>;
};

function applyVariables(value: string, variables: Record<string, string>): string {
  return Object.entries(variables).reduce(
    (next, [key, replacement]) =>
      next.replaceAll(`{{${key}}}`, replacement),
    value,
  );
}

export async function resolveEmailTemplate(
  defaults: EmailTemplateDefaults,
): Promise<{ subject: string; html: string; text?: string }> {
  const variables = defaults.variables ?? {};
  try {
    const override = await getEmailTemplate(defaults.templateKey);
    if (override?.is_active) {
      return {
        subject: applyVariables(override.subject, variables),
        html: applyVariables(override.html, variables),
        text: override.text ? applyVariables(override.text, variables) : undefined,
      };
    }
  } catch (error) {
    console.error("resolveEmailTemplate:", error);
  }

  return {
    subject: applyVariables(defaults.subject, variables),
    html: applyVariables(defaults.html, variables),
    text: defaults.text ? applyVariables(defaults.text, variables) : undefined,
  };
}
