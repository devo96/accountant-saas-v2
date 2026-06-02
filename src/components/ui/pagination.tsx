"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

type PaginationProps = {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  total?: number;
  className?: string;
};

export function Pagination({ page, pages, onChange, total, className }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {total !== undefined && <span className="text-sm text-gray-500 dark:text-gray-400">{total} records</span>}
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onChange(page - 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {Array.from({ length: pages }, (_, i) => (
          <Button key={i} variant={i === page ? "default" : "outline"} size="sm" onClick={() => onChange(i)}>
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
