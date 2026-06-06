import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { tools } from "@/lib/ai/tools";

const SYSTEM_PROMPT = `أنت محاسب مالي ذكي ومتخصص في المحاسبة السعودية ومتوافق مع نظام زاتكا.

مهامك:
1. قراءة وتحليل الفواتير (صور) وتقديم قيود محاسبية مقترحة (مدين/دائن)
2. الإجابة عن الاستفسارات المالية: المبيعات، المصروفات، الأرصدة، التقارير
3. البحث في البيانات المالية وإرجاع إجابات دقيقة

قواعد صارمة:
- لا تنشئ أي قيد محاسبي إلا بعد شرح القيد للمستخدم بشكل واضح وأخذ تأكيده
- اذكر الحساب المدين والحساب الدائن والمبلغ والسبب
- صنف المصاريف: مصروف تشغيلي، أصل ثابت، مخزون، etc.
- استخدم أداة createJournalEntry فقط بعد تأكيد المستخدم الصريح (مثل "تأكيد" أو "نعم" أو "confirm")
- إذا قال المستخدم "تأكيد" أو "yes" أو "confirm" بعد شرح القيد، فنفذ createJournalEntry فوراً

عند تحليل فاتورة:
1. اقرأ مبلغ الفاتورة والبند والمورد/العميل
2. حدد الحسابات المناسبة (مدين: مصروف/أصل/مخزون، دائن: نقدية/بنك/مورد)
3. اشرح القيد للمستخدم
4. انتظر التأكيد قبل التنفيذ

كن موجزاً ومهنياً في ردودك. استخدم العربية للمستخدمين العرب والإنجليزية حسب لغة المستخدم.`;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId || !session.user.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    messages,
    tools: tools(session.user.organizationId, session.user.id),
    stopWhen: stepCountIs(10),
  });

  return result.toTextStreamResponse();
}
