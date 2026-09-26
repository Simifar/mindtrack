import { ALL_TESTS } from "@/data/tests";
import { STORAGE_KEYS, draftKey } from "@/lib/storage/keys";
import { removeKey } from "@/lib/storage/storage";

const LOCAL_DATA_KEYS = [
  STORAGE_KEYS.results,
  STORAGE_KEYS.resultsLegacy,
  STORAGE_KEYS.diary,
  STORAGE_KEYS.diaryDraft,
  STORAGE_KEYS.visitPrep,
  STORAGE_KEYS.visitPrepDraft,
  ...ALL_TESTS.map((test) => draftKey(test.code)),
];

/** Removes only MindTrack-owned keys from this browser's local storage. */
export function clearMindTrackData(): { failed: number } {
  let failed = 0;
  for (const key of LOCAL_DATA_KEYS) {
    try {
      removeKey(key);
    } catch {
      failed += 1;
    }
  }
  return { failed };
}
