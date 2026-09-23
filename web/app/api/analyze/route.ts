import { env } from "cloudflare:workers";
import { z } from "zod";
import { fallbackCard, fallbackQuestions } from "@/lib/ai-fallback";

const cardSchema = z.object({
  title: z.string(), category: z.string(), originalDescription: z.string(), context: z.string(), need: z.string(),
  users: z.string(), dataMaterials: z.string(), constraints: z.string(), expectedResult: z.string(),
  successCriteria: z.string(), contact: z.string(), interactionFormat: z.string(),
});
const outputSchema = z.object({ questions: z.array(z.string()).length(3), card: cardSchema.nullable() });

const jsonSchema = {
  type: "object", additionalProperties: false, required: ["questions", "card"],
  properties: {
    questions: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } },
    card: { anyOf: [
      { type: "object", additionalProperties: false, required: ["title", "category", "originalDescription", "context", "need", "users", "dataMaterials", "constraints", "expectedResult", "successCriteria", "contact", "interactionFormat"], properties: Object.fromEntries(["title", "category", "originalDescription", "context", "need", "users", "dataMaterials", "constraints", "expectedResult", "successCriteria", "contact", "interactionFormat"].map((key) => [key, { type: "string" }])) },
      { type: "null" },
    ] },
  },
};

export async function POST(request: Request) {
  const body = await request.json() as { description?: string; questions?: string[]; answers?: string[] };
  const description = body.description?.trim().slice(0, 4000) ?? "";
  const questions = Array.isArray(body.questions) ? body.questions.slice(0, 3).map((v) => String(v).slice(0, 500)) : [];
  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 3).map((v) => String(v).slice(0, 2000)) : [];
  if (description.length < 12) return Response.json({ error: "Опишите задачу подробнее — минимум 12 символов" }, { status: 400 });

  const fallback = questions.length === 3
    ? { questions, card: fallbackCard(description, questions, answers) }
    : { questions: fallbackQuestions(description), card: null };
  if (!env.OPENAI_API_KEY) return Response.json({ ...fallback, source: "fallback" });

  try {
    const prompt = questions.length === 3
      ? `Сформируй карточку только из исходного описания и ответов. Не добавляй факты. Неизвестные поля оставь пустыми.\nОписание: ${description}\nВопросы и ответы:\n${questions.map((q, i) => `${i + 1}. ${q}\nОтвет: ${answers[i] || "Не указано"}`).join("\n")}`
      : `Проанализируй описание бизнес-задачи и задай ровно 3 наиболее полезных уточняющих вопроса. Не спрашивай то, что уже указано. Поле card должно быть null.\nОписание: ${description}`;
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [
        { role: "system", content: "Ты аналитик бизнес-задач. Возвращай только факты пользователя. Пиши по-русски." },
        { role: "user", content: prompt },
      ], response_format: { type: "json_schema", json_schema: { name: "task_analysis", strict: true, schema: jsonSchema } } }),
    });
    if (!response.ok) throw new Error(`OpenAI ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const parsed = outputSchema.parse(JSON.parse(data.choices?.[0]?.message?.content ?? "{}"));
    return Response.json({ ...parsed, source: "openai" });
  } catch (error) {
    console.error("ai_fallback_used", error instanceof Error ? error.message : "unknown");
    return Response.json({ ...fallback, source: "fallback" });
  }
}
