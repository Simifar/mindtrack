"use client";
import { useEffect, useState } from "react";
import { api, type AppUser, type ConditionTagDTO } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";

export function OnboardingView({ onDone }: { onDone: (u: AppUser) => void }) {
  const [tags, setTags] = useState<ConditionTagDTO[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api.onboarding
      .get()
      .then(({ tags, selectedIds }) => {
        setTags(tags);
        setSelected(new Set(selectedIds));
      })
      .finally(() => setLoading(false));
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finish() {
    setSaving(true);
    try {
      const { user } = await api.onboarding.complete(Array.from(selected));
      toast({ title: "Онбординг завершён", description: "Рекомендованные тесты готовы" });
      onDone(user);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Что вас интересует?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Отметьте темы, которые хотите отслеживать. На их основе подберём рекомендуемые тесты и
            поля дневника. Теги — не диагноз, а область самонаблюдения.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {tags.map((t) => {
            const active = selected.has(t.id);
            return (
              <Card
                key={t.id}
                onClick={() => toggle(t.id)}
                className={`cursor-pointer transition hover:shadow-md ${
                  active ? "border-primary ring-2 ring-primary/30" : ""
                }`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                    }`}
                  >
                    {active && <span className="text-xs">✓</span>}
                  </div>
                  <div>
                    <div className="font-medium">{t.name}</div>
                    {t.description && (
                      <div className="mt-0.5 text-sm text-muted-foreground">{t.description}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Выбрано: <span className="font-medium text-foreground">{selected.size}</span>
          </p>
          <Button onClick={finish} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {selected.size === 0 ? "Пропустить и продолжить" : "Продолжить"}
          </Button>
        </div>
      </div>
    </div>
  );
}
