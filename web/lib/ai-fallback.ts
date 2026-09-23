import { emptyCard, type ClarificationQuestion, type TaskCard } from "./domain";

const has = (text: string, words: string[]) => words.some((word) => text.toLowerCase().includes(word));

export function fallbackQuestions(description: string) {
  const candidates: ClarificationQuestion[] = [];
  if (!has(description, ["пользовател", "клиент", "сотрудник", "оператор"])) candidates.push({ id: "users", question: "Кто будет основным пользователем решения и в каком процессе он работает сейчас?" });
  if (!has(description, ["данн", "документ", "faq", "тикет", "база"])) candidates.push({ id: "data", question: "Какие данные, документы или примеры уже доступны команде для работы?" });
  if (!has(description, ["успех", "метрик", "%", "время", "сократ", "увелич"])) candidates.push({ id: "success", question: "Какой измеримый результат вы будете считать успешным?" });
  if (!has(description, ["огранич", "нельзя", "срок", "бюджет"])) candidates.push({ id: "constraints", question: "Какие сроки, технические или организационные ограничения нужно учитывать?" });
  if (!has(description, ["результат", "прототип", "сервис", "дашборд"])) candidates.push({ id: "result", question: "Какой конкретный результат должна показать команда на первой демонстрации?" });
  if (!has(description, ["формат", "встреч", "контакт", "почт"])) candidates.push({ id: "contact", question: "Кто будет контактным лицом и как часто команда сможет получать обратную связь?" });
  const defaults: ClarificationQuestion[] = [{ id: "result", question: "Какой конкретный результат должна показать команда на первой демонстрации?" }, { id: "constraints", question: "Какие ограничения важнее всего учесть в прототипе?" }, { id: "contact", question: "Кто сможет проверять промежуточный результат и в каком формате?" }];
  return [...candidates, ...defaults.filter((fallback) => !candidates.some((item) => item.id === fallback.id))].slice(0, 3);
}

export function fallbackCard(description: string, questions: ClarificationQuestion[], answers: string[]): TaskCard {
  const card = emptyCard(description);
  const lower = description.toLowerCase();
  card.title = has(lower, ["поддержк"]) ? "AI-помощник для технической поддержки" : has(lower, ["аналит", "отчет"]) ? "Автоматизация бизнес-аналитики" : "Цифровое решение для бизнес-задачи";
  card.category = has(lower, ["финанс", "платеж", "банк"]) ? "FinTech" : has(lower, ["обуч", "школ", "студент"]) ? "Education" : has(lower, ["автомат"]) ? "Automation" : "AI / IT";
  card.context = description; card.need = description;
  questions.forEach(({ id }, index) => {
    const answer = answers[index]?.trim() || "";
    if (id === "users") card.users = answer;
    else if (id === "data") card.dataMaterials = answer;
    else if (id === "success") card.successCriteria = answer;
    else if (id === "constraints") card.constraints = answer;
    else if (id === "contact") { card.contact = answer; card.interactionFormat = answer; }
    else if (id === "result") card.expectedResult = answer;
  });
  return card;
}
