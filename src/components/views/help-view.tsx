"use client";

import { ArrowLeft, Phone } from "lucide-react";
import { navigateToView } from "@/lib/navigation";
import { CRISIS_RESOURCES } from "@/lib/crisis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HelpView() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Button variant="ghost" onClick={() => navigateToView("tests")}><ArrowLeft className="h-4 w-4" /> К каталогу тестов</Button>
      <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Помощь</h1><p className="mt-2 text-sm text-muted-foreground">Если вам тяжело, выберите подходящий ресурс. MindTrack не оценивает непосредственный риск.</p></div>
      <Card>
        <CardHeader><CardTitle className="text-lg">Если опасность непосредственная</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed"><p>Позвоните 112 или попросите близкого человека побыть рядом. Не оставайтесь в одиночестве, если чувствуете, что можете причинить себе вред.</p></CardContent>
      </Card>
      <div className="space-y-2">
        {CRISIS_RESOURCES.lines.map((line) => <a key={line.phone} href={line.href} className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 hover:bg-accent"><span className="min-w-0"><span className="block font-medium">{line.name}</span><span className="block text-sm text-muted-foreground">{line.detail}</span></span><span className="flex shrink-0 items-center gap-2 font-mono font-semibold text-primary"><Phone className="h-4 w-4" />{line.phone}</span></a>)}
      </div>
    </div>
  );
}
