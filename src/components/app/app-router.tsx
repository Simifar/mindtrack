"use client";
import { AppShell } from "@/components/app/app-shell";
import { useAppStore } from "@/store/app-store";
import { TestsView } from "@/components/views/tests-view";
import { TestRunnerView } from "@/components/views/test-runner-view";
import { ResultsView } from "@/components/views/results-view";
import { MethodsView } from "@/components/views/methods-view";

export function AppRouter() {
  const view = useAppStore((s) => s.view);

  return (
    <AppShell>
      {view === "tests" && <TestsView />}
      {view === "test-run" && <TestRunnerView />}
      {view === "results" && <ResultsView />}
      {view === "methods" && <MethodsView />}
    </AppShell>
  );
}
