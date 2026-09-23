import { describe, expect, it } from "vitest";
import { emptyCard } from "./domain";
import { savedScoreBaseline, scoreDelta } from "./score";

describe("score delta", () => {
  it("uses the live deterministic rating as the first-save baseline", () => {
    const card = { ...emptyCard("Нужен сервис"), need: "Нужно автоматизировать текущий процесс поддержки клиентов." };
    expect(savedScoreBaseline(card)).toBeGreaterThan(0);
  });

  it("reports increases, decreases, and unchanged scores without a false improvement", () => {
    expect(scoreDelta(85, 100)).toEqual({ delta: 15, label: "+15 баллов" });
    expect(scoreDelta(85, 75)).toEqual({ delta: -10, label: "−10 баллов" });
    expect(scoreDelta(85, 85)).toEqual({ delta: 0, label: "Рейтинг не изменился" });
  });
});
