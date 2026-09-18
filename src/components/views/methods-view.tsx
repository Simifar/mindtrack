"use client";

import { ALL_TESTS } from "@/data/tests";
import { useAppStore } from "@/store/app-store";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MethodsView() {
  const setView = useAppStore((state) => state.setView);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" onClick={() => setView("tests")}>
        <ArrowLeft className="h-4 w-4" /> К каталогу тестов
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">О методиках и ограничениях</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          MindTrack показывает результаты скрининговых опросников для самонаблюдения. Скрининг не подтверждает и не исключает диагноз и не заменяет разговор с врачом или психологом.
        </p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Как читать результат</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>Пороговые значения описывают вероятность того, что стоит обратить внимание на состояние, а не медицинское заключение.</p>
          <p>Результат зависит от периода вопросов, текущего самочувствия и понимания формулировок. При ухудшении состояния или сомнениях обратитесь к специалисту.</p>
          <p>Ответы и история остаются в localStorage этого браузера. MindTrack не отправляет их на сервер и не уведомляет третьих лиц.</p>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Источники и версия форм</h2>
        {ALL_TESTS.map((test) => (
          <Card key={test.code}>
            <CardContent className="space-y-2 p-4">
              <h3 className="font-semibold">{test.name}</h3>
              <p className="text-sm text-muted-foreground">{test.sourceInfo.version}</p>
              <p className="text-sm leading-relaxed">{test.sourceInfo.translation}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">Лицензирование: {test.sourceInfo.licensing}</p>
              <a className="inline-flex items-center gap-1 text-sm font-medium text-primary underline" href={test.sourceInfo.url} target="_blank" rel="noreferrer">
                {test.sourceInfo.title} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
        <CardContent className="p-4 text-sm leading-relaxed">
          Если опасность непосредственная, звоните 112. Кризисный блок MindTrack не является оценкой риска: он только показывает доступные ресурсы помощи.
        </CardContent>
      </Card>
    </div>
  );
}
