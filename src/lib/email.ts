import { Resend } from "resend";
import { prisma } from "./prisma";
import { DEFAULT_TEMPLATES, renderTemplate } from "./email-templates";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM = process.env.EMAIL_FROM ?? "noreply@accountant-saas.com";

export { renderTemplate };

export async function getEmailTemplate(organizationId: string, key: string) {
  const custom = await prisma.emailTemplate.findUnique({
    where: { organizationId_key: { organizationId, key } },
  });
  if (custom) return { subject: custom.subject, body: custom.body };
  return DEFAULT_TEMPLATES[key] ?? null;
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
