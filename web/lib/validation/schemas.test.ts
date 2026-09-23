import { describe, expect, it } from "vitest";
import { analyzeRequestSchema, proposalInputSchema, taskInputSchema } from "./schemas";

describe("server input validation", () => {
  it("requires exactly three questions and answers when building a card", () => {
    const result = analyzeRequestSchema.safeParse({
      description: "Хотим автоматизировать первую линию поддержки.",
      questions: [
        { id: "users", question: "Кто будет пользоваться решением каждый день?" },
        { id: "data", question: "Какие данные доступны команде для работы?" },
      ],
      answers: ["Операторы", "FAQ"],
    });
    expect(result.success).toBe(false);
  });

  it("drops client-owned score and publication flags from task input", () => {
    const parsed = taskInputSchema.parse({
      title: "Проверка",
      category: "Automation",
      originalDescription: "Проверяем серверный расчёт рейтинга.",
      context: "",
      need: "Нужно проверить расчёт.",
      users: "",
      dataMaterials: "",
      constraints: "",
      expectedResult: "",
      successCriteria: "",
      contact: "",
      interactionFormat: "",
      score: 100,
      confirmed: true,
      published: true,
    });
    expect(parsed).not.toHaveProperty("score");
    expect(parsed).not.toHaveProperty("confirmed");
    expect(parsed).not.toHaveProperty("published");
  });

  it("rejects an invalid prototype URL", () => {
    const result = proposalInputSchema.safeParse({
      taskId: "task-1",
      teamName: "Команда",
      solutionIdea: "Идея решения",
      plan: "План реализации",
      estimatedTime: "10 дней",
      prototypeUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });
});
