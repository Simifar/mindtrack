"use client";

import { ArrowLeft } from "lucide-react";
import { navigateToView } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PrivacyView() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" onClick={() => navigateToView("tests")}><ArrowLeft className="h-4 w-4" /> К каталогу тестов</Button>
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Приватность</h1><p className="mt-2 text-sm text-muted-foreground">MindTrack работает без регистрации и серверного хранения ответов.</p></div>
      <Card><CardHeader><CardTitle className="text-lg">Что хранится в браузере</CardTitle></CardHeader><CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground"><p>В localStorage сохраняются завершённые результаты и незавершённые черновики, чтобы их можно было посмотреть или продолжить позже.</p><p>Ответы не отправляются на сервер MindTrack. Очистить их можно в разделе «Результаты» или настройках браузера.</p><p>Экспорт JSON и текстовый отчёт создаются локально и скачиваются только по действию пользователя.</p></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-lg">Ограничения</CardTitle></CardHeader><CardContent className="text-sm leading-relaxed text-muted-foreground"><p>Это не медицинское ПО. Результаты не являются диагнозом и не заменяют консультацию специалиста.</p></CardContent></Card>
    </div>
  );
}
