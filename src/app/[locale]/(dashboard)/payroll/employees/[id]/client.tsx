"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { ArrowLeft, Edit } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type Employee = {
  id: string; name: string; nameAr: string | null; email: string | null;
  phone: string | null; position: string | null; basicSalary: number;
  allowances: number; gosiContribution: number; iqamaNumber: string | null;
  bankAccountNumber: string | null; active: boolean;
};

type Props = { employee: Employee };

export function EmployeeDetailClient({ employee }: Props) {
  const router = useRouter();
  const t = useTranslations("employees");
  const [showEdit, setShowEdit] = useState(false);
  const [form, setForm] = useState({
    name: employee.name,
    nameAr: employee.nameAr ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    position: employee.position ?? "",
    basicSalary: String(employee.basicSalary),
    allowances: String(employee.allowances),
    gosiContribution: String(employee.gosiContribution),
    iqamaNumber: employee.iqamaNumber ?? "",
    bankAccountNumber: employee.bankAccountNumber ?? "",
  });
  const [loading, setLoading] = useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances), gosiContribution: Number(form.gosiContribution) }),
      });
      if (res.ok) { setShowEdit(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/payroll/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{employee.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t("employeeInfo")}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowEdit(true)}><Edit className="h-4 w-4 ms-1" /> {t("edit")}</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 max-w-2xl">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t("employeeInfo")}</h3>
        <dl className="space-y-3">
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("name")}</dt>
            <dd className="font-medium">{employee.name}</dd>
          </div>
          {employee.nameAr && (
            <div className="flex justify-between">
              <dt className="text-gray-500 dark:text-gray-400">{t("nameAr")}</dt>
              <dd className="font-medium">{employee.nameAr}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("position")}</dt>
            <dd className="font-medium">{employee.position ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("email")}</dt>
            <dd className="font-medium">{employee.email ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("phone")}</dt>
            <dd className="font-medium">{employee.phone ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("basicSalary")}</dt>
            <dd className="font-medium">{employee.basicSalary.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("allowances")}</dt>
            <dd className="font-medium">{employee.allowances.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("gosi")}</dt>
            <dd className="font-medium">{employee.gosiContribution.toLocaleString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("iqamaNumber")}</dt>
            <dd className="font-medium">{employee.iqamaNumber ?? "-"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{t("bankAccount")}</dt>
            <dd className="font-medium">{employee.bankAccountNumber ?? "-"}</dd>
          </div>
        </dl>
      </div>

      <Dialog open={showEdit} onClose={() => setShowEdit(false)} title={t("editEmployee")}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("nameAr")} value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label={t("position")} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Input label={t("basicSalary")} type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
          <Input label={t("allowances")} type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
          <Input label={t("gosi")} type="number" value={form.gosiContribution} onChange={(e) => setForm({ ...form, gosiContribution: e.target.value })} />
          <Input label={t("iqamaNumber")} value={form.iqamaNumber} onChange={(e) => setForm({ ...form, iqamaNumber: e.target.value })} />
          <Input label={t("bankAccount")} value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowEdit(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
