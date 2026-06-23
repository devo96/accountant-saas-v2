import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { syncJournalEntryBalances } from "./gl";

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

  // Resolve fiscal year: use provided one, or find by date range
  const resolvedFyId = data.fiscalYearId || await resolveFiscalYear(organizationId, data.date);
  if (resolvedFyId) {
    const fy = await prisma.fiscalYear.findUnique({ where: { id: resolvedFyId } });
    if (fy?.isClosed) {
      throw new Error(`Fiscal year "${fy.name}" is closed. Cannot post entries to a closed period.`);
    }
  }

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
      fiscalYearId: resolvedFyId,
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

  if (entry.status === "POSTED") {
    await syncJournalEntryBalances(entry.id);
  }

  logger.info({ entryId: entry.id, number: entry.number }, "Journal entry created");
  return entry;
}

/** Find the fiscal year that covers a given date for an organization. */
async function resolveFiscalYear(organizationId: string, dateStr: string): Promise<string | null> {
  const date = new Date(dateStr);
  const fy = await prisma.fiscalYear.findFirst({
    where: {
      organizationId,
      startDate: { lte: date },
      endDate: { gte: date },
    },
    orderBy: { startDate: "desc" },
    select: { id: true },
  });
  return fy?.id ?? null;
}
