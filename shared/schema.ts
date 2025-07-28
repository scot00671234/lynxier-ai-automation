import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core workflow definition - matches n8n's structure
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, active, inactive
  nodes: jsonb("nodes").notNull().default('[]'), // Array of workflow nodes
  connections: jsonb("connections").notNull().default('[]'), // Array of node connections
  settings: jsonb("settings").default('{}'), // Workflow-level settings
  tags: jsonb("tags").array(), // Workflow tags/categories
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Node definitions - individual workflow components
export const nodes = pgTable("nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  name: text("name").notNull(), // Display name
  type: text("type").notNull(), // Node type identifier (e.g., 'n8n-nodes-base.httpRequest')
  typeVersion: integer("type_version").default(1),
  position: jsonb("position").notNull(), // { x: number, y: number }
  parameters: jsonb("parameters").default('{}'), // Node configuration
  credentials: jsonb("credentials").default('{}'), // Credential references
  disabled: boolean("disabled").default(false),
  notes: text("notes"), // User notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Node connections - data flow between nodes
export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  sourceNodeId: varchar("source_node_id").references(() => nodes.id).notNull(),
  targetNodeId: varchar("target_node_id").references(() => nodes.id).notNull(),
  sourceOutput: text("source_output").default("main"), // Output connection point
  targetInput: text("target_input").default("main"), // Input connection point
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workflow executions - track execution instances
export const executions = pgTable("executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  status: text("status").notNull().default("running"), // running, success, error, stopped, waiting
  mode: text("mode").notNull().default("manual"), // manual, trigger, webhook
  startedAt: timestamp("started_at").defaultNow().notNull(),
  stoppedAt: timestamp("stopped_at"),
  finished: boolean("finished").default(false),
  data: jsonb("data").default('{}'), // Execution data and results
  workflowData: jsonb("workflow_data").notNull(), // Snapshot of workflow at execution time
});

// Insert schemas
export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNodeSchema = createInsertSchema(nodes).omit({
  id: true,
  createdAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
});

export const insertExecutionSchema = createInsertSchema(executions).omit({
  id: true,
  startedAt: true,
  stoppedAt: true,
});

// TypeScript types
export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;
export type InsertNode = z.infer<typeof insertNodeSchema>;
export type WorkflowNode = typeof nodes.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type NodeConnection = typeof connections.$inferSelect;
export type InsertExecution = z.infer<typeof insertExecutionSchema>;
export type WorkflowExecution = typeof executions.$inferSelect;

// Node position schema
export const nodePositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Core node types and configurations
export const nodeTypeCategories = [
  "trigger",
  "action", 
  "core",
  "ai",
  "transform",
  "flow"
] as const;

export type NodeTypeCategory = typeof nodeTypeCategories[number];

// Node data structure for workflow execution
export const nodeDataSchema = z.object({
  json: z.record(z.any()), // Main data object
  binary: z.record(z.any()).optional(), // Binary data attachments
  pairedItem: z.object({
    item: z.number(),
    input: z.number().optional(),
  }).optional(),
});

// Core node configurations based on n8n patterns
export const triggerNodeConfigSchema = z.object({
  triggerType: z.enum(["manual", "webhook", "schedule", "poll"]),
  webhookPath: z.string().optional(),
  schedule: z.string().optional(), // cron expression
  pollInterval: z.number().optional(), // milliseconds
});

export const httpRequestConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.string().optional(),
  queryParameters: z.record(z.string()).optional(),
  authentication: z.enum(["none", "basicAuth", "oauth2", "apiKey"]).default("none"),
});

export const codeNodeConfigSchema = z.object({
  mode: z.enum(["runOnceForAllItems", "runOnceForEachItem"]),
  jsCode: z.string(),
});

export const setNodeConfigSchema = z.object({
  keepOnlySet: z.boolean().default(false),
  values: z.record(z.any()),
});

export const ifNodeConfigSchema = z.object({
  conditions: z.array(z.object({
    leftValue: z.string(),
    operation: z.enum(["equal", "notEqual", "larger", "smaller", "contains", "startsWith", "endsWith", "exists"]),
    rightValue: z.string(),
  })),
  combineOperation: z.enum(["all", "any"]).default("all"),
});

// AI processing configurations
export const aiProcessingConfigSchema = z.object({
  provider: z.enum(["openai", "anthropic", "cohere", "local"]).default("openai"),
  model: z.string().default("gpt-4"),
  task: z.enum(["chat", "completion", "embedding", "image", "audio"]),
  prompt: z.string(),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(2).default(1),
  systemMessage: z.string().optional(),
});

// Email configuration
export const emailNodeConfigSchema = z.object({
  fromEmail: z.string().email(),
  toEmail: z.string().email(),
  subject: z.string(),
  body: z.string(),
  bodyType: z.enum(["text", "html"]).default("html"),
  attachments: z.array(z.object({
    name: z.string(),
    content: z.string(),
    type: z.string(),
  })).optional(),
});

// Database configurations
export const databaseNodeConfigSchema = z.object({
  operation: z.enum(["select", "insert", "update", "delete", "executeQuery"]),
  table: z.string().optional(),
  columns: z.array(z.string()).optional(),
  values: z.record(z.any()).optional(),
  conditions: z.record(z.any()).optional(),
  query: z.string().optional(), // For raw SQL
});

// File processing configurations  
export const fileNodeConfigSchema = z.object({
  operation: z.enum(["read", "write", "delete", "move", "copy"]),
  filePath: z.string(),
  encoding: z.string().default("utf8"),
  format: z.enum(["text", "json", "csv", "xml", "binary"]).default("text"),
  content: z.string().optional(),
});
