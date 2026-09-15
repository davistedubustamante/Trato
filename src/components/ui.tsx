import type { ReactNode } from "react";

export function Sheet({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 rounded-t-[28px] border border-line bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_40px_oklch(0.22_0.02_170/0.12)]">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
      {title ? (
        <header className="mb-4">
          <h1 className="text-[1.35rem] font-extrabold tracking-tight text-ink text-balance">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted text-pretty">{subtitle}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 w-full items-center justify-center rounded-[14px] bg-accent px-4 text-[15px] font-bold text-accent-ink transition enabled:active:scale-[0.99] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex h-12 items-center justify-center rounded-[14px] border border-line bg-bg px-4 text-[15px] font-semibold text-ink disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        {...props}
        className="h-12 w-full rounded-[14px] border border-line bg-bg px-3 text-[15px] text-ink outline-none ring-primary/30 placeholder:text-muted/80 focus:ring-2"
      />
    </label>
  );
}
