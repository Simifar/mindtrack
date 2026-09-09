import { describe, expect, test } from "bun:test";
import { screeningScales } from "@/data/scales";
import { topics } from "@/data/topics";
import { validateContent } from "@/lib/content";
import { filterCatalog, paginate } from "@/lib/catalog";

describe("content catalog", () => {
  test("keeps the published scale identifiers", () => {
    expect(screeningScales.map((item) => item.slug)).toEqual(["phq-9", "gad-7", "mdq", "asrs-v1-1"]);
    expect(screeningScales.map((item) => item.id)).toContain("scale-phq9");
  });
  test("validates unique ids, slugs, and relations", () => {
    expect(validateContent()).toEqual({ scaleCount: 4, topicCount: 4 });
    expect(new Set(topics.map((item) => item.slug)).size).toBe(topics.length);
  });
  test("searches, filters, and paginates without losing result counts", () => {
    expect(filterCatalog(screeningScales, "тревог", "all").map((item) => item.id)).toEqual(["scale-gad7"]);
    expect(filterCatalog(screeningScales, "", "topic-mood")).toHaveLength(2);
    expect(paginate(screeningScales, 2, 3)).toMatchObject({ currentPage: 2, pageCount: 2, items: [screeningScales[3]] });
  });
});
