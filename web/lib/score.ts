import type { TaskCard } from "./domain";
import { calculateTaskRating, readinessLevel, scoreCriteria } from "@/services/rating/rating-service";

export { readinessLevel, scoreCriteria };
export function calculateScore(card: TaskCard) {
  const rating = calculateTaskRating(card);
  return { ...rating, total: rating.score };
}
