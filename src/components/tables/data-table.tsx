"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Download, Search, Trash2, Inbox } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { exportToCsv } from "@/lib/export";

type Column<T> = {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
};

type FilterConfig = {
  key: string;
  label: string;
  type: "select" | "text";
  options?: { label: string; value: string }[];
};

type BulkAction = {
  label: string;
  onClick: (ids: string[]) => void | Promise<void>;
  variant?: "default" | "danger" | "outline";
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  exportFilename?: string;
  filters?: FilterConfig[];
  selectable?: boolean;
  idKey?: string;
  bulkActions?: BulkAction[];
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onEdit,
  onDelete,
  onRowClick,
  searchable,
  searchPlaceholder = "Search...",
  exportable,
  exportFilename = "export",
  filters,
  selectable,
  idKey = "id",
  bulkActions,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const perPage = 15;

  const filtered = data.filter((item) => {
    const matchesSearch = !search || Object.values(item).some((v) => String(v).toLowerCase().includes(search.toLowerCase()));
    const matchesFilters = !filters || filters.every((f) => {
      const fv = filterValues[f.key];
      if (!fv) return true;
      return String(item[f.key] ?? "").toLowerCase() === fv.toLowerCase();
    });
    return matchesSearch && matchesFilters;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === paged.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paged.map((item) => String(item[idKey] ?? ""))));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {searchable && (
          <div className="relative w-full max-w-sm">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 py-2 pe-10 ps-3 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors duration-200"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        )}
        {exportable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCsv(filtered as Record<string, unknown>[], exportFilename, columns)}
          >
            <Download className="h-4 w-4 ms-1" />
            Export CSV
          </Button>
        )}
      </div>

      {filters && filters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            f.type === "select" ? (
              <select
                key={f.key}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors duration-200"
                value={filterValues[f.key] ?? ""}
                onChange={(e) => { setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value })); setPage(0); }}
              >
                <option value="">{f.label}</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                key={f.key}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors duration-200"
                placeholder={f.label}
                value={filterValues[f.key] ?? ""}
                onChange={(e) => { setFilterValues((prev) => ({ ...prev, [f.key]: e.target.value })); setPage(0); }}
              />
            )
          ))}
        </div>
      )}

      {selected.size > 0 && bulkActions && bulkActions.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-50 dark:bg-primary-950/50">
          <span className="text-sm font-medium text-primary-800 dark:text-primary-300">{selected.size} selected</span>
          {bulkActions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant ?? "outline"}
              onClick={() => {
                const ids = Array.from(selected);
                action.onClick(ids);
                setSelected(new Set());
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <input type="checkbox" className="h-4 w-4" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {(onEdit || onDelete) && <TableHead className="w-28">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (onEdit || onDelete ? 1 : 0) + (selectable ? 1 : 0)} className="py-12">
                  <EmptyState title={t("noData")} icon={<Inbox className="h-8 w-8 text-gray-400" />} />
                </TableCell>
              </TableRow>
            ) : (
              paged.map((item, i) => (
                <TableRow
                  key={(item as { id?: string }).id ?? i}
                  className={cn(onRowClick ? "cursor-pointer hover:bg-gray-50" : "")}
                  onClick={() => onRowClick?.(item)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={selected.has(String(item[idKey] ?? ""))}
                        onChange={() => toggleSelect(String(item[idKey] ?? ""))}
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render ? col.render(item) : String(item[col.key] ?? "")}
                    </TableCell>
                  ))}
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <div className="flex gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(item); }}>Edit</Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="text-red-600">Del</Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} records</span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {Array.from({ length: pages }, (_, i) => (
            <Button
              key={i}
              variant={i === page ? "default" : "outline"}
              size="sm"
              onClick={() => setPage(i)}
            >
              {i + 1}
            </Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


