"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/tables/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Employee = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  basicSalary: number;
  allowances: number;
  gosiContribution: number;
  iqamaNumber: string | null;
  bankAccountNumber: string | null;
  active: boolean;
};

type Props = { employees: Employee[] };

export function EmployeesClient({ employees }: Props) {
  const t = useTranslations("employees");
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", position: "", basicSalary: "", allowances: "", gosiContribution: "", iqamaNumber: "", bankAccountNumber: "" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances), gosiContribution: Number(form.gosiContribution) }),
      });
      if (res.ok) { setShowAdd(false); router.refresh(); }
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    { key: "name", label: t("name"), render: (e: Employee) => e.name },
    { key: "position", label: t("position"), render: (e: Employee) => e.position ?? "-" },
    { key: "email", label: t("email"), render: (e: Employee) => e.email ?? "-" },
    { key: "phone", label: t("phone"), render: (e: Employee) => e.phone ?? "-" },
    { key: "basicSalary", label: t("basicSalary"), render: (e: Employee) => formatCurrency(e.basicSalary) },
    { key: "allowances", label: t("allowances"), render: (e: Employee) => formatCurrency(e.allowances) },
    { key: "active", label: t("status"), render: (e: Employee) => e.active ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="outline">{t("inactive")}</Badge> },
  ];

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("employees", { count: employees.length })}
        actions={
          <Button onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 ms-1" /> {t("addEmployee")}</Button>
        }
      />

      <DataTable columns={columns} data={employees} searchable searchPlaceholder={t("searchPlaceholder")} onRowClick={(e) => router.push(`/payroll/employees/${(e as any).id}`)} exportable exportFilename="employees" />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("dialogTitle")}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <Input label={t("position")} value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t("basicSalary")} type="number" value={form.basicSalary} onChange={(e) => setForm({ ...form, basicSalary: e.target.value })} />
            <Input label={t("allowances")} type="number" value={form.allowances} onChange={(e) => setForm({ ...form, allowances: e.target.value })} />
            <Input label={t("gosi")} type="number" value={form.gosiContribution} onChange={(e) => setForm({ ...form, gosiContribution: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t("iqamaNumber")} value={form.iqamaNumber} onChange={(e) => setForm({ ...form, iqamaNumber: e.target.value })} />
            <Input label={t("bankAccount")} value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
            <Button type="submit" disabled={loading}>{loading ? t("saving") : t("save")}</Button>
          </div>
        </form>
      </Dialog>
    </div>
    </FadeIn>
  );
}
