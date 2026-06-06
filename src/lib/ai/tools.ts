import { dynamicTool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

export const tools = (orgId: string, userId: string) => ({
  getChartOfAccounts: dynamicTool({
    description: "Get the full chart of accounts tree with codes, names, types (ASSET/LIABILITY/EQUITY/INCOME/EXPENSE), natures (DEBIT/CREDIT), and current balances.",
    inputSchema: z.object({}),
    execute: async () => {
      const accounts = await prisma.account.findMany({
        where: { organizationId: orgId },
        orderBy: { code: "asc" },
      });

      return accounts.map((a) => ({
        code: a.code,
        name: a.name,
        type: a.type,
        nature: a.nature,
        balance: Number(a.balance),
        isActive: a.active,
      }));
    },
  }) as any,

  queryExpenses: dynamicTool({
    description: "Search expenses by description keyword or date range. Returns matching expenses with their lines broken down by account.",
    inputSchema: z.object({
      keyword: z.string().optional().describe("Arabic or English keyword to search in expense descriptions (e.g. 'صيانة سيارات' for car maintenance)"),
      fromDate: z.string().optional().describe("Start date ISO string (YYYY-MM-DD)"),
      toDate: z.string().optional().describe("End date ISO string (YYYY-MM-DD)"),
      accountId: z.string().optional().describe("Filter by account ID to get expenses for a specific account"),
    }),
    execute: async ({ keyword, fromDate, toDate, accountId }: any) => {
      const where: Record<string, unknown> = { organizationId: orgId };

      if (keyword) {
        where.description = { contains: keyword };
      }
      if (fromDate || toDate) {
        (where as any).date = {};
        if (fromDate) (where as any).date.gte = new Date(fromDate);
        if (toDate) (where as any).date.lte = new Date(toDate);
      }

      const expenses = await prisma.expense.findMany({
        where: where as any,
        include: { lines: { include: { account: true } } },
        orderBy: { date: "desc" },
        take: 50,
      });

      if (accountId) {
        return expenses
          .filter((e) => e.lines.some((l) => l.accountId === accountId))
          .map((e) => ({
            id: e.id,
            number: e.number,
            date: e.date,
            description: e.description,
            amount: Number(e.amount),
            lines: e.lines.map((l) => ({
              accountCode: l.account.code,
              accountName: l.account.name,
              amount: Number(l.amount),
            })),
          }));
      }

      return expenses.map((e) => ({
        id: e.id,
        number: e.number,
        date: e.date,
        description: e.description,
        amount: Number(e.amount),
        lines: e.lines.map((l) => ({
          accountCode: l.account.code,
          accountName: l.account.name,
          amount: Number(l.amount),
        })),
      }));
    },
  }) as any,

  querySales: dynamicTool({
    description: "Get sales invoice summaries. Can filter by date range or customer.",
    inputSchema: z.object({
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      customerId: z.string().optional(),
    }),
    execute: async ({ fromDate, toDate, customerId }: any) => {
      const where: Record<string, unknown> = { organizationId: orgId };

      if (customerId) where.customerId = customerId;
      if (fromDate || toDate) {
        (where as any).invoiceDate = {};
        if (fromDate) (where as any).invoiceDate.gte = new Date(fromDate);
        if (toDate) (where as any).invoiceDate.lte = new Date(toDate);
      }

      const invoices = await prisma.salesInvoice.findMany({
        where: where as any,
        include: { customer: { select: { name: true } } },
        orderBy: { invoiceDate: "desc" },
        take: 50,
      });

      return invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.number,
        date: inv.invoiceDate,
        customer: inv.customer ? { name: inv.customer.name } : null,
        total: Number(inv.total),
        status: inv.status,
      }));
    },
  }) as any,

  queryJournalEntries: dynamicTool({
    description: "Get journal entries for a date range or account. Returns entries with their debit/credit lines and account details.",
    inputSchema: z.object({
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      accountId: z.string().optional().describe("Filter by account to see only lines for this account"),
      limit: z.number().optional().default(20),
    }),
    execute: async ({ fromDate, toDate, accountId, limit }: any) => {
      const where: Record<string, unknown> = { organizationId: orgId };
      if (fromDate || toDate) {
        (where as any).date = {};
        if (fromDate) (where as any).date.gte = new Date(fromDate);
        if (toDate) (where as any).date.lte = new Date(toDate);
      }

      const entries = await prisma.journalEntry.findMany({
        where: where as any,
        include: {
          lines: { include: { account: true } },
          createdBy: { select: { name: true, email: true } },
        },
        orderBy: { date: "desc" },
        take: limit as number,
      });

      if (accountId) {
        return entries
          .filter((e) => e.lines.some((l) => l.accountId === accountId))
          .slice(0, limit)
          .map((e) => ({
            id: e.id,
            number: e.number,
            date: e.date,
            description: e.description,
            descriptionAr: e.descriptionAr,
            createdBy: e.createdBy?.name ?? e.createdBy?.email,
            lines: e.lines.map((l) => ({
              account: `${l.account.code} ${l.account.name}`,
              debit: Number(l.debit),
              credit: Number(l.credit),
            })),
          }));
      }

      return entries.map((e) => ({
        id: e.id,
        number: e.number,
        date: e.date,
        description: e.description,
        descriptionAr: e.descriptionAr,
        createdBy: e.createdBy?.name ?? e.createdBy?.email,
        lines: e.lines.map((l) => ({
          account: `${l.account.code} ${l.account.name}`,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      }));
    },
  }) as any,

  getAccountBalance: dynamicTool({
    description: "Get the current balance of a specific account by its name or code.",
    inputSchema: z.object({
      accountName: z.string().describe("Account name or code to search for"),
    }),
    execute: async ({ accountName }: any) => {
      const account = await prisma.account.findFirst({
        where: {
          organizationId: orgId,
          OR: [
            { name: { contains: accountName } },
            { code: accountName } as any,
          ],
        },
      });

      if (!account) {
        const similar = await prisma.account.findMany({
          where: { organizationId: orgId },
          take: 5,
        });
        return {
          error: `Account "${accountName}" not found`,
          similarAccounts: similar.map((a) => `${a.code} ${a.name}`),
        };
      }

      return {
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        balance: Number(account.balance),
      };
    },
  }) as any,

  createJournalEntry: dynamicTool({
    description: "CREATE a journal entry in the accounting system. Use ONLY after the user has explicitly reviewed and confirmed the proposed debit/credit entries. ALWAYS log to audit.",
    inputSchema: z.object({
      date: z.string().describe("Entry date ISO string (YYYY-MM-DD)"),
      description: z.string().describe("English description of the entry"),
      descriptionAr: z.string().optional().describe("Arabic description of the entry"),
      lines: z.array(z.object({
        accountId: z.string().describe("The Account ID (not code) to debit/credit"),
        description: z.string().optional(),
        debit: z.number().nonnegative(),
        credit: z.number().nonnegative(),
      })).min(2),
    }),
    execute: async ({ date, description, descriptionAr, lines }: any) => {
      const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0);
      const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return { error: `Debits (${totalDebit}) must equal credits (${totalCredit})` };
      }

      const lastEntry = await prisma.journalEntry.findFirst({
        where: { organizationId: orgId },
        orderBy: { number: "desc" },
        select: { number: true },
      });

      const entry = await prisma.journalEntry.create({
        data: {
          number: (lastEntry?.number ?? 0) + 1,
          date: new Date(date),
          description,
          descriptionAr,
          organizationId: orgId,
          createdById: userId,
          status: "POSTED",
          lines: {
            create: lines.map((l: any) => ({
              accountId: l.accountId,
              description: l.description,
              debit: l.debit,
              credit: l.credit,
            })),
          },
        },
        include: { lines: { include: { account: true } } },
      });

      await createAuditLog({
        organizationId: orgId,
        userId,
        action: "AI_CREATE",
        entity: "JournalEntry",
        entityId: entry.id,
        newValue: {
          number: entry.number,
          description: entry.description,
          lines: entry.lines.map((l) => ({
            account: `${l.account.code} ${l.account.name}`,
            debit: Number(l.debit),
            credit: Number(l.credit),
          })),
        },
      });

      logger.info({ entryId: entry.id, userId }, "AI created journal entry");

      return {
        success: true,
        entryNumber: entry.number,
        entryId: entry.id,
        lines: entry.lines.map((l) => ({
          account: `${l.account.code} ${l.account.name}`,
          debit: Number(l.debit),
          credit: Number(l.credit),
        })),
      };
    },
  }) as any,
});