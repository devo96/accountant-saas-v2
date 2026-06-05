"use client"; import { useTranslations } from "next-intl"; import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; import { Server, Activity, HardDrive, Shield } from "lucide-react";
type HealthInfo = { status: string; uptime: string; totalOrgs: number; totalUsers: number; activeOrgs: number; totalRevenue: number; auditLast7d: number; auditToday: number; totalDbRecords: number; lastChecked: string };
type AuditEntry = { id: string; organizationId: string; userId: string; action: string; entity: string; entityId: string | null; oldValue: unknown; newValue: unknown; createdAt: string };
export function SecurityClient({ health, auditLogs }: { health: HealthInfo; auditLogs: AuditEntry[] }) {
  const t = useTranslations("ownerPanel");
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Server className="h-5 w-5 text-green-500" /><div><p className="text-xs text-gray-500">{t("systemStatus")}</p><p className="text-lg font-bold text-green-600">{t("healthy")}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Activity className="h-5 w-5 text-blue-500" /><div><p className="text-xs text-gray-500">{t("uptime")}</p><p className="text-lg font-bold">{health.uptime}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><HardDrive className="h-5 w-5 text-amber-500" /><div><p className="text-xs text-gray-500">{t("dbRecords")}</p><p className="text-lg font-bold">{health.totalDbRecords.toLocaleString()}</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-3"><Shield className="h-5 w-5 text-purple-500" /><div><p className="text-xs text-gray-500">{t("audit7d")}</p><p className="text-lg font-bold">{health.auditLast7d}</p></div></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t("recentAudit", { count: auditLogs.length })}</CardTitle></CardHeader>
        <CardContent className="p-0 max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left sticky top-0 bg-white"><th className="p-3 font-medium text-gray-500">{t("auditAction")}</th><th className="p-3 font-medium text-gray-500">{t("auditEntity")}</th><th className="p-3 font-medium text-gray-500">{t("auditTime")}</th></tr></thead>
            <tbody>{auditLogs.length === 0 ? <tr><td colSpan={3} className="p-6 text-center text-gray-400">{t("noAudit")}</td></tr> : auditLogs.slice(0, 50).map((log) => (
              <tr key={log.id} className="border-b hover:bg-gray-50"><td className="p-3">{log.action}</td><td className="p-3 text-gray-500">{log.entity}</td><td className="p-3 text-gray-500">{new Date(log.createdAt).toLocaleString()}</td></tr>
            ))}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
