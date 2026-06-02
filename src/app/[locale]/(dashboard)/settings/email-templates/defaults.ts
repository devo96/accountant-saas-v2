export const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
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
