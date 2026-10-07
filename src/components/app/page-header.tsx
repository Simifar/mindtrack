import { cn } from "@/lib/utils";

/**
 * Единая шапка страницы: короткая метка раздела, крупный заголовок,
 * пояснение и действия. Действия переносятся под текст на узких экранах.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  titleId,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  titleId?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h1 id={titleId} className="page-title">{title}</h1>
        {description ? <div className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{description}</div> : null}
      </div>
      {actions ? <div className="no-print flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** Заголовок секции внутри страницы. */
export function SectionHeading({
  id,
  title,
  description,
  action,
  className,
}: {
  id: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-4 gap-y-1", className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
