import { navigate, pathForView, testPath, testRunPath, type ViewId } from "./routes";

export function navigateToView(view: ViewId): void {
  navigate(pathForView(view, null));
}

export function navigateToTest(code: string): void {
  navigate(testPath(code));
}

export function navigateToTestRun(code: string): void {
  navigate(testRunPath(code));
}
