import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "noreply@accountant-saas.com";

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  "invoice.created": {
    subject: "New Invoice #{number}",
    body: "<p>Dear {customerName},</p><p>Invoice #{number} for {amount} has been created.</p><p>Thank you.</p>",
  },
  "invoice.paid": {
    subject: "Invoice #{number} - Payment Received",
    body: "<p>Dear {customerName},</p><p>Payment of {amount} for Invoice #{number} has been received.</p><p>Thank you.</p>",
  },
  "quote.accepted": {
    subject: "Quote #{number} - Accepted",
    body: "<p>Dear {customerName},</p><p>Quote #{number} for {amount} has been accepted.</p><p>Thank you.</p>",
  },
  "expense.approved": {
    subject: "Expense Approved",
    body: "<p>Your expense of {amount} has been approved.</p><p>Thank you.</p>",
  },
};

export async function getEmailTemplate(organizationId: string, key: string) {
  const custom = await prisma.emailTemplate.findUnique({
    where: { organizationId_key: { organizationId, key } },
  });
  if (custom) return { subject: custom.subject, body: custom.body };
  return DEFAULT_TEMPLATES[key] ?? null;
}

export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!resend) {
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    return;
  }
  await resend.emails.send({ from: DEFAULT_FROM, to, subject, html });
}

export async function sendTemplateEmail(
  organizationId: string,
  to: string,
  templateKey: string,
  vars: Record<string, string | number>
) {
  const template = await getEmailTemplate(organizationId, templateKey);
  if (!template) return;
  const subject = renderTemplate(template.subject, vars);
  const body = renderTemplate(template.body, vars);
  await sendEmail(to, subject, body);
}
