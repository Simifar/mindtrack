"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import { api } from "@/lib/api-client";
import { AppShell } from "@/components/app/app-shell";
import { AuthView } from "@/components/views/auth-view";
import { ConsentView } from "@/components/views/consent-view";
import { OnboardingView } from "@/components/views/onboarding-view";
import { DashboardView } from "@/components/views/dashboard-view";
import { TestsView } from "@/components/views/tests-view";
import { TestRunnerView } from "@/components/views/test-runner-view";
import { DiaryView } from "@/components/views/diary-view";
import { ChartsView } from "@/components/views/charts-view";
import { ExportView } from "@/components/views/export-view";
import { SettingsView } from "@/components/views/settings-view";
import { SharedReportView } from "@/components/views/shared-report-view";
import { Loader2 } from "lucide-react";

export function AppRouter() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const view = useAppStore((s) => s.view);
  const shareToken = useAppStore((s) => s.shareToken);
  const setShareToken = useAppStore((s) => s.setShareToken);
  const [resetToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("resetToken");
  });

  // Определяем share-токен из URL (публичный отчёт — без авторизации).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (share) setShareToken(share);
  }, [setShareToken]);

  // Загружаем текущего пользователя (один раз).
  useEffect(() => {
    if (shareToken) return; // публичный отчёт — не нужна сессия
    api.auth
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null));
  }, [setUser, shareToken]);

  // Публичный отчёт по share-ссылке.
  if (shareToken) {
    return <SharedReportView token={shareToken} />;
  }

  // Загрузка сессии.
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Не авторизован.
  if (user === null) {
    return <AuthView onAuthed={setUser} resetToken={resetToken} />;
  }

  // Согласие не принято.
  if (!user.consentAcceptedAt) {
    return <ConsentView user={user} onDone={setUser} />;
  }

  // Онбординг не завершён.
  if (!user.onboardingCompleted) {
    return <OnboardingView onDone={setUser} />;
  }

  // Основное приложение.
  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "tests" && <TestsView />}
      {view === "test-runner" && <TestRunnerView />}
      {view === "diary" && <DiaryView />}
      {view === "charts" && <ChartsView />}
      {view === "export" && <ExportView />}
      {view === "settings" && <SettingsView />}
    </AppShell>
  );
}
