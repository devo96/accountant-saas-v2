import { cn } from "@/lib/utils";

type BadgeProps = {
  variant?: "default" | "success" | "warning" | "danger" | "outline" | "info";
  children: React.ReactNode;
  className?: string;
};

const variants = {
  default: "bg-primary-50 text-primary-800 dark:bg-primary-950 dark:text-primary-300",
  success: "bg-success-bg text-success-text dark:bg-green-900 dark:text-green-300",
  warning: "bg-warning-bg text-warning-text dark:bg-yellow-900 dark:text-yellow-300",
  danger: "bg-danger-bg text-danger-text dark:bg-red-900 dark:text-red-300",
  info: "bg-info-bg text-info-text dark:bg-primary-900 dark:text-primary-300",
  outline: "border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
