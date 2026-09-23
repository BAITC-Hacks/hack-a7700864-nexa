import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  originalDescription: text("original_description").notNull(),
  context: text("context").notNull().default(""),
  need: text("need").notNull().default(""),
  users: text("users").notNull().default(""),
  dataMaterials: text("data_materials").notNull().default(""),
  constraints: text("constraints").notNull().default(""),
  expectedResult: text("expected_result").notNull().default(""),
  successCriteria: text("success_criteria").notNull().default(""),
  contact: text("contact").notNull().default(""),
  interactionFormat: text("interaction_format").notNull().default(""),
  score: integer("score").notNull().default(0),
  readinessLevel: text("readiness_level").notNull().default("Черновик"),
  confirmed: integer("confirmed", { mode: "boolean" }).notNull().default(false),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("idx_tasks_published_score").on(table.published, table.score)]);

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  interests: text("interests").notNull().default(""),
  skills: text("skills").notNull().default(""),
  technologies: text("technologies").notNull().default(""),
});

export const proposals = sqliteTable("proposals", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id),
  teamId: text("team_id").notNull().references(() => teams.id),
  solutionIdea: text("solution_idea").notNull(),
  plan: text("plan").notNull(),
  estimatedTime: text("estimated_time").notNull(),
  prototypeUrl: text("prototype_url").notNull().default(""),
  status: text("status").notNull().default("PENDING"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("idx_proposals_task_id").on(table.taskId)]);
