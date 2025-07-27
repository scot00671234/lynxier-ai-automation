import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  order: integer("order").notNull(),
  type: text("type").notNull(), // file-upload, text-input, ai-processing, email, conditional
  name: text("name").notNull(),
  config: jsonb("config").notNull(), // step-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  status: text("status").notNull().default("running"), // running, completed, failed, stopped
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  results: jsonb("results"), // execution results for each step
});

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
});

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;
export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// Step configuration schemas
export const fileUploadConfigSchema = z.object({
  allowedTypes: z.array(z.string()).default(["pdf", "docx"]),
  maxSize: z.number().default(5000000), // 5MB
});

export const textInputConfigSchema = z.object({
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
});

export const aiProcessingConfigSchema = z.object({
  task: z.enum(["summarize", "rewrite", "analyze", "extract", "generate"]),
  instructions: z.string(),
  inputSource: z.string(), // reference to previous step or user input
});

export const emailConfigSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  template: z.string(), // email template with placeholders
});

export const conditionalConfigSchema = z.object({
  condition: z.string(),
  skipStepIds: z.array(z.string()),
});
