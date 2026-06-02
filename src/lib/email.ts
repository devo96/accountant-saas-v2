import { prisma } from "./prisma";

const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  "invoice.created": {
    subject: "New Invoice #{number}",
    body: "Dear {customerName},\n\nInvoice #{number} for {amount} has been created.\n\nThank you.",
  },
  "invoice.paid": {
    subject: "Invoice #{number} - Payment Received",
    body: "Dear {customerName},\n\nPayment of {amount} for Invoice #{number} has been received.\n\nThank you.",
  },
  "quote.accepted": {
    subject: "Quote #{number} - Accepted",
    body: "Dear {customerName},\n\nQuote #{number} for {amount} has been accepted.\n\nThank you.",
  },
  "expense.approved": {
    subject: "Expense Approved",
    body: "Your expense of {amount} has been approved.\n\nThank you.",
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

export async function sendEmail(_to: string, _subject: string, _body: string): Promise<void> {
  // Placeholder — integrate with SMTP / SendGrid / SES here
  console.log(`[EMAIL] To: ${_to}, Subject: ${_subject}`);
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
