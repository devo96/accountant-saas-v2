"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Organization = { id: string; name: string; nameAr: string | null; email: string | null; phone: string | null; address: string | null; commercialReg: string | null; taxNumber: string | null; createdAt: string };
type Props = { org: Organization; settings: Record<string, string> };

const smtpKeys = ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"];

export function OrganizationSettingsClient({ org, settings: initialSettings }: Props) {
  const router = useRouter();
  const t = useTranslations("orgSettings");
  const [form, setForm] = useState(org);
  const [settings, setSettings] = useState(initialSettings);
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/organizations/${org.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  }

  async function saveSettings() {
    setSettingsSaving(true);
    const res = await fetch("/api/organization-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    setSettingsSaving(false);
  }

  function updateSetting(key: string, value: string) {
    setSettings({ ...settings, [key]: value });
  }

  function addSetting() {
    if (!newKey) return;
    setSettings({ ...settings, [newKey]: newVal });
    setNewKey("");
    setNewVal("");
  }

  async function sendTestEmail() {
    setTestStatus("");
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: form.email || "test@example.com", subject: "Test Email", html: "<p>This is a test email from your accounting system.</p>" }),
    });
    setTestStatus(res.ok ? t("testEmailSent") : (await res.json()).error);
  }

  return (
    <FadeIn>
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label={t("orgName")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label={t("nameAr")} value={form.nameAr ?? ""} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
        <Input label={t("email")} type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label={t("phone")} value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label={t("address")} value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label={t("crNumber")} value={form.commercialReg ?? ""} onChange={(e) => setForm({ ...form, commercialReg: e.target.value })} />
        <Input label={t("taxNumber")} value={form.taxNumber ?? ""} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} />
        <Button type="submit" disabled={saving}>{saving ? t("saving") : saved ? t("saved") : t("saveChanges")}</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>{t("emailSettings")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label={t("smtpHost")} value={settings.smtp_host ?? ""} onChange={(e) => updateSetting("smtp_host", e.target.value)} placeholder="smtp.gmail.com" />
          <Input label={t("smtpPort")} value={settings.smtp_port ?? "587"} onChange={(e) => updateSetting("smtp_port", e.target.value)} placeholder="587" />
          <Input label={t("smtpUser")} value={settings.smtp_user ?? ""} onChange={(e) => updateSetting("smtp_user", e.target.value)} placeholder="user@gmail.com" />
          <Input label={t("smtpPass")} type="password" value={settings.smtp_pass ?? ""} onChange={(e) => updateSetting("smtp_pass", e.target.value)} />
          <Input label={t("smtpFrom")} value={settings.smtp_from ?? ""} onChange={(e) => updateSetting("smtp_from", e.target.value)} placeholder="invoices@company.com" />
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={sendTestEmail}>{t("sendTestEmail")}</Button>
            {testStatus && <span className="text-sm text-gray-600">{testStatus}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("settingsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <Input key={key} label={key} value={value} onChange={(e) => updateSetting(key, e.target.value)} />
          ))}
          <div className="flex items-center gap-2">
            <Input label={t("newSettingKey")} placeholder="key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
            <Input label={t("newSettingValue")} placeholder="value" value={newVal} onChange={(e) => setNewVal(e.target.value)} />
            <Button type="button" variant="outline" className="mt-6" onClick={addSetting}>{t("addSetting")}</Button>
          </div>
          <Button type="button" onClick={saveSettings} disabled={settingsSaving}>{settingsSaving ? t("saving") : t("saveSettings")}</Button>
        </CardContent>
      </Card>
    </div>
    </FadeIn>
  );
}
