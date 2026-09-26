export const STORAGE_KEYS = {
  draftPrefix: "mindtrack:draft:v1:",
  results: "mindtrack:results:v2",
  resultsLegacy: "mindtrack:results:v1",
  diary: "mindtrack.diary.v1",
  diaryDraft: "mindtrack.diary-draft.v1",
  visitPrep: "mindtrack.visit-prep.v1",
  visitPrepDraft: "mindtrack.visit-prep-draft.v1",
} as const;

export function draftKey(code: string): string {
  return `${STORAGE_KEYS.draftPrefix}${code}`;
}
