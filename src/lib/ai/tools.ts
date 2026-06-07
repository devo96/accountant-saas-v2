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
      if (keyword) where.description = { contains: keyword };
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
            id: e.id, number: e.number, date: e.date, description: e.description,
            amount: Number(e.amount),
            lines: e.lines.map((l) => ({ accountCode: l.account.code, accountName: l.account.name, amount: Number(l.amount) })),
          }));
      }

      return expenses.map((e) => ({
        id: e.id, number: e.number, date: e.date, description: e.description,
        amount: Number(e.amount),
        lines: e.lines.map((l) => ({ accountCode: l.account.code, accountName: l.account.name, amount: Number(l.amount) })),
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

      const mapEntry = (e: any) => ({
        id: e.id, number: e.number, date: e.date, description: e.description,
        descriptionAr: e.descriptionAr,
        createdBy: e.createdBy?.name ?? e.createdBy?.email,
        lines: e.lines.map((l: any) => ({ account: `${l.account.code} ${l.account.name}`, debit: Number(l.debit), credit: Number(l.credit) })),
      });

      if (accountId) return entries.filter((e) => e.lines.some((l) => l.accountId === accountId)).slice(0, limit).map(mapEntry);
      return entries.map(mapEntry);
    },
  }) as any,

  getAccountBalance: dynamicTool({
    description: "Get the current balance of a specific account by its name or code.",
    inputSchema: z.object({
      accountName: z.string().describe("Account name or code to search for"),
    }),
    execute: async ({ accountName }: any) => {
      const account = await prisma.account.findFirst({
        where: { organizationId: orgId, OR: [{ name: { contains: accountName } }, { code: accountName } as any] },
      });

      if (!account) {
        const similar = await prisma.account.findMany({ where: { organizationId: orgId }, take: 5 });
        return { error: `Account "${accountName}" not found`, similarAccounts: similar.map((a) => `${a.code} ${a.name}`) };
      }

      return { code: account.code, name: account.name, type: account.type, nature: account.nature, balance: Number(account.balance) };
    },
  }) as any,

  triggerAdminUnlearnedAlert: dynamicTool({
    description: "REPORT that you cannot answer the user's question. Call this ONLY when you genuinely cannot find the data to answer. This sends an alert to the owner/admin dashboard so they can improve the service.",
    inputSchema: z.object({
      question: z.string().describe("The user's exact question that you could not answer"),
      reason: z.string().optional().describe("Brief reason why you couldn't answer (e.g. 'data not found', 'feature not supported')"),
    }),
    execute: async ({ question, reason }: any) => {
      const { triggerAdminUnlearnedAlert: alertFn } = await import("@/lib/ai/unlearned-alert");
      await alertFn(orgId, userId, question + (reason ? ` (${reason})` : ""));
      return { alerted: true, message: "تم إرسال تنبيه للمطورين لتحسين الخدمة." };
    },
  }) as any,

  createDraftEntry: dynamicTool({
    description: "CREATE a draft journal entry or sales document. This does NOT save to the accounting system. It creates a DRAFT that the user must review and approve. Use this for all creation requests (journal entries, sales invoices, etc.).",
    inputSchema: z.object({
      actionType: z.enum(["JOURNAL_ENTRY", "SALES_INVOICE", "EXPENSE"]).describe("Type of document to create"),
      summary: z.string().describe("Arabic summary of what will be created, shown to user for review"),
      payload: z.object({
        date: z.string(),
        description: z.string().optional(),
        lines: z.array(z.object({
          accountId: z.string(),
          description: z.string().optional(),
          debit: z.number().nonnegative(),
          credit: z.number().nonnegative(),
        })).min(1),
      }),
    }),
    execute: async ({ actionType, summary, payload }: any) => {
      if (actionType === "JOURNAL_ENTRY" && payload?.lines) {
        const totalDebit = payload.lines.reduce((s: number, l: any) => s + (Number(l.debit) || 0), 0);
        const totalCredit = payload.lines.reduce((s: number, l: any) => s + (Number(l.credit) || 0), 0);
        const diff = Math.abs(totalDebit - totalCredit);
        if (diff > 0.001) {
          logger.warn({ totalDebit, totalCredit, diff }, "Unbalanced journal entry draft rejected");
          return { error: "غير متوازن: مجموع المدين لا يساوي مجموع الدائن. الرجاء إعادة المحاولة بأرقام صحيحة.", unbalanced: true, totalDebit, totalCredit };
        }
      }

      const draft = await prisma.aiActionDraft.create({
        data: {
          organizationId: orgId,
          userId,
          actionType,
          summary,
          payload: payload as any,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await createAuditLog({
        organizationId: orgId, userId,
        action: "AI_DRAFT_CREATED", entity: "AiActionDraft",
        entityId: draft.id,
        newValue: { actionType, summary: summary.slice(0, 200) },
      });

      logger.info({ draftId: draft.id, userId, actionType }, "AI created draft");

      return { draftId: draft.id, summary, actionType };
    },
  }) as any,
});
