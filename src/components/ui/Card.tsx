import { cn } from "@/lib/utils";

export function Card({
  className,
  style,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "clay-card p-6",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </section>
  );
}

export function Badge({
  children,
  tone = "navy",
  className,
}: {
  children: React.ReactNode;
  tone?: "navy" | "brass" | "green" | "red" | "slate" | "amber" | "purple";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "clay-badge",
        tone === "navy"   && "clay-badge-gold",
        tone === "brass"  && "clay-badge-brass",
        tone === "green"  && "clay-badge-green",
        tone === "red"    && "clay-badge-red",
        tone === "slate"  && "clay-badge-slate",
        tone === "amber"  && "clay-badge-gold",
        tone === "purple" && "clay-badge-purple",
        className
      )}
    >
      {children}
    </span>
  );
}

export function Progress({ value }: { value: number }) {
  return (
    <div
      className="clay-progress-track"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="clay-progress-fill"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  body?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  const text = body || description || "";
  return (
    <div className="clay-empty clay-neural-bg">
      {Icon && (
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF8DC] to-[#FFF3B0] border border-[#FFE176] text-[#8C6000] shadow-[0_6px_18px_rgba(255,200,18,0.28),inset_0_1px_2px_rgba(255,255,255,0.9)] animate-float">
          <Icon className="h-8 w-8" />
        </div>
      )}
      <h3 className="font-serif text-lg font-bold text-[#181B1F] mt-1">{title}</h3>
      {text ? <p className="mx-auto mt-2 max-w-sm text-sm text-[#7B828A] leading-relaxed">{text}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-red-50/60 px-5 py-5 text-sm text-red-900 shadow-sm">
      <p className="font-medium">{message}</p>
      {onRetry ? (
        <button className="mt-3 text-xs font-bold underline text-red-700 hover:text-red-900 cursor-pointer" onClick={onRetry} type="button">
          Try again →
        </button>
      ) : null}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-[#7B828A] font-medium" role="status">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#EAE2D3] border-t-[#FFC812] shadow-sm" />
      {label}
    </div>
  );
}

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#BD7D14] mb-1.5">
            {kicker}
          </p>
        ) : null}
        <h1 className="font-serif text-3xl font-extrabold text-[#181B1F] md:text-4xl tracking-tight leading-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-2.5 max-w-2xl text-sm text-[#5E646A] leading-relaxed">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex-shrink-0">{actions}</div> : null}
    </div>
  );
}
