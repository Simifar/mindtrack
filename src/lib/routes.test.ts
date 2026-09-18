import { describe, expect, it } from "bun:test";
import { pathForView, routeFromPath, testCodeFromSlug, testPath, testRunPath } from "./routes";

describe("MindTrack routes", () => {
  it("maps test codes to readable slugs", () => {
    expect(testPath("PHQ9")).toBe("/tests/phq-9");
    expect(testRunPath("WHO5")).toBe("/tests/who-5/run");
    expect(testCodeFromSlug("pss-10")).toBe("PSS10");
  });

  it("parses catalog, detail, runner and utility paths", () => {
    expect(routeFromPath("/")).toEqual({ view: "tests", code: null });
    expect(routeFromPath("/tests/gad-7")).toEqual({ view: "test-detail", code: "GAD7" });
    expect(routeFromPath("/tests/gad-7/run/")).toEqual({ view: "test-run", code: "GAD7" });
    expect(routeFromPath("/results")).toEqual({ view: "results", code: null });
    expect(routeFromPath("/privacy")).toEqual({ view: "privacy", code: null });
  });

  it("creates browser paths for view navigation", () => {
    expect(pathForView("test-detail", "ISI")).toBe("/tests/isi");
    expect(pathForView("test-run", "ISI")).toBe("/tests/isi/run");
    expect(pathForView("methods", null)).toBe("/about");
  });
});
