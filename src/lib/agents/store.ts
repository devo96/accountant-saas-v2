import { prisma } from "@/lib/prisma";

/**
 * Agent Control Room — shared coordination layer for the multi-agent team.
 * Agents write here via the API (authorized by x-agent-secret); the dashboard
 * page reads here; the user replies from the same page. This DB is the
 * "shared memory" / live message bus between all agents and the user.
 */

export type MemberSeed = {
  key: string;
  name: string;
  role: string;
  emoji: string;
};

type TaskSeed = {
  title: string;
  description: string;
  assignee: string;
  status: string;
  order: number;
  etaMinutes: number | null;
};

/** The fixed roster of the agent team. */
export const DEFAULT_MEMBERS: MemberSeed[] = [
  { key: "manager", name: "المدير", role: "منسّق الفريق · يوزّع المهام ويراجع التسليم", emoji: "🧭" },
  { key: "backend", name: "وكيل الـ Backend", role: "Prisma · API · منطق المحاسبة (الترحيل، القيود)", emoji: "🛠️" },
  { key: "frontend", name: "وكيل الـ Frontend", role: "الصفحات · النماذج · الترجمة · التصميم", emoji: "🎨" },
  { key: "tester", name: "المحاسب المجرّب", role: "يشغّل النظام ويتأكد من صحة الأرقام فعلياً", emoji: "🧪" },
  { key: "ux", name: "مراجع التجربة", role: "الاعتراضات · تحسين UX · النواقص", emoji: "🔎" },
];

/** Check that an incoming request carries the shared agent secret. */
export function agentAuthorized(req: Request): boolean {
  const secret = (process.env.AGENT_SECRET || process.env.CRON_SECRET || "").trim();
  if (!secret) return false;
  const header = (req.headers.get("x-agent-secret") || "").trim();
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return header === secret || bearer === secret;
}

const DEFAULT_TASKS: TaskSeed[] = [
  { title: "ترحيل تلقائي بقيد $transaction", description: "postSalesInvoice / postPurchaseInvoice / postExpense كلها ضمن prisma.$transaction مع threading الـ tx للـ helpers", assignee: "backend", status: "DONE", order: 1, etaMinutes: null },
  { title: "مخزون — COGS + حركة مخزون", description: "SALES_DELIVERY / PURCHASE_RECEIPT مع تحديث currentStock و costPrice (متوسط مرجّح)", assignee: "backend", status: "DONE", order: 2, etaMinutes: null },
  { title: "Zod validation — 21 schema لكل الـ routes", description: "validate() (POST) + validatePartial() (PUT) لجميع الـ 21 entity schema و 34 route", assignee: "backend", status: "DONE", order: 3, etaMinutes: null },
  { title: "إصلاح double-counting في الموازنة", description: "تقارير balance-sheet / income-statement / trial-balance / dashboard كانت تجمع posted JE lines فوق account.balance — صار يستخدم account.balance مباشرة", assignee: "backend", status: "DONE", order: 4, etaMinutes: null },
  { title: "إقفال الفترات المالية", description: "PATCH isClosed + createJournalEntry يمنع الكتابة في سنة مقفلة + UI toggle", assignee: "backend", status: "DONE", order: 5, etaMinutes: null },
  { title: "حدود الباقات + صلاحيات", description: "checkPlanLimit() لـ maxUsers/maxInvoices/maxItems + ربط Employee ب User عبر userId (يحتاج تشغيل prisma migrate dev يدوي)", assignee: "backend", status: "DONE", order: 6, etaMinutes: null },
  { title: "تحقق tester من الميزانية", description: "bug map item 3 — تأكد أن أرقام balance sheet / income statement / trial-balance صحيحة بعد إصلاح double-counting", assignee: "tester", status: "TODO", order: 7, etaMinutes: 30 },
  { title: "تشغيل prisma migrate dev", description: "إضافة userId لجدول Employee عبر npx prisma migrate dev --name add_user_id_to_employee", assignee: "manager", status: "TODO", order: 8, etaMinutes: 10 },
  { title: "إصلاح proxy middleware", description: "intlMiddleware يسبّب 404 للـ API routes — الحل: NextResponse.next() بدل intlMiddleware على الـ API routes", assignee: "backend", status: "DONE", order: 9, etaMinutes: null },
  { title: "غرفة التحكم بالوكلاء", description: "صفحة agents تظهر الـ state من الـ API مباشرة — تحتاج locale-prefixed URLs عشان تتجنب redirect", assignee: "backend", status: "IN_PROGRESS", order: 10, etaMinutes: 15 },
  { title: "توثيق PROJECT_MAP", description: "تحديث bug map و orphans بعد كل جلسة عمل", assignee: "manager", status: "DONE", order: 11, etaMinutes: null },
];

/** Seed the member roster (idempotent) and make sure there is an active run. */
export async function ensureSeeded() {
  for (const m of DEFAULT_MEMBERS) {
    await prisma.agentMember.upsert({
      where: { key: m.key },
      update: { name: m.name, role: m.role, emoji: m.emoji },
      create: { key: m.key, name: m.name, role: m.role, emoji: m.emoji },
    });
  }
  let run = await prisma.agentRun.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!run) {
    run = await prisma.agentRun.create({
      data: {
        title: "إصلاح نظام المحاسبة — مطابقة قيود",
        goal: "ربط الفواتير والمصروفات والمخزون بالقيود والأرصدة والموازنة، وإصلاح الصلاحيات والترجمة.",
        status: "ACTIVE",
      },
    });
  }
  // Seed default tasks (idempotent — by title + runId)
  for (const t of DEFAULT_TASKS) {
    const existing = await prisma.agentTask.findFirst({
      where: { runId: run.id, title: t.title },
    });
    if (!existing) {
      await prisma.agentTask.create({
        data: { runId: run.id, ...t },
      });
    }
  }
  return run;
}

/** Full snapshot for the dashboard. */
export async function getState() {
  const run = await ensureSeeded();
  const [members, tasks, messages] = await Promise.all([
    prisma.agentMember.findMany({ orderBy: { key: "asc" } }),
    prisma.agentTask.findMany({
      where: { runId: run.id },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    }),
    prisma.agentMessage.findMany({
      where: { runId: run.id },
      orderBy: { createdAt: "asc" },
      take: 300,
    }),
  ]);
  return { run, members, tasks, messages };
}
