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
