"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { useTranslations } from "next-intl";

export function PrintButton({ label: _label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <Button variant="outline" onClick={() => window.print()}>
      <Printer className="h-4 w-4 ms-1" /> {_label ?? t("print")}
    </Button>
  );
}
