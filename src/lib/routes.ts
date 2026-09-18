import type { ViewId } from "@/store/app-store";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const CODE_TO_SLUG: Record<string, string> = {
  PHQ9: "phq-9",
  GAD7: "gad-7",
  MDQ: "mdq",
  ASRS: "asrs",
  PSS10: "pss-10",
  ISI: "isi",
  WHO5: "who-5",
};

const SLUG_TO_CODE = Object.fromEntries(Object.entries(CODE_TO_SLUG).map(([code, slug]) => [slug, code]));

export function testSlug(code: string): string {
  return CODE_TO_SLUG[code] ?? code.toLowerCase();
}

export function testCodeFromSlug(slug: string): string | null {
  return SLUG_TO_CODE[slug] ?? null;
}

export function testPath(code: string): string {
  return `/tests/${testSlug(code)}`;
}

export function testRunPath(code: string): string {
  return `${testPath(code)}/run`;
}

export function navigate(path: string): void {
  if (typeof window === "undefined") return;
  window.history.pushState({}, "", `${BASE_PATH}${path}` || "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function pathForView(view: ViewId, activeTestCode: string | null): string {
  switch (view) {
    case "tests":
      return "/tests";
    case "test-detail":
      return activeTestCode ? testPath(activeTestCode) : "/tests";
    case "test-run":
      return activeTestCode ? testRunPath(activeTestCode) : "/tests";
    case "diary":
      return "/diary";
    case "visit":
      return "/visit";
    case "results":
      return "/results";
    case "methods":
      return "/about";
    case "help":
      return "/help";
    case "privacy":
      return "/privacy";
  }
}

export function routeFromPath(pathname: string): { view: ViewId; code: string | null } {
  const internalPath = BASE_PATH && pathname.startsWith(BASE_PATH) ? pathname.slice(BASE_PATH.length) || "/" : pathname;
  const parts = internalPath.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (parts[0] === "tests" && parts[1]) {
    const code = testCodeFromSlug(parts[1]);
    if (code && parts[2] === "run") return { view: "test-run", code };
    if (code) return { view: "test-detail", code };
  }
  if (parts[0] === "results") return { view: "results", code: null };
  if (parts[0] === "diary") return { view: "diary", code: null };
  if (parts[0] === "visit") return { view: "visit", code: null };
  if (parts[0] === "about") return { view: "methods", code: null };
  if (parts[0] === "help") return { view: "help", code: null };
  if (parts[0] === "privacy") return { view: "privacy", code: null };
  return { view: "tests", code: null };
}
