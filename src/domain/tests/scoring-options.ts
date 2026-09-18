import type { TestDefinition, TestOption } from "./types";

export function getOptions(def: TestDefinition, questionIndex: number): TestOption[] {
  return def.questionOptions?.[questionIndex] ?? def.options;
}
