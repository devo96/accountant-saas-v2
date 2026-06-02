"use client";

import { CardSkeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/transitions";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <FadeIn>
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <CardSkeleton />
      </div>
    </FadeIn>
  );
}
