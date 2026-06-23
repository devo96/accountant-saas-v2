import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

export function validate<T>(schema: ZodSchema<T>, data: unknown): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const messages = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return { error: NextResponse.json({ error: messages }, { status: 400 }) };
  }
  return { data: result.data };
}
