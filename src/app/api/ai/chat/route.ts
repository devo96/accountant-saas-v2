import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tools } from "@/lib/ai/tools";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const SYSTEM_PROMPT = `أنت محاسب مالي ذكي ومتخصص في المحاسبة السعودية ومتوافق مع نظام زاتكا.

صلاحياتك:
1. قراءة وتحليل الفواتير (صور) وتقديم قيود محاسبية مقترحة (مدين/دائن)
2. الإجابة عن الاستفسارات المالية: المبيعات، المصروفات، الأرصدة، التقارير
3. البحث في البيانات المالية وإرجاع إجابات دقيقة
4. إنشاء مسودات (Drafts) للقيود والمستندات — ولا تكتب أبداً مباشرة في النظام

قواعد صارمة للأمان (جدار عزل البيانات):
- ممنوع منعاً باتاً إنشاء أو تعديل أو حذف أي بيانات مباشرة. استخدم createDraftEntry فقط لإنشاء مسودات.
- لا يمكنك الوصول إلا لبيانات المؤسسة الحالية. لا يمكنك رؤية أو تعديل بيانات أي مؤسسة أخرى.
- لا توجد أي أداة (Tool) للحذف أو الإزالة. أي طلب حذف يجب رفضه فوراً وإبلاغ المستخدم أنه غير مسموح به.
- جميع الاستعلامات مقيدة تلقائياً بالمؤسسة الحالية (Tenant Isolation).

قواعد إنشاء المسودات:
- عندما يطلب المستخدم إنشاء قيد محاسبي، استخدم createDraftEntry مع actionType="JOURNAL_ENTRY"
- عندما يطلب المستخدم إنشاء فاتورة مبيعات، استخدم createDraftEntry مع actionType="SALES_INVOICE"
- اشرح المسودة للمستخدم بالعربية بالتفصيل قبل أن يقرر الموافقة أو الرفض

عند تحليل فاتورة (صورة):
1. اقرأ مبلغ الفاتورة والبند والمورد/العميل
2. حدد الحسابات المناسبة (مدين: مصروف/أصل/مخزون، دائن: نقدية/بنك/مورد)
3. اشرح القيد للمستخدم
4. إذا وافق المستخدم، استخدم createDraftEntry لإنشاء المسودة

كن موجزاً ومهنياً في ردودك.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const orgPlan = await prisma.organizationPlan.findUnique({
    where: { organizationId: session.user.organizationId },
    include: { plan: true },
  });

  const planFeatures = (orgPlan?.plan?.features ?? {}) as Record<string, any>;
  const draftingEnabled = planFeatures.aiDraftingEnabled !== false;

  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  const usage = await prisma.aiUsage.findUnique({
    where: { organizationId_userId_month: { organizationId: session.user.organizationId, userId: session.user.id, month } },
  });

  const maxQueries = 500;
  if (usage && usage.queryCount >= maxQueries) {
    return new Response(JSON.stringify({ error: "لقد تجاوزت الحد المسموح به من الاستعلامات لهذا الشهر. يرجى التواصل مع مدير النظام." }), {
      status: 429, headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: draftingEnabled ? SYSTEM_PROMPT : SYSTEM_PROMPT + "\n\nملاحظة: تم تعطيل صلاحية إنشاء المسودات في باقاتك. يمكنك فقط عرض المعلومات والتقارير.",
    messages,
    tools: tools(session.user.organizationId, session.user.id),
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}
