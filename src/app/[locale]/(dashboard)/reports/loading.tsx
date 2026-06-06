"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FadeIn } from "@/components/transitions";

export default function Loading() {
  return (
    <FadeIn>
      <div className="space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border-0 shadow-sm lg:col-span-1">
            <CardHeader><Skeleton className="h-5 w-36" /></CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-24" /></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm lg:col-span-2">
            <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
            <CardContent><Skeleton className="h-[300px] w-full" /></CardContent>
          </Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <div className="space-y-1"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-20" /></div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}
