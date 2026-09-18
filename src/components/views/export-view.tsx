"use client";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, FileDown, Link as LinkIcon, Copy, Check } from "lucide-react";

function todayISO(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

const SECTIONS = [
  { id: "summary", label: "Сводка за период", desc: "Средние показатели, счётчики" },
  { id: "tests", label: "Результаты тестов", desc: "Таблица всех прохождений" },
  { id: "diary", label: "Записи дневника", desc: "Настроение, сон, энергия, заметки" },
  { id: "charts", label: "Графики метрик", desc: "Визуализация динамики" },
];

export function ExportView() {
  const [dateFrom, setDateFrom] = useState(todayISO(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)));
  const [dateTo, setDateTo] = useState(todayISO());
  const [sections, setSections] = useState<string[]>(["summary", "tests", "diary", "charts"]);
  const [loading, setLoading] = useState<"pdf" | "link" | null>(null);
  const [shareInfo, setShareInfo] = useState<{ shareUrl: string; expiresAt: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  function toggleSection(id: string) {
    setSections((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function downloadPdf() {
    if (sections.length === 0) {
      toast({ title: "Выберите разделы", variant: "destructive" });
      return;
    }
    setLoading("pdf");
    try {
      const blob = await api.export.pdf({ dateFrom, dateTo, sections });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindtrack-report-${dateFrom}-to-${dateTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: "PDF сформирован", description: "Проверьте загрузки" });
    } catch (err) {
      toast({
        title: "Ошибка генерации",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  async function createShareLink() {
    if (sections.length === 0) {
      toast({ title: "Выберите разделы", variant: "destructive" });
      return;
    }
    setLoading("link");
    setShareInfo(null);
    try {
      const res = await api.export.shareLink({ dateFrom, dateTo, sections, shareTtlDays: 7 });
      setShareInfo({ shareUrl: res.shareUrl, expiresAt: res.expiresAt });
      toast({ title: "Ссылка создана", description: "Действительна 7 дней" });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  function copyLink() {
    if (!shareInfo) return;
    const fullUrl = `${window.location.origin}${shareInfo.shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отчёт для врача</h1>
        <p className="text-sm text-muted-foreground">
          Сформируйте PDF или временную ссылку, чтобы поделиться с психотерапевтом
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Параметры отчёта</CardTitle>
          <CardDescription>Выберите период и разделы</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>С даты</Label>
              <Input type="date" value={dateFrom} max={dateTo} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>По дату</Label>
              <Input type="date" value={dateTo} max={todayISO()} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Разделы отчёта</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {SECTIONS.map((s) => {
                const active = sections.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition hover:bg-accent ${
                      active ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <Checkbox checked={active} onCheckedChange={() => toggleSection(s.id)} />
                    <div>
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={downloadPdf} disabled={loading !== null} className="w-full">
              {loading === "pdf" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Скачать PDF
            </Button>
            <Button onClick={createShareLink} variant="outline" disabled={loading !== null} className="w-full">
              {loading === "link" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LinkIcon className="h-4 w-4" />
              )}
              Создать ссылку (7 дней)
            </Button>
          </div>
        </CardContent>
      </Card>

      {shareInfo && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="text-base text-emerald-900">Ссылка готова</CardTitle>
            <CardDescription className="text-emerald-800">
              Действует до {new Date(shareInfo.expiresAt).toLocaleString("ru-RU")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded-lg border bg-white px-3 py-2 text-xs">
                {window.location.origin}
                {shareInfo.shareUrl}
              </code>
              <Button size="icon" variant="outline" onClick={copyLink} aria-label="Копировать">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-emerald-800">
              Ссылка открывается без регистрации. Получатель (врач) увидит read-only отчёт. Вы можете
              отозвать доступ, удалив аккаунт.
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-sm text-amber-900">
          <span className="font-medium">Важно:</span> отчёт содержит чувствительные данные о ментальном
          здоровье. Передавайте его только по своей инициативе и доверенным специалистам. MindTrack не
          хранит email получателя и не уведомляет его автоматически.
        </CardContent>
      </Card>
    </div>
  );
}
