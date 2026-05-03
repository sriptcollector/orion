import { ReactNode } from "react";

type ModuleProps = {
  index: string;
  title: string;
  meta?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Module({ index, title, meta, action, children, className = "" }: ModuleProps) {
  return (
    <section className={`border rule bg-[var(--color-paper)] flex flex-col ${className}`}>
      <header className="flex items-baseline justify-between border-b rule px-5 py-3">
        <div className="flex items-baseline gap-3">
          <span className="label num">{index}</span>
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
        </div>
        <div className="flex items-baseline gap-3">
          {meta && <span className="label num">{meta}</span>}
          {action}
        </div>
      </header>
      <div className="flex-1 p-5">{children}</div>
    </section>
  );
}

export function Stat({ value, label, delta }: { value: string; label: string; delta?: string }) {
  return (
    <div>
      <div className="display text-4xl num">{value}</div>
      <div className="flex items-baseline gap-2 mt-2">
        <span className="label">{label}</span>
        {delta && (
          <span className="text-[11px] text-[var(--color-navy)] num font-medium">{delta}</span>
        )}
      </div>
    </div>
  );
}

export function Row({
  left,
  right,
  meta,
}: {
  left: ReactNode;
  right?: ReactNode;
  meta?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b rule last:border-b-0">
      <div className="flex items-baseline gap-3 min-w-0">
        {meta && <span className="label num shrink-0 w-12">{meta}</span>}
        <span className="text-[13px] truncate">{left}</span>
      </div>
      {right && <span className="text-[12px] text-[var(--color-mute)] num shrink-0 ml-4">{right}</span>}
    </div>
  );
}
