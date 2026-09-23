import { env } from "cloudflare:workers";
import { z } from "zod";
import { fallbackCard, fallbackQuestions } from "@/lib/ai-fallback";
import type { ClarificationQuestion, TaskCard } from "@/lib/domain";

const questionSchema = z.object({ id: z.enum(["users", "data", "success", "constraints", "result", "contact"]), question: z.string().min(8).max(500) });
const draftSchema = z.object({
  title: z.string(), category: z.string(), context: z.string(), need: z.string(), users: z.string(), dataMaterials: z.string(),
  constraints: z.string(), expectedResult: z.string(), successCriteria: z.string(), contact: z.string(), interactionFormat: z.string(),
});
const outputSchema = z.object({ questions: z.array(questionSchema).length(3), card: draftSchema.nullable() });
const ids = ["users", "data", "success", "constraints", "result", "contact"];
const stringProperties = Object.fromEntries(["title", "category", "context", "need", "users", "dataMaterials", "constraints", "expectedResult", "successCriteria", "contact", "interactionFormat"].map((key) => [key, { type: "string" }]));
const jsonSchema = { type: "object", additionalProperties: false, required: ["questions", "card"], properties: {
  questions: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["id", "question"], properties: { id: { type: "string", enum: ids }, question: { type: "string" } } } },
  card: { anyOf: [{ type: "object", additionalProperties: false, required: Object.keys(stringProperties), properties: stringProperties }, { type: "null" }] },
} };

export type AIResult = { questions: ClarificationQuestion[]; card: TaskCard | null; source: "openai" | "fallback" };

export class AIService {
  async analyzeDraft(description: string): Promise<AIResult> { return this.run(description, [], []); }
  async generateTaskCard(description: string, questions: ClarificationQuestion[], answers: string[]): Promise<AIResult> { return this.run(description, questions, answers); }
  generateRecommendations(task: TaskCard) { return import("@/services/rating/rating-service").then(({ calculateTaskRating }) => calculateTaskRating(task).recommendations); }

  private async run(description: string, questions: ClarificationQuestion[], answers: string[]): Promise<AIResult> {
    const fallback: AIResult = questions.length === 3 ? { questions, card: fallbackCard(description, questions, answers), source: "fallback" } : { questions: fallbackQuestions(description), card: null, source: "fallback" };
    if (!env.OPENAI_API_KEY) return fallback;
    try {
      const prompt = questions.length === 3
        ? `Сформируй карточку только из исходного описания и ответов. Не добавляй факты. Неизвестные поля оставь пустыми.\nОписание: ${description}\nВопросы и ответы:\n${questions.map((q, i) => `${i + 1}. [${q.id}] ${q.question}\nОтвет: ${answers[i] || "Не указано"}`).join("\n")}`
        : `Проанализируй описание бизнес-задачи и задай ровно 3 наиболее полезных уточняющих вопроса. Используй разные id. Не спрашивай то, что уже указано. Поле card должно быть null.\nОписание: ${description}`;
      const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "system", content: "Ты аналитик бизнес-задач. Возвращай только факты пользователя. Пиши по-русски." }, { role: "user", content: prompt }], response_format: { type: "json_schema", json_schema: { name: "task_analysis", strict: true, schema: jsonSchema } } }) });
      if (!response.ok) throw new Error(`OpenAI ${response.status}`);
      const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const parsed = outputSchema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? "{}"));
      return { questions: parsed.questions, card: parsed.card ? { ...parsed.card, originalDescription: description } : null, source: "openai" };
    } catch (error) {
      console.error("ai_fallback_used", error instanceof Error ? error.message : "unknown"); return fallback;
    }
  }
}

export const aiService = new AIService();
