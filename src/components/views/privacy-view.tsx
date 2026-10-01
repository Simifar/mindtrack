"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLink } from "@/components/app/app-link";
import { useToast } from "@/hooks/use-toast";
import { clearMindTrackData } from "@/lib/local-data";

export function PrivacyView() {
  const { toast } = useToast();

  function clearAll() {
    if (!window.confirm("Удалить результаты, черновики, записи дневника и сводку к врачу из этого браузера? Это нельзя отменить.")) return;
    const { failed } = clearMindTrackData();
    if (failed === 0) {
      toast({ title: "Данные MindTrack удалены из этого браузера" });
    } else {
      toast({ title: "Не все данные удалось удалить", description: "Проверьте настройки хранения браузера и повторите попытку.", variant: "destructive" });
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" size="sm" asChild>
        <AppLink path="/tests">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> К каталогу тестов
        </AppLink>
      </Button>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Приватность</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">MindTrack работает без регистрации и серверного хранения ответов.</p>
      </header>
      <Card>
        <CardHeader><CardTitle as="h2" className="text-lg">Что хранится в браузере</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>В localStorage хранятся результаты тестов, черновики прохождений, записи дневника, черновик и сохранённая сводка к врачу.</p>
          <p>MindTrack не отправляет ответы на сервер, не использует аккаунты, аналитику или внешние AI-сервисы. Экспорт создаётся на устройстве и скачивается только после вашего действия.</p>
          <p>Удаление в MindTrack затрагивает только данные этого приложения на текущем устройстве. Очистка данных сайта в браузере также удалит их.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h2" className="text-lg">Удаление данных</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>Отдельные результаты удаляются в разделе «Результаты», записи дневника — в самом дневнике, черновики и сводка — на соответствующих страницах.</p>
          <Button variant="destructive" onClick={clearAll}>Удалить все данные MindTrack</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle as="h2" className="text-lg">Ограничения</CardTitle></CardHeader>
        <CardContent className="text-sm leading-relaxed text-muted-foreground">
          <p>Это не медицинское ПО. Результаты не являются диагнозом и не заменяют консультацию специалиста.</p>
        </CardContent>
      </Card>
    </div>
  );
}
