import { AppShell } from "@/components/app/app-shell";
import { AppLink } from "@/components/app/app-link";

export default function NotFound() {
  return (
    <AppShell>
      <div className="mx-auto max-w-xl space-y-4 py-8 text-center">
        <h1 className="page-title">Страница не найдена</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Возможно, ссылка устарела или адрес введён с ошибкой. Данные и результаты никуда не пропали —
          они остаются в этом браузере.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <AppLink
            path="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            На главную
          </AppLink>
          <AppLink
            path="/help"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border bg-background px-4 text-sm font-medium transition hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Помощь и контакты
          </AppLink>
        </div>
      </div>
    </AppShell>
  );
}
