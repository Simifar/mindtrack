"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FileDown, Loader2, Lock } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

type ReportData = {
  userEmail: string;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  sections: string[];
  tests: {
    code: string;
    name: string;
    completedAt: string;
    totalScore: number;
    severity: string;
    label: string;
  }[];
  diary: {
    date: string;
    mood: number;
    sleepHours: number | null;
    energyLevel: number | null;
    notes: string;
    crisisDetected: boolean;
  }[];
  stats: { avgMood: number | null; avgSleep: number | null; diaryDays: number; totalTests: number };
};

export function SharedReportView({ token }: { token: string }) {
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api.share
      .getJson(token)
      .then((r: { report: ReportData }) => setReport(r.report))
      .catch((e) => setError(e instanceof Error ? e.message : "Ошибка"))
      .finally(() => setLoading(false));
  }, [token]);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await api.share.getPdf(token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mindtrack-shared-report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <Lock className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">Ссылка недоступна</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!report) return null;

  const dateFrom = new Date(report.dateFrom).toLocaleDateString("ru-RU");
  const dateTo = new Date(report.dateTo).toLocaleDateString("ru-RU");

  const chartData = report.diary.map((d) => ({
    date: new Date(d.date).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }),
    mood: d.mood,
    sleep: d.sleepHours,
    energy: d.energyLevel,
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">MindTrack · отчёт</div>
              <div className="text-[10px] text-muted-foreground">read-only</div>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={downloadPdf} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            PDF
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-6">
        <div>
          <h1 className="text-xl font-bold">Отчёт самонаблюдения</h1>
          <p className="text-sm text-muted-foreground">
            Период: {dateFrom} — {dateTo} · сформирован{" "}
            {new Date(report.generatedAt).toLocaleString("ru-RU")}
          </p>
        </div>

        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          <span className="font-semibold">Не медицинский документ.</span> Отчёт создан пользователем
          самостоятельно для обсуждения со специалистом. MindTrack не ставит диагнозы.
        </div>

        {report.sections.includes("summary") && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Ср. настроение" value={report.stats.avgMood ?? "—"} />
            <Stat label="Ср. сон (ч)" value={report.stats.avgSleep ?? "—"} />
            <Stat label="Дней записей" value={report.stats.diaryDays} />
            <Stat label="Тестов" value={report.stats.totalTests} />
          </div>
        )}

        {report.sections.includes("tests") && report.tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Результаты тестов</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {report.tests.map((t, i) => (
                <div key={i} className="flex items-center justify-between border-b py-2 last:border-0">
                  <div>
                    <div className="text-sm font-medium">{t.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.completedAt).toLocaleDateString("ru-RU")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{t.totalScore}</div>
                    <div className="text-xs text-muted-foreground">{t.label}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {report.sections.includes("charts") && chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Графики метрик</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="mood" name="Настроение" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="sleep" name="Сон" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="energy" name="Энергия" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {report.sections.includes("diary") && report.diary.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Записи дневника</CardTitle>
            </CardHeader>
            <CardContent className="max-h-96 space-y-2 overflow-y-auto">
              {report.diary.map((d, i) => (
                <div key={i} className="border-b py-2 last:border-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-medium">
                      {new Date(d.date).toLocaleDateString("ru-RU")}
                    </span>
                    <span className="text-emerald-700">😊 {d.mood}</span>
                    {d.sleepHours !== null && <span className="text-indigo-700">😴 {d.sleepHours}ч</span>}
                    {d.energyLevel !== null && <span className="text-amber-700">⚡ {d.energyLevel}</span>}
                  </div>
                  {d.notes && <p className="mt-1 text-sm text-muted-foreground">{d.notes}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
          MindTrack · self-tracker психического состояния · не медицинское ПО · отчёт read-only
        </footer>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div className="text-xl font-bold">{value}</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
