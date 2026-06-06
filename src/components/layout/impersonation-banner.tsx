"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";

export function ImpersonationBanner() {
  const t = useTranslations("ownerPanel");
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie
      .split("; ")
      .find(row => row.startsWith("impersonation_banner="));
    if (match) {
      try {
        const value = decodeURIComponent(match.split("=")[1]);
        setOrgName(JSON.parse(value).name);
      } catch {}
    }
  }, []);

  if (!orgName) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm text-amber-800 flex items-center justify-between">
      <span>{t("impersonating")} <strong>{orgName}</strong></span>
      <Button
        size="sm"
        variant="outline"
        className="border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={async () => {
          const res = await fetch("/api/owner/impersonate/exit", { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            window.location.href = data.redirectTo;
          }
        }}
      >
        <LogOut className="h-3 w-3 ms-1" />
        {t("exitImpersonation")}
      </Button>
    </div>
  );
}
