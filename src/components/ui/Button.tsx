import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}) {
  return (
    <button
      className={cn(
        "clay-btn focus-visible:ring-2 focus-visible:ring-[#FFC812]/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "clay-btn-primary",
        variant === "secondary" && "clay-btn-secondary",
        variant === "ghost" && "clay-btn-ghost",
        variant === "danger" && "clay-btn-danger",
        variant === "outline" && "clay-btn-outline",
        size === "sm" && "h-8 px-3.5 text-xs rounded-xl",
        size === "md" && "h-10 px-5 text-sm rounded-2xl",
        size === "lg" && "h-12 px-7 text-base rounded-2xl",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Please wait…
        </span>
      ) : children}
    </button>
  );
}
