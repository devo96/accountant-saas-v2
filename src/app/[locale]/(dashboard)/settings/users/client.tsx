"use client";

import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { getDefaultPermissions } from "@/lib/permissions-shared";

export type User = { id: string; name: string; email: string; role: string; active: boolean; phone: string | null; permissions: Record<string, boolean> | null };
type Props = { users: User[]; currentUserId: string | undefined };

const ALL_PERMISSIONS = [
  "sales.invoices.read", "sales.invoices.create", "sales.invoices.edit", "sales.invoices.delete",
  "sales.quotes.read", "sales.quotes.create", "sales.quotes.edit", "sales.quotes.delete",
  "sales.returns.read", "sales.returns.create", "sales.returns.edit", "sales.returns.delete",
  "purchases.invoices.read", "purchases.invoices.create", "purchases.invoices.edit", "purchases.invoices.delete",
  "purchases.orders.read", "purchases.orders.create", "purchases.orders.edit", "purchases.orders.delete",
  "expenses.read", "expenses.create", "expenses.edit", "expenses.delete",
  "banking.read", "banking.create", "banking.edit", "banking.delete",
  "inventory.read", "inventory.create", "inventory.edit", "inventory.delete",
  "accounting.read", "accounting.create", "accounting.edit", "accounting.delete",
  "payroll.read", "payroll.create", "payroll.edit", "payroll.delete",
  "reports.read", "reports.export",
  "settings.organization.read", "settings.organization.edit",
  "settings.currencies.read", "settings.currencies.edit",
  "settings.tax-codes.read", "settings.tax-codes.edit",
  "settings.users.manage",
  "settings.zatca.read", "settings.zatca.edit",
  "settings.import.access",
];

export function UsersSettingsClient({ users: initialUsers, currentUserId }: Props) {
  const router = useRouter();
  const t = useTranslations("users");
  const [users, setUsers] = useState(initialUsers);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = { name: "", email: "", password: "", role: "ACCOUNTANT" as string, phone: "", active: true, permissions: {} as Record<string, boolean> };
  const [form, setForm] = useState(emptyForm);

  function resetForm() { setForm(emptyForm); }

  async function createUser() {
    if (!form.name || !form.email || !form.password) return;
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const created = await res.json();
      setUsers([...users, created]);
      setShowAdd(false);
      resetForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function updateUser() {
    if (!editing || !form.name || !form.email) return;
    setSaving(true);
    const body: Record<string, unknown> = { name: form.name, email: form.email, role: form.role, active: form.active, phone: form.phone, permissions: form.permissions };
    if (form.password) body.password = form.password;
    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers(users.map((u) => u.id === updated.id ? updated : u));
      setEditing(null);
      resetForm();
      router.refresh();
    }
    setSaving(false);
  }

  async function deleteUser() {
    if (!deleting) return;
    const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers(users.filter((u) => u.id !== deleting.id));
      setDeleting(null);
      router.refresh();
    }
  }

  function startEdit(u: User) {
    setEditing(u);
    const basePerms = u.permissions ?? {};
    setForm({ name: u.name, email: u.email, password: "", role: u.role, phone: u.phone ?? "", active: u.active, permissions: basePerms });
  }

  return (
    <FadeIn>
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("users", { count: users.length })}
        actions={
          <Button onClick={() => { resetForm(); setShowAdd(true); }}><Plus className="h-4 w-4 me-1" />{t("addUser")}</Button>
        }
      />

      <DataTable
        searchable
        columns={[
          { key: "name", label: t("name"), render: (u) => {
            const user = u as unknown as User;
            return <span>{user.name}{user.id === currentUserId ? <Badge variant="outline" className="ms-2">{t("you")}</Badge> : null}</span>;
          }},
          { key: "email", label: t("email") },
          { key: "role", label: t("role"), render: (u) => {
            const role = (u as unknown as User).role;
            return <Badge variant={role === "ADMIN" ? "success" : "default"}>{t("role" + role)}</Badge>;
          }},
          { key: "status", label: t("status"), render: (u) => {
            const active = (u as unknown as User).active;
            return <Badge variant={active ? "success" : "danger"}>{active ? t("active") : t("inactive")}</Badge>;
          }},
          { key: "actions", label: "", render: (u) => {
            const user = u as unknown as User;
            return (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => startEdit(user)}><Pencil className="h-4 w-4" /></Button>
                {user.id !== currentUserId && (
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleting(user)}><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            );
          }},
        ]}
        data={users as unknown as Record<string, unknown>[]}
        exportable exportFilename="users"
      />

      <Dialog open={showAdd} onClose={() => setShowAdd(false)} title={t("addUser")}>
        <div className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t("password")} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("role")}</label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">{t("roleADMIN")}</option>
              <option value="ACCOUNTANT">{t("roleACCOUNTANT")}</option>
              <option value="VIEWER">{t("roleVIEWER")}</option>
            </select>
          </div>
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>{t("cancel")}</Button>
            <Button onClick={createUser} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!editing} onClose={() => setEditing(null)} title={t("editUser")}>
        <div className="space-y-4">
          <Input label={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label={t("email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label={t("password")} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={t("passwordPlaceholder")} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("role")}</label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="ADMIN">{t("roleADMIN")}</option>
              <option value="ACCOUNTANT">{t("roleACCOUNTANT")}</option>
              <option value="VIEWER">{t("roleVIEWER")}</option>
            </select>
          </div>
          <Input label={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {t("active")}
          </label>

          {form.role !== "ADMIN" && (
            <details className="border rounded-lg p-3 text-sm">
              <summary className="cursor-pointer font-medium flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> {t("permissions")}</summary>
              <div className="grid grid-cols-2 gap-1 mt-2 max-h-60 overflow-y-auto">
                {ALL_PERMISSIONS.map((perm) => {
                  const defaultPerms = getDefaultPermissions(form.role as "ADMIN" | "ACCOUNTANT" | "VIEWER");
                  const defaultActive = defaultPerms.some((p) => {
                    if (p === "*") return true;
                    const pp = p.split(".");
                    const rp = perm.split(".");
                    return pp.every((seg, i) => seg === "*" || seg === rp[i]);
                  });
                  const checked = form.permissions[perm] ?? defaultActive;
                  return (
                    <label key={perm} className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={checked} onChange={(e) => setForm({ ...form, permissions: { ...form.permissions, [perm]: e.target.checked } })} />
                      <span className={defaultActive ? "text-gray-900" : "text-gray-500"}>{perm}</span>
                    </label>
                  );
                })}
              </div>
            </details>
          )}
          {form.role === "ADMIN" && (
            <p className="text-xs text-gray-400 flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Admin has all permissions</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>{t("cancel")}</Button>
            <Button onClick={updateUser} disabled={saving}>{saving ? t("saving") : t("save")}</Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} title={t("deleteUser")}>
        {deleting && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">{t("deleteConfirm", { name: deleting.name })}</p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>{t("cancel")}</Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={deleteUser}>{t("delete")}</Button>
          </div>
        </div>
        )}
      </Dialog>
    </div>
    </FadeIn>
  );
}
