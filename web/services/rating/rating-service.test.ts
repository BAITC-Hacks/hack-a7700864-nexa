import { describe, expect, it } from "vitest";
import { emptyCard } from "../../lib/domain";
import { calculateTaskRating, readinessLevel } from "./rating-service";
import { demoTasks } from "../../lib/seed";

describe("RatingService", () => {
  it("returns zero and seven recommendations for an empty card", () => {
    const rating = calculateTaskRating(emptyCard());
    expect(rating.score).toBe(0); expect(rating.level).toBe("Черновик"); expect(rating.missing).toHaveLength(7);
  });

  it("awards full points only to concrete and testable information", () => {
    const task = { ...emptyCard("Автоматизировать поддержку"), title: "AI-помощник", category: "AI / IT",
      context: "Служба поддержки получает повторяющиеся обращения через почту и внутренний портал.",
      need: "Нужно сократить нагрузку на операторов и ускорить первый ответ клиентам.",
      users: "Клиенты и 12 операторов первой линии поддержки.", dataMaterials: "FAQ, база знаний и 2 000 обезличенных тикетов в таблице.",
      constraints: "Данные нельзя передавать наружу, интерфейс должен быть на русском языке.",
      expectedResult: "Рабочий прототип помощника с интерфейсом проверки ответа оператором.",
      successCriteria: "Не менее 70% запросов классифицируются верно, время ответа сокращается на 30%.",
      contact: "Куратор службы поддержки", interactionFormat: "Два демо в неделю и чат для вопросов." };
    const rating = calculateTaskRating(task);
    expect(rating.score).toBe(100); expect(rating.level).toBe("Приоритетная"); expect(rating.missing).toEqual([]);
  });

  it("uses fixed readiness boundaries", () => {
    expect(readinessLevel(39)).toBe("Черновик"); expect(readinessLevel(40)).toBe("Рабочая");
    expect(readinessLevel(70)).toBe("Готовая"); expect(readinessLevel(90)).toBe("Приоритетная");
  });

  it("calculates seed scores with the same engine and covers every readiness level", () => {
    for (const task of demoTasks) expect(task.score).toBe(calculateTaskRating(task).score);
    expect(new Set(demoTasks.map((task) => task.readinessLevel))).toEqual(new Set(["Черновик", "Рабочая", "Готовая", "Приоритетная"]));
  });
});
