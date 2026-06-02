"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ZatcaSettingsPage() {
  const t = useTranslations("zatcaSettings");
  const ct = useTranslations("common");
  const [settings, setSettings] = useState({
    zatca_environment: "sandbox",
    zatca_csid_id: "",
    zatca_csid_secret: "",
    zatca_certificate: "",
    zatca_private_key: "",
    zatca_public_key: "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/zatca/settings")
      .then((r) => r.json())
      .then((data) => setSettings((prev) => ({ ...prev, ...data })));
  }, []);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/zatca/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <Select
        label={t("environment")}
        options={[
          { value: "sandbox", label: "Sandbox" },
          { value: "production", label: "Production" },
        ]}
        value={settings.zatca_environment}
        onChange={(e) => setSettings({ ...settings, zatca_environment: e.target.value })}
      />

      <Input label={t("csidId")} value={settings.zatca_csid_id} onChange={(e) => setSettings({ ...settings, zatca_csid_id: e.target.value })} />
      <Input label={t("csidSecret")} type="password" value={settings.zatca_csid_secret} onChange={(e) => setSettings({ ...settings, zatca_csid_secret: e.target.value })} />
      <Input label={t("certificate")} value={settings.zatca_certificate} onChange={(e) => setSettings({ ...settings, zatca_certificate: e.target.value })} />
      <Input label={t("privateKey")} type="password" value={settings.zatca_private_key} onChange={(e) => setSettings({ ...settings, zatca_private_key: e.target.value })} />
      <Input label={t("publicKey")} value={settings.zatca_public_key} onChange={(e) => setSettings({ ...settings, zatca_public_key: e.target.value })} />

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>{saving ? ct("saving") : ct("save")}</Button>
        {saved && <span className="text-sm text-green-600">{ct("sent")}</span>}
      </div>
    </div>
  );
}
