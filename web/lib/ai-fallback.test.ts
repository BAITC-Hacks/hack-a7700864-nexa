import { describe, expect, it } from "vitest";
import { fallbackCard, fallbackQuestions } from "./ai-fallback";

describe("AI fallback", () => {
  it("always returns three distinct contextual questions", () => {
    const questions = fallbackQuestions("Сотрудникам нужен сервис. Есть база документов.");
    expect(questions).toHaveLength(3); expect(new Set(questions.map((item) => item.id)).size).toBe(3);
    expect(questions.some((item) => item.id === "users")).toBe(false); expect(questions.some((item) => item.id === "data")).toBe(false);
  });

  it("never invents fields that were not provided", () => {
    const description = "Хотим автоматизировать первую линию технической поддержки.";
    const questions = fallbackQuestions(description);
    const card = fallbackCard(description, questions, ["Операторы", "FAQ", "Сократить время на 30%"]);
    expect(card.originalDescription).toBe(description); expect(card.constraints).toBe(""); expect(card.contact).toBe("");
    if (!questions.some((item) => item.id === "result")) expect(card.expectedResult).toBe("");
  });
});
