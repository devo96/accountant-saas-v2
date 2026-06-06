import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ReactNode } from "react";

type AlertProps = {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
};

const icons = { info: Info, success: CheckCircle, warning: AlertTriangle, danger: AlertCircle };

const styles = {
  info: "bg-info-bg border-info/30 text-info-text",
  success: "bg-success-bg border-success/30 text-success-text",
  warning: "bg-warning-bg border-warning/30 text-warning-text",
  danger: "bg-danger-bg border-danger/30 text-danger-text",
};

export function Alert({ variant = "info", title, children, dismissible, onDismiss, className }: AlertProps) {
  const Icon = icons[variant];
  return (
    <div className={cn("relative flex gap-3 rounded-lg border p-4", styles[variant], className)}>
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium text-sm mb-1">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {dismissible && (
        <button onClick={onDismiss} aria-label="Dismiss alert" className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity self-start">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
