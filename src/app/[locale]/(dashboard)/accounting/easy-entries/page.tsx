import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { Calculator, ArrowRightLeft, FileText, DollarSign, ShoppingCart, Receipt, Landmark, PiggyBank, Calendar } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

const templates = [
  { icon: DollarSign, label: "قيود المبيعات", description: "تسجيل إيرادات المبيعات", color: "text-green-600" },
  { icon: ShoppingCart, label: "قيود المشتريات", description: "تسجيل مصروفات المشتريات", color: "text-primary-600" },
  { icon: Receipt, label: "سداد مصروفات", description: "تسجيل مصروف تشغيلي", color: "text-orange-600" },
  { icon: Landmark, label: "سند قبض", description: "تسجيل مبلغ مستلم", color: "text-purple-600" },
  { icon: Calculator, label: "تسوية", description: "تسوية بين الحسابات", color: "text-teal-600" },
  { icon: PiggyBank, label: "إيداع بنكي", description: "تسجيل إيداع بنكي", color: "text-emerald-600" },
  { icon: ArrowRightLeft, label: "تحويل", description: "تحويل أموال بين الحسابات", color: "text-primary-600" },
  { icon: Calendar, label: "مصروفات مقدمة", description: "تسجيل مصروفات مدفوعة مقدماً", color: "text-rose-600" },
];

export default async function EasyEntriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) redirect("/auth/login");

  const tnav = await getTranslations("nav");
  const orgId = session.user.organizationId;

  const recentEntries = await prisma.journalEntry.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      createdBy: true,
      lines: { take: 2 },
    },
  });

  return (
    <FadeIn>
      <PageHeader
        title={tnav("easyEntries")}
        description="إنشاء قيود محاسبية بسرعة باستخدام قوالب مبسطة"
      />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {templates.map((t) => (
          <Link key={t.label} href="/accounting/journal-entries/new" className="block">
            <Card className="cursor-pointer hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${t.color}`}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            آخر قيود اليومية
          </CardTitle>
        </CardHeader>
        {recentEntries.length === 0 ? (
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calculator className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">لا توجد قيود بعد</h3>
              <p className="text-sm text-gray-500">استخدم القوالب أعلاه لإنشاء أول قيد سهل</p>
            </div>
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الوصف</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>بواسطة</TableHead>
                <TableHead>البنود</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEntries.map((e) => {
                const totalDebit = e.lines.reduce((s, l) => s + Number(l.debit), 0);
                const totalCredit = e.lines.reduce((s, l) => s + Number(l.credit), 0);
                return (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-sm">{e.number}</TableCell>
                    <TableCell className="text-gray-500">{formatDate(e.date)}</TableCell>
                    <TableCell className="max-w-[250px] truncate font-medium">{e.description}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "POSTED" ? "success" : "warning"}>
                        {e.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{e.createdBy?.name || "-"}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {e.lines.length} بند · م: {formatCurrency(totalDebit)} · د: {formatCurrency(totalCredit)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </FadeIn>
  );
}
