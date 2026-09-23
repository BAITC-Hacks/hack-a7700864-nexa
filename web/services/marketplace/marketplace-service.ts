import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";

export class MarketplaceService {
  listPublished() { return getDb().select().from(tasks).where(eq(tasks.published, true)).orderBy(desc(tasks.score), asc(tasks.title)); }
}
export const marketplaceService = new MarketplaceService();
