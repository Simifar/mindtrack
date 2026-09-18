import { describe, expect, it } from "bun:test";
import { detectCrisis, getCrisisPolicy } from "./crisis";

describe("crisis detection policy", () => {
  it("detects explicit crisis wording", () => {
    const result = getCrisisPolicy("visit", "Я не хочу жить и боюсь остаться одному");

    expect(result.detected).toBe(true);
    expect(result.shouldOpenDialog).toBe(true);
    expect(result.source).toBe("visit");
  });

  it("does not trigger on neutral text", () => {
    expect(detectCrisis("Сегодня устал, плохо спал и хочу отдохнуть").detected).toBe(false);
    expect(getCrisisPolicy("diary", "Обсудить качество сна с врачом").shouldOpenDialog).toBe(false);
  });

  it("supports screening results that already have a crisis flag", () => {
    expect(getCrisisPolicy("screening", true).shouldOpenDialog).toBe(true);
    expect(getCrisisPolicy("screening", false).shouldOpenDialog).toBe(false);
  });
});
