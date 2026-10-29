import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  helper,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const displayHint = hint || helper;
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold text-[#5E4800] uppercase tracking-[0.14em] flex items-center gap-1">
        {label}
        {required && <span className="text-red-500 font-bold" title="Required field">*</span>}
      </span>
      {children}
      {displayHint && !error ? (
        <span className="block text-xs text-[#8C8372] leading-relaxed">{displayHint}</span>
      ) : null}
      {error ? <span className="block text-xs text-red-600 font-semibold">{error}</span> : null}
    </label>
  );
}

const control =
  "clay-input";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-[120px] resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, "cursor-pointer", className)} {...props} />;
}
