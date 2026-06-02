"use client";

import { TableSkeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/transitions";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        <TableSkeleton rows={8} cols={5} />
      </div>
    </FadeIn>
  );
}
