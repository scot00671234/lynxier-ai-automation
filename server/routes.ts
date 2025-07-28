import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertWorkflowSchema, 
  insertNodeSchema,
  insertExecutionSchema,
  aiProcessingConfigSchema,
  emailNodeConfigSchema
} from "@shared/schema";
import { processText } from "./services/openai";
import { sendEmail } from "./services/emailService";
import { nodeTypes, nodeCategories } from "./nodes";
import { executeWorkflow } from "./execution/WorkflowExecutor";

// Extend Express Request type to include file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Node types and categories
  app.get("/api/node-types", async (req, res) => {
    try {
      res.json({
        nodeTypes,
        categories: nodeCategories
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/node-types/:type", async (req, res) => {
    try {
      const nodeType = nodeTypes[req.params.type];
      if (!nodeType) {
        return res.status(404).json({ message: "Node type not found" });
      }
      res.json(nodeType);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Workflow routes
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      
      // Include nodes and connections
      const nodes = await storage.getWorkflowNodes(req.params.id);
      const connections = await storage.getWorkflowConnections(req.params.id);
      
      res.json({
        ...workflow,
        nodes,
        connections
      });
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/workflows/:id", async (req, res) => {
    try {
      const updates = insertWorkflowSchema.partial().parse(req.body);
      const workflow = await storage.updateWorkflow(req.params.id, updates);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflow(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Node routes
  app.get("/api/workflows/:workflowId/nodes", async (req, res) => {
    try {
      const nodes = await storage.getWorkflowNodes(req.params.workflowId);
      res.json(nodes);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/workflows/:workflowId/nodes", async (req, res) => {
    try {
      const validatedData = insertNodeSchema.parse({
        ...req.body,
        workflowId: req.params.workflowId
      });
      const node = await storage.createNode(validatedData);
      res.status(201).json(node);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/nodes/:id", async (req, res) => {
    try {
      const updates = insertNodeSchema.partial().parse(req.body);
      const node = await storage.updateNode(req.params.id, updates);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/nodes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteNode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Connection routes
  app.get("/api/workflows/:workflowId/connections", async (req, res) => {
    try {
      const connections = await storage.getWorkflowConnections(req.params.workflowId);
      res.json(connections);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/workflows/:workflowId/connections", async (req, res) => {
    try {
      const validatedData = insertConnectionSchema.parse({
        ...req.body,
        workflowId: req.params.workflowId
      });
      const connection = await storage.createConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/connections/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConnection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Connection not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Workflow execution routes
  app.post("/api/workflows/:id/execute", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }

      const execution = await storage.createExecution({
        workflowId: req.params.id,
        status: "running",
        mode: "manual",
        finished: false,
        data: {},
        workflowData: { nodes: workflow.nodes, connections: workflow.connections }
      });

      // Start workflow execution in background
      executeWorkflow(execution.id, workflow.id, req.body).catch(console.error);

      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/workflows/:workflowId/executions", async (req, res) => {
    try {
      const executions = await storage.getWorkflowExecutions(req.params.workflowId);
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/executions/:id/stop", async (req, res) => {
    try {
      const execution = await storage.updateExecution(req.params.id, {
        status: "stopped",
        finished: true,
        stoppedAt: new Date()
      });
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });



  // AI processing endpoint for testing
  app.post("/api/ai/process", async (req, res) => {
    try {
      const { task, instructions, inputText } = req.body;
      
      if (!task || !inputText) {
        return res.status(400).json({ message: "Task and inputText are required" });
      }

      const result = await processText(task, instructions || "", inputText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
