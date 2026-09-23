import type { ReadinessLevel, TaskCard } from "@/lib/domain";

export type Completeness = "EMPTY" | "PARTIAL" | "COMPLETE";
export type RatingBreakdownItem = {
  key: string;
  label: string;
  weight: number;
  points: number;
  lostPoints: number;
  completeness: Completeness;
  credited: string[];
  missingDetails: string[];
  recommendation: string;
};
export type TaskRating = { score: number; level: ReadinessLevel; breakdown: RatingBreakdownItem[]; missing: string[]; recommendations: string[] };

type Feedback = { credited: string[]; missing: string[] };
type Rule = { key: string; label: string; weight: number; partial: number; evaluate: (task: TaskCard) => Completeness; feedback: (task: TaskCard, completeness: Completeness) => Feedback; recommendation: string };
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const meaningful = (value: unknown) => { const clean = text(value).toLowerCase(); return clean !== "" && clean !== "не указано" && clean !== "нет"; };
const specific = (value: string) => /\d|%|день|недел|месяц|истори|faq|баз[аы]|таблиц|документ|тикет|запис|пример|api|crm|чат|почт/i.test(value);
const measurable = (value: string) => /\d|%|не более|не менее|сократ|увелич|точност|время|количеств|доля|ошиб|конверси|провер/i.test(value);
const feedback = (value: unknown, credited: string, missing: string[]): Feedback => meaningful(value)
  ? { credited: [credited], missing }
  : { credited: [], missing };

function dataFeedback(task: TaskCard): Feedback {
  const value = text(task.dataMaterials);
  if (!meaningful(value)) return { credited: [], missing: ["Какие материалы доступны", "Формат материалов", "Примерный объём", "Как команда получит доступ"] };
  const credited = [
    /инструкц/i.test(value) ? "Инструкции по сервису" : null,
    /faq/i.test(value) ? "FAQ" : null,
    /баз[аы] знан/i.test(value) ? "База знаний" : null,
    /тикет|обращен/i.test(value) ? "История обращений" : null,
    /таблиц|csv|json|pdf|markdown|docx?/i.test(value) ? "Формат материалов указан" : null,
    /\d/.test(value) ? "Примерный объём указан" : null,
    /доступ|предостав|передад|выгруз/i.test(value) ? "Способ доступа указан" : null,
  ].filter((item): item is string => Boolean(item));
  const missing = [
    !/таблиц|csv|json|pdf|markdown|docx?|формат/i.test(value) ? "Формат материалов" : null,
    !/\d|примерн.*объ[её]м/i.test(value) ? "Примерный объём" : null,
    !/доступ|предостав|передад|выгруз/i.test(value) ? "Как команда получит доступ" : null,
  ].filter((item): item is string => Boolean(item));
  return { credited: credited.length ? credited : ["Доступные материалы перечислены"], missing };
}

function constraintsFeedback(task: TaskCard): Feedback {
  const value = text(task.constraints);
  if (!meaningful(value)) return { credited: [], missing: ["Сроки проекта", "Технические ограничения", "Правила доступа", "Требования безопасности"] };
  const concrete = /срок|день|недел|месяц|дат|технич|интеграц|api|доступ|роль|прав|безопас|персональн|конфиденц|нельзя|только|бюджет|язык/i.test(value);
  const credited = concrete ? ["Указана конкретная граница проекта"] : ["Описаны сложности пользователей/контекста"];
  const missing = [
    !/срок|день|недел|месяц|дат/i.test(value) ? "Сроки проекта" : null,
    !/технич|интеграц|api|платформ|язык|брауз|устрой/i.test(value) ? "Технические ограничения" : null,
    !/доступ|роль|прав|предостав/i.test(value) ? "Правила доступа" : null,
    !/безопас|персональн|конфиденц|нельзя|только/i.test(value) ? "Требования безопасности" : null,
  ].filter((item): item is string => Boolean(item));
  return { credited, missing };
}

