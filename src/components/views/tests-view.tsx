"use client";
import { useMemo } from "react";
import { ALL_TESTS } from "@/data/tests";
import { loadResultsByCode } from "@/lib/results";
import { useAppStore } from "@/store/app-store";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";
import { severityColor } from "@/lib/results";

export function TestsView() {
  const openTest = useAppStore((s) => s.openTest);

  const lastByCode = useMemo(() => {
    const map = new Map<string, { label: string; severity: string; dateISO: string }>();
    for (const t of ALL_TESTS) {
      const items = loadResultsByCode(t.code);
      const last = items[0];
      if (last) map.set(t.code, { label: last.label, severity: last.severity, dateISO: last.dateISO });
    }
    return map;
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Каталог тестов</h1>
        <p className="text-sm text-muted-foreground">
          Скрининговые опросники самонаблюдения. Без регистрации — результаты хранятся только в вашем
          браузере. Не диагноз.
        </p>
      </div>

      <div className="grid gap-3">
        {ALL_TESTS.map((t) => {
          const last = lastByCode.get(t.code);
          return (
            <Card key={t.code} className="transition hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{t.name}</CardTitle>
                    {last && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: severityColor(last.severity),
                          color: severityColor(last.severity),
                        }}
                      >
                        {last.label}
                      </Badge>
                    )}
                  </div>
                  {t.description && <CardDescription className="mt-1">{t.description}</CardDescription>}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{t.questions.length} вопросов</span>
                    <span>·</span>
                    <span>{t.periodicity}</span>
                    {last && (
                      <>
                        <span>·</span>
                        <span>
                          последний: {new Date(last.dateISO).toLocaleDateString("ru-RU")} — {last.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => openTest(t.code)} className="shrink-0">
                  <Play className="h-4 w-4" />
                  Пройти
                </Button>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

