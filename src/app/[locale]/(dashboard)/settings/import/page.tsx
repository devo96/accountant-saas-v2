"use client";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { parseCsv, getEntityFields } from "@/lib/import-shared";

export default function ImportPage() {
  const t = useTranslations("import");
  const ct = useTranslations("common");
  const fileRef = useRef<HTMLInputElement>(null);
  const [entity, setEntity] = useState("Customer");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; total: number; errors: { row: number; message: string }[] } | null>(null);

  const fields = getEntityFields(entity);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setResult(null);
      const auto: Record<string, string> = {};
      for (const f of fields) {
        const found = parsed.headers.find((h) => h.toLowerCase().includes(f.field.toLowerCase()));
        if (found) auto[f.field] = found;
      }
      setMapping(auto);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const csv = fileRef.current?.files?.[0];
    if (!csv || rows.length === 0) return;
    setImporting(true);
    const text = await csv.text();
    const mappingArray = Object.entries(mapping)
      .filter(([, v]) => v)
      .map(([target, source]) => ({ targetField: target, sourceColumn: source }));

    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, csv: text, mapping: mappingArray }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
        <p className="text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <Select
        label={t("entity")}
        value={entity}
        onChange={(e) => { setEntity(e.target.value); setRows([]); setResult(null); }}
        options={[
          { value: "Customer", label: t("customers") },
          { value: "Vendor", label: t("vendors") },
          { value: "Item", label: t("items") },
          { value: "TaxCode", label: t("taxCodes") },
          { value: "Account", label: t("accounts") },
          { value: "Warehouse", label: t("warehouses") },
        ]}
      />

      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />
        {rows.length === 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">{t("dropHint")}</p>
            <Button variant="outline" onClick={() => fileRef.current?.click()}>{t("selectFile")}</Button>
          </div>
        ) : (
          <div className="text-left space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700 font-medium">{rows.length} {t("recordsFound")}</p>
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>{t("changeFile")}</Button>
            </div>

            <div className="rounded-lg border p-4 bg-gray-50 space-y-3">
              <p className="text-sm font-medium text-gray-700">{t("mapFields")}</p>
              {fields.map((f) => (
                <div key={f.field} className="flex items-center gap-2">
                  <span className="w-40 text-sm text-gray-600">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </span>
                  <select
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    value={mapping[f.field] ?? ""}
                    onChange={(e) => setMapping({ ...mapping, [f.field]: e.target.value })}
                  >
                    <option value="">-- {t("skip")} --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="max-h-40 overflow-y-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    {headers.slice(0, 6).map((h) => <th key={h} className="px-2 py-1 text-start">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-t">
                      {headers.slice(0, 6).map((h) => <td key={h} className="px-2 py-1">{row[h]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button onClick={handleImport} disabled={importing}>
              {importing ? t("importing") : t("startImport")}
            </Button>
          </div>
        )}
      </div>

      {result && (
        <div className="rounded-lg border p-4 space-y-2">
          <p className="font-medium">{t("resultTitle")}</p>
          <p className="text-sm text-green-700">{t("importedCount", { count: result.imported })} / {result.total}</p>
          {result.errors.length > 0 && (
            <div className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((e, i) => (
                <p key={i}>{t("row")} {e.row}: {e.message}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
