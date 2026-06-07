export const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
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

export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
