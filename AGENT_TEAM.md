# فريق الوكلاء (Agent Team) — بروتوكول العمل

نظام متعدّد الوكلاء يصلّح ويطوّر هذا المشروع. **الذاكرة المشتركة وقناة التواصل** هي قاعدة
بيانات غرفة التحكم (نماذج `AgentRun / AgentMember / AgentTask / AgentMessage`)، وتظهر مباشرة
على صفحة `/{locale}/agents` المنشورة على Vercel. المستخدم يتابع ويردّ من نفس الصفحة.

## الروستر (الأدوار)

| المفتاح | الاسم | المسؤولية |
|--------|------|-----------|
| `manager` | المدير | يوزّع المهام، يراجع التسليم، لا يعلن "DONE" إلا بعد تحقق `tester` |
| `backend` | الـ Backend | Prisma، API، منطق المحاسبة (الترحيل، القيود، المخزون) |
| `frontend` | الـ Frontend | الصفحات، النماذج، الترجمة، التصميم |
| `tester` | المحاسب المجرّب | يشغّل النظام فعلياً ويتأكد من صحة الأرقام (له أنياب) |
| `ux` | مراجع التجربة | الاعتراضات، تحسين UX، رصد النواقص |

## القاعدة الذهبية (verification-first)

> لا يُعتبر أي عمل **"DONE"** إلا بعد أن يشغّل `tester` التدفّق الفعلي ويثبت بالأرقام أنه يعمل.
> "ادّعاء الإنجاز" بدون اختبار ممنوع — هذا بالضبط ما أنتج الفجوة بين `PROJECT_MAP.md` والواقع.

عند تأكيد التسليم: `backend`/`frontend` ينقل المهمة إلى `NEEDS_USER` فقط لو احتاج قراراً، وإلا
يسلّم لـ `tester` (`HANDOFF`). `tester` يثبّت النتيجة برسالة `STATUS` فيها الأرقام، ثم `manager`
ينقل المهمة إلى `DONE`.

## التواصل عبر الـ bus

كل وكيل يستخدم `scripts/agent-bus.mjs` (يكتب في الذاكرة المشتركة وتظهر على الصفحة):

```bash
# حالة كاملة
node scripts/agent-bus.mjs state

# رسالة في الدردشة (CHAT | STATUS | HANDOFF | QUESTION | ANSWER)
node scripts/agent-bus.mjs msg backend STATUS "ربطت ترحيل فاتورة المبيعات بالقيد. جاهز للاختبار."

# سؤال يحتاج ردّ المستخدم (يعمل منشن وينتظر)
node scripts/agent-bus.mjs msg manager QUESTION "أي طريقة تسعير مخزون تفضّل: المتوسط المرجّح أم FIFO؟" --mention

# مهام
node scripts/agent-bus.mjs task-add backend 45 "ترحيل فاتورة المبيعات إلى قيد" "مدين العميل / دائن المبيعات + الضريبة"
node scripts/agent-bus.mjs task-set <taskId> IN_PROGRESS
node scripts/agent-bus.mjs task-set <taskId> DONE

# حالة العضو (تظهر بطاقته على الصفحة)
node scripts/agent-bus.mjs status backend WORKING "ترحيل فاتورة المبيعات"

# استطلاع رسائل المستخدم الجديدة (polling)
node scripts/agent-bus.mjs inbox 2026-06-09T00:00:00Z
```

## انتظار المستخدم (mention & wait)

لما يحتاج وكيل متطلباً لا بد أن يأتي من المستخدم: يرسل رسالة `QUESTION` مع `--mention`، ويضع حالته
`WAITING_USER` والمهمة `NEEDS_USER`، ثم **يتوقف** عن ذلك المسار. الصفحة تُظهر بانر "وكيل ينتظر ردّك".
عند ردّ المستخدم من الصفحة، تُغلق الأسئلة تلقائياً وترجع الحالات إلى `WORKING`، ويلتقط الوكيل الردّ
عبر `inbox` ويكمل.

## الأمان والنشر

- التعديلات على **نفس المشروع** (لا مشروع جديد).
- `commit` + `push` إلى GitHub (`origin/main`) للرجوع لأي نسخة عند الكوارث.
- `deploy` إلى Vercel (`npx vercel --prod`).
- الكتابة في الـ bus محميّة بـ `x-agent-secret` (يعيد استخدام `CRON_SECRET` الموجود على Vercel).

## خارطة المشاكل الحقيقية (ابدأ من الأعلى)

مبنية على فحص الكود الفعلي (وليس `PROJECT_MAP.md` المتفائل):

1. **لا ترحيل تلقائي (الجذر):** فواتير المبيعات/المشتريات والمصروفات تُحفظ بدون إنشاء قيد يومية،
   فلا تتأثر الأرصدة ولا الموازنة ولا التقارير. الملفات: `src/domains/sales/invoice.ts`،
   `src/domains/purchases/invoice.ts`، `src/app/api/expenses/route.ts`. المحرّك الجاهز:
   `src/domains/accounting/journal.ts` (`createJournalEntry`) + `gl.ts` (`syncJournalEntryBalances`).
2. **المخزون:** لا حركة مخزون ولا تكلفة بضاعة مباعة عند البيع/الشراء.
3. **الموازنة:** تقرأ القيود `POSTED` فقط — تظهر فارغة لغياب الترحيل (تُحل تلقائياً بعد البند 1).
4. **الصلاحيات:** مفروضة في 5 من 97 route فقط؛ حدود الباقات (`maxUsers/maxInvoices/maxItems`)
   غير مفروضة؛ `Employee` غير مربوط بـ `User`.
5. **الترجمة/الحقول:** نصوص hardcoded متفرقة؛ لا توجد Zod schemas مركزية.
6. **ميزات قيود المقفلة (اشتراك):** نبني بديلاً مناسباً للمحاسب المالي بدل قفلها.
