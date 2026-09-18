"use client";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { routeFromPath } from "@/lib/routes";
import { TestsView } from "@/components/views/tests-view";
import { TestIntroView } from "@/components/views/test-intro-view";
import { TestRunnerView } from "@/components/views/test-runner-view";
import { ResultsView } from "@/components/views/results-view";
import { MethodsView } from "@/components/views/methods-view";
import { HelpView } from "@/components/views/help-view";
import { PrivacyView } from "@/components/views/privacy-view";
import { DiaryView } from "@/components/views/diary-view";
import { VisitPrepView } from "@/components/views/visit-prep-view";

export function AppRouter() {
  const pathname = usePathname() ?? "/";
  const route = routeFromPath(pathname);

  return (
    <AppShell>
      {route.view === "tests" && <TestsView />}
      {route.view === "test-detail" && route.code && <TestIntroView code={route.code} />}
      {route.view === "test-run" && route.code && <TestRunnerView codeOverride={route.code} key={route.code} />}
      {route.view === "diary" && <DiaryView />}
      {route.view === "visit" && <VisitPrepView />}
      {route.view === "results" && <ResultsView />}
      {route.view === "methods" && <MethodsView />}
      {route.view === "help" && <HelpView />}
      {route.view === "privacy" && <PrivacyView />}
    </AppShell>
  );
}
