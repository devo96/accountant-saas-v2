import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

export const JournalEntrySchema = z.object({
  date: z.string().datetime(),
  description: z.string().min(1),
  descriptionAr: z.string().optional(),
  reference: z.string().optional(),
  fiscalYearId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  attachments: z.string().optional(),
  lines: z
    .array(
      z.object({
        accountId: z.string().uuid(),
        description: z.string().optional(),
        debit: z.number().nonnegative(),
        credit: z.number().nonnegative(),
      })
    )
    .min(2)
    .refine(
      (lines) => {
        const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
        const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
        return Math.abs(totalDebit - totalCredit) < 0.01;
      },
      { message: "Debits must equal credits" }
    ),
});

export type JournalEntryInput = z.infer<typeof JournalEntrySchema>;

export async function createJournalEntry(
  organizationId: string,
  userId: string,
  input: JournalEntryInput & { status?: string }
) {
  const data = JournalEntrySchema.parse(input);

  const lastEntry = await prisma.journalEntry.findFirst({
    where: { organizationId },
    orderBy: { number: "desc" },
    select: { number: true },
  });

  const entry = await prisma.journalEntry.create({
    data: {
      number: (lastEntry?.number ?? 0) + 1,
      date: new Date(data.date),
      description: data.description,
      descriptionAr: data.descriptionAr,
      reference: data.reference,
      fiscalYearId: data.fiscalYearId,
      projectId: data.projectId,
      attachments: data.attachments,
      organizationId,
      createdById: userId,
      status: input.status === "DRAFT" ? "DRAFT" : "POSTED",
      lines: {
        create: data.lines.map((line) => ({
          accountId: line.accountId,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
        })),
      },
    },
    include: { lines: true },
  });

  logger.info({ entryId: entry.id, number: entry.number }, "Journal entry created");
  return entry;
}
