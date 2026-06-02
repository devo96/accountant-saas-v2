import { cn } from "@/lib/utils";
import { User } from "lucide-react";

type AvatarProps = {
  src?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-12 w-12 text-base" };
const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" };

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? "Avatar"}
        className={cn("rounded-full object-cover ring-2 ring-white dark:ring-gray-800", sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium ring-2 ring-white dark:ring-gray-800",
        sizes[size],
        className
      )}
    >
      {initials || <User className={iconSizes[size]} />}
    </div>
  );
}
