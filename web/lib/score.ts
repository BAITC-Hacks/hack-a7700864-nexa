import type { TaskCard } from "./domain";
import { calculateTaskRating, readinessLevel, scoreCriteria } from "@/services/rating/rating-service";

export { readinessLevel, scoreCriteria };
export function calculateScore(card: TaskCard) {
  const rating = calculateTaskRating(card);
  return { ...rating, total: rating.score };
}

export function savedScoreBaseline(card: TaskCard) {
  return card.score ?? calculateTaskRating(card).score;
}

export function scoreDelta(previous: number, current: number) {
  const delta = current - previous;
  return { delta, label: delta === 0 ? "Рейтинг не изменился" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)} баллов` };
}
