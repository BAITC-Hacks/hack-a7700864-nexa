import { emptyCard, type TaskCard } from "./domain";

const has = (text: string, words: string[]) => words.some((word) => text.toLowerCase().includes(word));

export function fallbackQuestions(description: string) {
  const candidates: string[] = [];
  if (!has(description, ["пользовател", "клиент", "сотрудник", "оператор"])) candidates.push("Кто будет основным пользователем решения и в каком процессе он работает сейчас?");
  if (!has(description, ["данн", "документ", "faq", "тикет", "база"])) candidates.push("Какие данные, документы или примеры уже доступны команде для работы?");
  if (!has(description, ["успех", "метрик", "%", "время", "сократ", "увелич"])) candidates.push("Какой измеримый результат вы будете считать успешным?");
  if (!has(description, ["огранич", "нельзя", "срок", "бюджет"])) candidates.push("Какие сроки, технические или организационные ограничения нужно учитывать?");
  if (!has(description, ["формат", "встреч", "контакт", "почт"])) candidates.push("Кто будет контактным лицом и как часто команда сможет получать обратную связь?");
  return candidates.concat(["Какой результат должен увидеть бизнес после первой демонстрации?", "Какие ограничения важнее всего учесть в прототипе?", "Кто сможет проверять промежуточный результат?"]).slice(0, 3);
}

export function fallbackCard(description: string, questions: string[], answers: string[]): TaskCard {
  const card = emptyCard(description);
  const lower = description.toLowerCase();
  card.title = has(lower, ["поддержк"]) ? "AI-помощник для технической поддержки" : has(lower, ["аналит", "отчет"]) ? "Автоматизация бизнес-аналитики" : "Цифровое решение для бизнес-задачи";
  card.category = has(lower, ["финанс", "платеж", "банк"]) ? "FinTech" : has(lower, ["обуч", "школ", "студент"]) ? "Education" : has(lower, ["автомат"]) ? "Automation" : "AI / IT";
  card.context = description; card.need = description;
  questions.forEach((question, index) => {
    const answer = answers[index]?.trim() || ""; const q = question.toLowerCase();
    if (q.includes("пользовател")) card.users = answer;
    else if (q.includes("данн") || q.includes("документ")) card.dataMaterials = answer;
    else if (q.includes("успеш") || q.includes("измерим")) card.successCriteria = answer;
    else if (q.includes("огранич") || q.includes("срок")) card.constraints = answer;
    else if (q.includes("контакт") || q.includes("обратн")) { card.contact = answer; card.interactionFormat = answer; }
    else card.expectedResult = answer;
  });
  if (!card.expectedResult) card.expectedResult = "Рабочий прототип, решающий описанную проблему";
  return card;
}
