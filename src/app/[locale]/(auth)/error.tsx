"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/transitions";

export default function AuthErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <FadeIn>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md space-y-4">
          <Alert variant="danger" title="Something went wrong">
            {error.message ?? "An unexpected error occurred."}
          </Alert>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </FadeIn>
  );
}
