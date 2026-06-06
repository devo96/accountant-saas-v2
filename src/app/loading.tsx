import { Loader2 } from "lucide-react";

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary-800 dark:text-primary-400" />
      </div>
    </div>
  );
}