const rules: Rule[] = [
  { key: "contextNeed", label: "Контекст и потребность", weight: 20, partial: 10, recommendation: "Добавьте контекст текущего процесса и чётко сформулируйте проблему.", feedback: (t) => feedback(`${text(t.context)} ${text(t.need)}`, "Потребность или текущий процесс описаны", ["Контекст текущего процесса", "Чёткая формулировка проблемы"]), evaluate: (t) => {
    const context = text(t.context); const need = text(t.need); if (!meaningful(context) && !meaningful(need)) return "EMPTY";
    return meaningful(context) && meaningful(need) && context.length >= 35 && need.length >= 30 ? "COMPLETE" : "PARTIAL";
  } },
  { key: "data", label: "Данные и материалы", weight: 20, partial: 10, recommendation: "Укажите формат, примерный объём и способ предоставления материалов.", feedback: dataFeedback, evaluate: (t) => {
    const value = text(t.dataMaterials); if (!meaningful(value)) return "EMPTY"; return value.length >= 35 && specific(value) ? "COMPLETE" : "PARTIAL";
  } },
  { key: "result", label: "Ожидаемый результат", weight: 15, partial: 8, recommendation: "Опишите конкретный результат первой демонстрации или итоговый артефакт.", feedback: (t) => feedback(t.expectedResult, "Желаемый результат обозначен", ["Конкретный итоговый артефакт", "Что должно быть показано на первой демонстрации"]), evaluate: (t) => {
    const value = text(t.expectedResult); if (!meaningful(value)) return "EMPTY"; return value.length >= 30 && /прототип|сервис|интерфейс|дашборд|модель|система|отч[её]т|помощник|решение/i.test(value) ? "COMPLETE" : "PARTIAL";
  } },
  { key: "success", label: "Критерии успеха", weight: 15, partial: 7, recommendation: "Добавьте измеримый или однозначно проверяемый критерий успеха.", feedback: (t) => feedback(t.successCriteria, "Ожидаемый эффект сформулирован", ["Измеримый показатель", "Условие проверки результата"]), evaluate: (t) => {
    const value = text(t.successCriteria); if (!meaningful(value)) return "EMPTY"; return value.length >= 25 && measurable(value) ? "COMPLETE" : "PARTIAL";
  } },
  { key: "constraints", label: "Ограничения", weight: 10, partial: 5, recommendation: "Укажите хотя бы конкретные сроки, доступы или технические ограничения проекта.", feedback: constraintsFeedback, evaluate: (t) => {
    const value = text(t.constraints); if (!meaningful(value)) return "EMPTY"; return value.length >= 25 && /срок|данн|нельзя|только|без|долж|интеграц|безопас|язык|бюджет/i.test(value) ? "COMPLETE" : "PARTIAL";
  } },
  { key: "users", label: "Пользователи", weight: 10, partial: 5, recommendation: "Назовите основную группу пользователей и её роль в процессе.", feedback: (t) => feedback(t.users, "Группа пользователей названа", ["Роль пользователей в процессе", "Кто будет работать с результатом"]), evaluate: (t) => {
    const value = text(t.users); if (!meaningful(value)) return "EMPTY"; return value.length >= 20 && /клиент|сотрудник|оператор|менеджер|аналитик|студент|пользовател|команд|специалист/i.test(value) ? "COMPLETE" : "PARTIAL";
  } },
  { key: "contact", label: "Связь с бизнесом", weight: 10, partial: 5, recommendation: "Укажите контактную роль и формат регулярной обратной связи.", feedback: (t) => feedback(`${text(t.contact)} ${text(t.interactionFormat)}`, "Контакт или формат связи указан", ["Контактная роль", "Регулярный формат обратной связи"]), evaluate: (t) => {
    const contact = text(t.contact); const format = text(t.interactionFormat); if (!meaningful(contact) && !meaningful(format)) return "EMPTY";
    return meaningful(contact) && meaningful(format) && `${contact} ${format}`.length >= 35 ? "COMPLETE" : "PARTIAL";
  } },
];

export const scoreCriteria = rules.map(({ key, label, weight }) => ({ key, label, weight }));

export function readinessLevel(score: number): ReadinessLevel {
  if (score >= 90) return "Приоритетная"; if (score >= 70) return "Готовая"; if (score >= 40) return "Рабочая"; return "Черновик";
}

export function calculateTaskRating(task: TaskCard): TaskRating {
  const breakdown = rules.map((rule) => {
    const completeness = rule.evaluate(task);
    const points = completeness === "COMPLETE" ? rule.weight : completeness === "PARTIAL" ? rule.partial : 0;
    const details = rule.feedback(task, completeness);
    return { key: rule.key, label: rule.label, weight: rule.weight, completeness, points, lostPoints: rule.weight - points, credited: details.credited, missingDetails: completeness === "COMPLETE" ? [] : details.missing, recommendation: rule.recommendation };
  });
  const score = breakdown.reduce((sum, item) => sum + item.points, 0);
  const incomplete = breakdown.filter((item) => item.completeness !== "COMPLETE");
  return { score, level: readinessLevel(score), breakdown, missing: incomplete.map((item) => item.label), recommendations: incomplete.map((item) => rules.find((rule) => rule.key === item.key)!.recommendation) };
}
