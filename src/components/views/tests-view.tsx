"use client";
import { useEffect, useState } from "react";
import { api, type TestDefinitionDTO } from "@/lib/api-client";
import { useAppStore } from "@/store/app-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Play, Star, Clock, Loader2 } from "lucide-react";
import { severityColor } from "@/lib/test-scoring";

export function TestsView() {
  const [defs, setDefs] = useState<TestDefinitionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const openTest = useAppStore((s) => s.openTest);

  useEffect(() => {
    api.tests
      .definitions()
      .then(({ definitions }) => setDefs(definitions))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <Skeleton className="h-8 w-48" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  const recommended = defs.filter((d) => d.recommended);
  const others = defs.filter((d) => !d.recommended);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Библиотека тестов</h1>
        <p className="text-sm text-muted-foreground">
          Опросники самонаблюдения. Не диагноз — инструмент для отслеживания динамики.
        </p>
      </div>

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <Star className="h-3.5 w-3.5 text-amber-500" />
            Рекомендованные вам
          </h2>
          <div className="grid gap-3">
            {recommended.map((d) => (
              <TestCard key={d.id} def={d} onOpen={() => openTest(d.id)} />
            ))}
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Все тесты</h2>
          <div className="grid gap-3">
            {others.map((d) => (
              <TestCard key={d.id} def={d} onOpen={() => openTest(d.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TestCard({ def, onOpen }: { def: TestDefinitionDTO; onOpen: () => void }) {
  return (
    <Card className="transition hover:shadow-md">
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{def.name}</CardTitle>
            {def.due ? (
              <Badge variant="outline" className="border-amber-300 text-amber-700">
                <Clock className="mr-1 h-3 w-3" />
                пора пройти
              </Badge>
            ) : def.lastResponse ? (
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                актуально
              </Badge>
            ) : null}
          </div>
          {def.description && (
            <CardDescription className="mt-1">{def.description}</CardDescription>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>{def._count.questions} вопросов</span>
            <span>·</span>
            <span>каждые {def.periodicityDays} дн.</span>
            {def.lastResponse && (
              <>
                <span>·</span>
                <span
                  className="font-medium"
                  style={{ color: severityColor(def.lastResponse.severity) }}
                >
                  последний: {def.lastResponse.label}
                </span>
              </>
            )}
          </div>
        </div>
        <Button size="sm" onClick={onOpen} className="shrink-0">
          <Play className="h-4 w-4" />
          Пройти
        </Button>
      </CardHeader>
    </Card>
  );
}
