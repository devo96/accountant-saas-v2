import { describe, it, expect } from "vitest";
import { renderTemplate, DEFAULT_TEMPLATES } from "@/lib/email-templates";

describe("renderTemplate", () => {
  it("replaces variables in template", () => {
    const result = renderTemplate("Hello {name}!", { name: "Ahmed" });
    expect(result).toBe("Hello Ahmed!");
  });

  it("replaces multiple variables", () => {
    const result = renderTemplate("{customerName}, Invoice #{number} for {amount}", {
      customerName: "Ali",
      number: 42,
      amount: 1500,
    });
    expect(result).toBe("Ali, Invoice #42 for 1500");
  });

  it("leaves unknown variables as-is", () => {
    const result = renderTemplate("Hello {name} {unknown}", { name: "Test" });
    expect(result).toBe("Hello Test {unknown}");
  });

  it("handles no variables", () => {
    const result = renderTemplate("Plain text", {});
    expect(result).toBe("Plain text");
  });
});

describe("DEFAULT_TEMPLATES", () => {
  it("contains invoice.created template", () => {
    const t = DEFAULT_TEMPLATES["invoice.created"];
    expect(t).toBeDefined();
    expect(t.subject).toContain("Invoice");
    expect(t.body).toContain("{customerName}");
  });

  it("contains all expected keys", () => {
    expect(Object.keys(DEFAULT_TEMPLATES)).toEqual([
      "invoice.created",
      "invoice.paid",
      "quote.accepted",
      "expense.approved",
    ]);
  });
});
