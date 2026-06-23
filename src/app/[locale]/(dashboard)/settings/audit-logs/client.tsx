"use client";

import { DataTable } from "@/components/tables/data-table";
import { Input } from "@/components/ui/input";
import { FadeIn } from "@/components/transitions";
import { PageHeader } from "@/components/ui/page-header";
import { useState, useEffect, useMemo, useCallback } from "react";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  userId: string;
  oldValue: unknown | null;
  newValue: unknown | null;
  ipAddress: string | null;
  createdAt: string;
}

type Props = {
  translations: Record<string, string>;
};

export function AuditLogsClient({ translations: t }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter) params.set("entity", entityFilter);
    if (actionFilter) params.set("action", actionFilter);
    params.set("limit", "200");
    const res = await fetch(`/api/audit-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);
    }
    setLoading(false);
  }, [entityFilter, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <FadeIn>
    <div className="space-y-4">
      <PageHeader title={t.title} />

      <div className="flex gap-2">
        <Input
          placeholder={t.searchPlaceholder}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="block rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t.loading}</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-500">{t.noResults}</p>
      ) : (
        <DataTable
          columns={[
            { key: "createdAt", label: t.date, render: (l) => new Date((l as unknown as AuditLog).createdAt).toLocaleString() },
            { key: "entity", label: t.entity },
            { key: "action", label: t.action, render: (l) => {
              const a = (l as unknown as AuditLog).action;
              return (
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  a === "CREATE" ? "bg-green-100 text-green-700" :
                  a === "UPDATE" ? "bg-primary-100 text-primary-700" :
                  a === "DELETE" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-700"
                }`}>{a}</span>
              );
            }},
            { key: "userId", label: t.user },
            { key: "details", label: t.details, render: (l) => {
              const nv = (l as unknown as AuditLog).newValue;
              return <span className="text-xs text-gray-500">{nv ? JSON.stringify(nv) : "—"}</span>;
            }},
          ]}
          data={logs as unknown as Record<string, unknown>[]}
          exportable exportFilename="audit-logs"
        />
      )}
    </div>
    </FadeIn>
  );
}
