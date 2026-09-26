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
    expect(getCrisisPolicy("diary", "В документальном фильме говорили о самоубийстве; хочу обсудить сон").shouldOpenDialog).toBe(false);
  });

  it("does not treat a broad topic mention as a personal crisis signal", () => {
    expect(detectCrisis("Психолог предложил обсудить мысли о смерти, если они появятся").detected).toBe(false);
    expect(getCrisisPolicy("visit", "Мой родственник когда-то говорил, что не хочет жить").shouldOpenDialog).toBe(false);
  });

  it("supports screening results that already have a crisis flag", () => {
    expect(getCrisisPolicy("screening", true).shouldOpenDialog).toBe(true);
    expect(getCrisisPolicy("screening", false).shouldOpenDialog).toBe(false);
  });
});
