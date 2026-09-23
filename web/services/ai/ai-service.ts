import { env } from "cloudflare:workers";
import { z } from "zod";
import { fallbackCard, fallbackQuestions } from "@/lib/ai-fallback";
import type { ClarificationQuestion, TaskCard } from "@/lib/domain";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 30_000;

const questionSchema = z.object({
  id: z.enum(["users", "data", "success", "constraints", "result", "contact"]),
  question: z.string().trim().min(8).max(500),
});

const draftSchema = z.object({
  title: z.string(), category: z.string(), context: z.string(), need: z.string(), users: z.string(),
  dataMaterials: z.string(), constraints: z.string(), expectedResult: z.string(), successCriteria: z.string(),
  contact: z.string(), interactionFormat: z.string(),
});

const outputSchema = z.object({ questions: z.array(questionSchema).length(3), card: draftSchema.nullable() });
const completionSchema = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().min(1) }) })).min(1) });
const ids = ["users", "data", "success", "constraints", "result", "contact"];
const stringProperties = Object.fromEntries([
  "title", "category", "context", "need", "users", "dataMaterials", "constraints", "expectedResult",
  "successCriteria", "contact", "interactionFormat",
].map((key) => [key, { type: "string" }]));
const jsonSchema = { type: "object", additionalProperties: false, required: ["questions", "card"], properties: {
  questions: { type: "array", minItems: 3, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["id", "question"], properties: { id: { type: "string", enum: ids }, question: { type: "string" } } } },
  card: { anyOf: [{ type: "object", additionalProperties: false, required: Object.keys(stringProperties), properties: stringProperties }, { type: "null" }] },
} };

export type AIResult = { questions: ClarificationQuestion[]; card: TaskCard | null; source: "openai" | "fallback" };
export type AIErrorCode = "MISSING_API_KEY" | "INVALID_API_KEY" | "RATE_LIMIT" | "QUOTA" | "TIMEOUT" | "NETWORK_ERROR" | "INVALID_RESPONSE" | "UNKNOWN_ERROR";

const safeMessages: Record<AIErrorCode, string> = {
  MISSING_API_KEY: "OpenAI API key is missing.",
  INVALID_API_KEY: "OpenAI API key is invalid or unavailable.",
  RATE_LIMIT: "OpenAI rate limit was reached. Please try again later.",
  QUOTA: "OpenAI quota is unavailable.",
  TIMEOUT: "OpenAI request timed out.",
  NETWORK_ERROR: "OpenAI is temporarily unreachable.",
  INVALID_RESPONSE: "OpenAI returned an invalid response.",
  UNKNOWN_ERROR: "OpenAI request failed.",
};

export class AIServiceError extends Error {
  constructor(public readonly code: AIErrorCode, public readonly httpStatus: number, public readonly model: string, public readonly requestAttempted: boolean) {
    super(safeMessages[code]);
    this.name = "AIServiceError";
  }
  get safeMessage() { return safeMessages[this.code]; }
}

type OpenAIErrorBody = { error?: { code?: string; type?: string } };
const getOpenAIModel = () => env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
function getOpenAIKey(model: string) {
  const key = env.OPENAI_API_KEY?.trim();
  if (!key) throw new AIServiceError("MISSING_API_KEY", 503, model, false);
  return key;
}

function classifyOpenAIError(status: number, body: OpenAIErrorBody | null, model: string) {
  const code = body?.error?.code ?? body?.error?.type;
  if (status === 401) return new AIServiceError("INVALID_API_KEY", 401, model, true);
  if (status === 429 && code === "insufficient_quota") return new AIServiceError("QUOTA", 429, model, true);
  if (status === 429) return new AIServiceError("RATE_LIMIT", 429, model, true);
  return new AIServiceError("UNKNOWN_ERROR", 502, model, true);
}

async function requestOpenAI(body: Record<string, unknown>) {
  const model = getOpenAIModel();
  const key = getOpenAIKey(model);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({ ...body, model }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const failure = await response.json().catch(() => null) as OpenAIErrorBody | null;
      throw classifyOpenAIError(response.status, failure, model);
    }
    const json = await response.json().catch(() => { throw new AIServiceError("INVALID_RESPONSE", 502, model, true); });
    return { json, model };
  } catch (error) {
    if (error instanceof AIServiceError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new AIServiceError("TIMEOUT", 504, model, true);
    if (error instanceof TypeError) throw new AIServiceError("NETWORK_ERROR", 502, model, true);
    throw new AIServiceError("UNKNOWN_ERROR", 502, model, true);
  } finally { clearTimeout(timeout); }
}

