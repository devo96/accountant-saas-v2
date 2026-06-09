#!/usr/bin/env node
/**
 * One-off seeder: populates the Control Room with the real backlog and a
 * kickoff conversation so the live board (/agents) is alive on first open.
 * Run once:  node scripts/seed-control-room.mjs
 * Auth + base URL behave exactly like scripts/agent-bus.mjs.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function fromEnv(key) {
  if (process.env[key]) return process.env[key];
  for (const f of [".env.local", ".env"]) {
    try {
      const m = readFileSync(resolve(ROOT, f), "utf8").match(new RegExp(`^${key}=(.*)$`, "m"));
      if (m) { const v = m[1].trim().replace(/^["']|["']$/g, ""); if (v) return v; }
    } catch { /* ignore */ }
  }
  return undefined;
}

const BASE = (process.env.AGENT_BASE_URL || "https://accountant-saas-v2.vercel.app").replace(/\/$/, "");
const SECRET = fromEnv("AGENT_SECRET") || fromEnv("CRON_SECRET");
if (!SECRET) { console.error("Missing AGENT_SECRET/CRON_SECRET"); process.exit(1); }

async function api(path, method, body) {
  const res = await fetch(`${BASE}/api/agents/${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-agent-secret": SECRET },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} on ${path}:`, await res.text()); process.exit(1); }
  return res.json();
}

const tasks = [
  ["backend", "IN_PROGRESS", 60, "ترحيل فاتورة المبيعات إلى قيد يومية", "عند الاعتماد: مدين الذمم المدينة / دائن المبيعات + دائن ضريبة القيمة المضافة. ربط SalesInvoice ↔ JournalEntry."],
  ["backend", "TODO", 60, "ترحيل فاتورة المشتريات إلى قيد", "مدين المشتريات/المخزون + مدين الضريبة / دائن الذمم الدائنة."],
  ["backend", "TODO", 45, "ترحيل المصروفات إلى قيد", "مدين حساب المصروف / دائن النقدية أو الذمم الدائنة، فتتأثر الموازنة."],
  ["backend", "TODO", 75, "حركة المخزون + تكلفة البضاعة المباعة", "إنشاء StockMovement وتحديث الرصيد والتكلفة عند البيع/الشراء."],
  ["backend", "TODO", 40, "فرض الصلاحيات على كل المسارات", "تطبيق requirePermission على المسارات الحساسة (الآن 5 من 97)."],
  ["backend", "TODO", 30, "فرض حدود الباقات", "maxUsers/maxInvoices/maxItems + maxQueries من الباقة بدل القيمة الثابتة 500."],
  ["frontend", "TODO", 30, "إزالة النصوص الـ hardcoded", "نقل رسائل الأخطاء/النجاح في login/register/ai-chat إلى ملفات الترجمة."],
  ["tester", "TODO", 30, "اختبار تدفق المبيعات end-to-end", "إنشاء فاتورة والتأكد من ظهور القيد والرصيد والموازنة بالأرقام الفعلية."],
  ["ux", "TODO", 30, "جرد نواقص الحقول والتصميم", "رصد الحقول المطلوبة المفقودة ومشاكل RTL/التصميم."],
];

const messages = [
  ["manager", "CHAT", false, "بدأنا 🚀 الأولوية القصوى: الترحيل التلقائي — هو جذر معظم المشاكل (الفواتير لا تنشئ قيوداً، فلا تتأثر الأرصدة ولا الموازنة). وزّعت المهام على الفريق."],
  ["manager", "HANDOFF", false, "@backend ابدأ بترحيل فاتورة المبيعات. المحرّك جاهز: createJournalEntry في src/domains/accounting/journal.ts. سلّم لـ tester بعد الانتهاء."],
  ["backend", "STATUS", false, "استلمت ✅ أراجع createSalesInvoice في src/domains/sales/invoice.ts وأربطه بإنشاء القيد عند الاعتماد. أبلغكم عند الجاهزية للاختبار."],
  ["ux", "STATUS", false, "أبدأ جرد النواقص بالتوازي وأرفع الملاحظات هنا أولاً بأول."],
];

const mentionMsg = ["manager", "QUESTION", true, "قبل ترحيل المخزون نحتاج قرارك: أي طريقة لتقييم تكلفة المخزون تفضّل؟ (1) المتوسط المرجّح Weighted Average — الأبسط والأنسب لمعظم المنشآت، أم (2) الوارد أولاً صادر أولاً FIFO؟ اكتب رقم اختيارك هنا."];

for (let i = 0; i < tasks.length; i++) {
  const [assignee, status, eta, title, description] = tasks[i];
  await api("tasks", "POST", { assignee, status, etaMinutes: eta, title, description, order: i });
}
await api("members", "PATCH", { key: "backend", status: "WORKING", currentTask: "ترحيل فاتورة المبيعات" });
await api("members", "PATCH", { key: "manager", status: "WORKING", currentTask: "تنسيق وتوزيع المهام" });
await api("members", "PATCH", { key: "ux", status: "WORKING", currentTask: "جرد النواقص" });
for (const [author, type, mention, content] of messages) {
  await api("messages", "POST", { author, type, mentionsUser: mention, content });
}
await api("messages", "POST", { author: mentionMsg[0], type: mentionMsg[1], mentionsUser: mentionMsg[2], content: mentionMsg[3] });
await api("members", "PATCH", { key: "manager", status: "WAITING_USER", currentTask: "بانتظار قرار طريقة تقييم المخزون" });

console.log("Seeded control room: tasks + kickoff conversation + 1 user mention.");
