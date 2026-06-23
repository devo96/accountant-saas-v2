import { NextResponse } from "next/server";
import { type ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { error: NextResponse.json({ error: messages }, { status: 400 }) };
  }
  return { data: result.data };
}

/** Validate an update payload — rejects unknown fields but allows any subset. */
export function validatePartial<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
  data: unknown,
): { data: Partial<T>; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.partial().safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { error: NextResponse.json({ error: messages }, { status: 400 }) };
  }
  return { data: result.data as Partial<T> };
}