function structuredRequest(prompt: string) {
  return {
    messages: [
      { role: "system", content: "Ты аналитик бизнес-задач. Возвращай только факты пользователя. Пиши по-русски." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_schema", json_schema: { name: "task_analysis", strict: true, schema: jsonSchema } },
  };
}

function parseStructuredOutput(json: unknown, model: string) {
  try {
    const completion = completionSchema.parse(json);
    return outputSchema.parse(JSON.parse(completion.choices[0].message.content));
  } catch { throw new AIServiceError("INVALID_RESPONSE", 502, model, true); }
}

export class AIService {
  async analyzeDraft(description: string): Promise<AIResult> { return this.run(description, [], []); }
  async buildTaskCard(description: string, questions: ClarificationQuestion[], answers: string[]): Promise<AIResult> { return this.run(description, questions, answers); }
  async generateTaskCard(description: string, questions: ClarificationQuestion[], answers: string[]): Promise<AIResult> { return this.buildTaskCard(description, questions, answers); }
  generateRecommendations(task: TaskCard) { return import("@/services/rating/rating-service").then(({ calculateTaskRating }) => calculateTaskRating(task).recommendations); }

  async diagnosticSmokeTest() {
    const startedAt = Date.now();
    const { json, model } = await requestOpenAI({ messages: [{ role: "user", content: "Ответь только одним словом: OK" }] });
    const completion = completionSchema.safeParse(json);
    if (!completion.success) throw new AIServiceError("INVALID_RESPONSE", 502, model, true);
    return { ok: true, envLoaded: true, provider: "openai" as const, model, realApiUsed: true, fallbackUsed: false, status: 200, response: completion.data.choices[0].message.content.trim(), latencyMs: Date.now() - startedAt };
  }

  async diagnosticQuestionsTest(description: string) {
    const startedAt = Date.now();
    const prompt = `Проанализируй описание бизнес-задачи и задай ровно 3 наиболее полезных уточняющих вопроса. Используй разные id. Не спрашивай то, что уже указано. Поле card должно быть null.\nОписание: ${description}`;
    const { json, model } = await requestOpenAI(structuredRequest(prompt));
    const parsed = parseStructuredOutput(json, model);
    return { ok: true, envLoaded: true, provider: "openai" as const, model, realApiUsed: true, fallbackUsed: false, status: 200, questions: parsed.questions.map(({ question }) => question), structuredOutputValid: true, latencyMs: Date.now() - startedAt };
  }

  private async run(description: string, questions: ClarificationQuestion[], answers: string[]): Promise<AIResult> {
    const fallback: AIResult = questions.length === 3
      ? { questions, card: fallbackCard(description, questions, answers), source: "fallback" }
      : { questions: fallbackQuestions(description), card: null, source: "fallback" };
    try {
      const prompt = questions.length === 3
        ? `Сформируй карточку только из исходного описания и ответов. Не добавляй факты. Неизвестные поля оставь пустыми.\nОписание: ${description}\nВопросы и ответы:\n${questions.map((question, index) => `${index + 1}. [${question.id}] ${question.question}\nОтвет: ${answers[index] || "Не указано"}`).join("\n")}`
        : `Проанализируй описание бизнес-задачи и задай ровно 3 наиболее полезных уточняющих вопроса. Используй разные id. Не спрашивай то, что уже указано. Поле card должно быть null.\nОписание: ${description}`;
      const { json, model } = await requestOpenAI(structuredRequest(prompt));
      const parsed = parseStructuredOutput(json, model);
      return { questions: parsed.questions, card: parsed.card ? { ...parsed.card, originalDescription: description } : null, source: "openai" };
    } catch (error) {
      const code = error instanceof AIServiceError ? error.code : "UNKNOWN_ERROR";
      console.error("ai_fallback_used", { code });
      return fallback;
    }
  }
}

export const aiService = new AIService();
