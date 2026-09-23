import type { ReadinessLevel, TaskCard } from "./domain";

export const scoreCriteria = [
  { key: "contextNeed", label: "Контекст и потребность", weight: 20, fields: ["context", "need"] },
  { key: "data", label: "Данные и материалы", weight: 20, fields: ["dataMaterials"] },
  { key: "result", label: "Ожидаемый результат", weight: 15, fields: ["expectedResult"] },
  { key: "success", label: "Критерии успеха", weight: 15, fields: ["successCriteria"] },
  { key: "constraints", label: "Ограничения", weight: 10, fields: ["constraints"] },
  { key: "users", label: "Пользователи", weight: 10, fields: ["users"] },
  { key: "contact", label: "Связь с бизнесом", weight: 10, fields: ["contact", "interactionFormat"] },
] as const;

function fieldQuality(value: string) {
  const clean = value.trim();
  if (!clean || clean.toLowerCase() === "не указано") return 0;
  if (clean.length < 18) return 0.4;
  if (clean.length < 45) return 0.7;
  return 1;
}

export function calculateScore(card: TaskCard) {
  const breakdown = scoreCriteria.map((criterion) => {
    const quality = criterion.fields.reduce((sum, field) => sum + fieldQuality(String(card[field as keyof TaskCard] ?? "")), 0) / criterion.fields.length;
    return { ...criterion, points: Math.round(criterion.weight * quality) };
  });
  const total = breakdown.reduce((sum, item) => sum + item.points, 0);
  return { total, level: readinessLevel(total), breakdown };
}

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return "Приоритетная";
  if (score >= 70) return "Готовая";
  if (score >= 40) return "Рабочая";
  return "Черновик";
}
