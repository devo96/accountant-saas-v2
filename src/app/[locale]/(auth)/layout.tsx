import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50/30 px-4 dark:from-primary-950 dark:via-gray-900 dark:to-primary-950/30">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
