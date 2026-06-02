"use client";

import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { generateQrDataUrl } from "@/lib/zatca";

const statusConfig: Record<string, { icon: typeof Clock; label: string; className: string }> = {
  NOT_SUBMITTED: { icon: Clock, label: "Not Submitted", className: "text-gray-500 bg-gray-100" },
  SUBMITTED: { icon: AlertTriangle, label: "Submitted", className: "text-yellow-700 bg-yellow-100" },
  ACCEPTED: { icon: CheckCircle, label: "Accepted", className: "text-green-700 bg-green-100" },
  REJECTED: { icon: XCircle, label: "Rejected", className: "text-red-700 bg-red-100" },
};

export function ZatcaBadge({ status }: { status?: string | null }) {
  const cfg = statusConfig[status ?? "NOT_SUBMITTED"] ?? statusConfig.NOT_SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", cfg.className)}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  );
}

export function ZatcaQrCode({ base64 }: { base64?: string | null }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (base64) {
      generateQrDataUrl(base64).then(setDataUrl).catch(() => setDataUrl(null));
    }
  }, [base64]);

  if (!base64) return null;

  return (
    <div className="rounded-lg border bg-white p-3 text-center">
      <p className="mb-1 text-[10px] font-semibold text-gray-500 uppercase">ZATCA QR</p>
      {dataUrl ? (
        <img src={dataUrl} alt="ZATCA QR Code" className="mx-auto" />
      ) : (
        <div className="h-[150px] flex items-center justify-center text-xs text-gray-400">Loading QR...</div>
      )}
    </div>
  );
}
