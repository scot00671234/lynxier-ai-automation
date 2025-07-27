import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertWorkflowSchema, 
  insertWorkflowStepSchema,
  insertWorkflowExecutionSchema,
  aiProcessingConfigSchema,
  emailConfigSchema
} from "@shared/schema";
import { processText, analyzeResume } from "./services/openai";
import { upload, processUploadedFile } from "./services/fileProcessor";
import { sendEmail, generateEmailTemplate } from "./services/emailService";

// Extend Express Request type to include file
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

export async function registerRoutes(app: Express): Promise<Server> {
  
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
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
    }
  });

  // Workflow steps routes
  app.get("/api/workflows/:workflowId/steps", async (req, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.workflowId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/workflows/:workflowId/steps", async (req, res) => {
    try {
      const validatedData = insertWorkflowStepSchema.parse({
        ...req.body,
        workflowId: req.params.workflowId
      });
      const step = await storage.createWorkflowStep(validatedData);
      res.status(201).json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/steps/:id", async (req, res) => {
    try {
      const updates = insertWorkflowStepSchema.partial().parse(req.body);
      const step = await storage.updateWorkflowStep(req.params.id, updates);
      if (!step) {
        return res.status(404).json({ message: "Step not found" });
      }
      res.json(step);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/steps/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkflowStep(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Step not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // File upload route
  app.post("/api/upload", upload.single('file'), async (req: RequestWithFile, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const result = await processUploadedFile(req.file);
      res.json(result);
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

      const execution = await storage.createWorkflowExecution({
        workflowId: req.params.id,
        status: "running",
        results: {}
      });

      // Start workflow execution in background
      executeWorkflow(execution.id, workflow.id).catch(console.error);

      res.status(201).json(execution);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getWorkflowExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/executions/:id/stop", async (req, res) => {
    try {
      const execution = await storage.updateWorkflowExecution(req.params.id, {
        status: "stopped",
        completedAt: new Date()
      });
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // AI processing endpoint
  app.post("/api/ai/process", async (req, res) => {
    try {
      const { task, instructions, inputText } = req.body;
      
      if (!task || !inputText) {
        return res.status(400).json({ message: "Task and inputText are required" });
      }

      const result = await processText(task, instructions || "", inputText);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background workflow execution
async function executeWorkflow(executionId: string, workflowId: string) {
  try {
    const steps = await storage.getWorkflowSteps(workflowId);
    const results: Record<string, any> = {};
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      try {
        // Update execution with current step progress
        await storage.updateWorkflowExecution(executionId, {
          results: { ...results, currentStep: i + 1, totalSteps: steps.length }
        });

        let stepResult: any = {};

        switch (step.type) {
          case "ai-processing":
            const config = aiProcessingConfigSchema.parse(step.config);
            let inputText = "";
            
            // Get input from previous step or user input
            if (config.inputSource === "previous-step" && i > 0) {
              inputText = results[steps[i-1].id]?.output || "";
            } else if (results[config.inputSource]) {
              inputText = results[config.inputSource].text || results[config.inputSource].output || "";
            }
            
            stepResult = await processText(config.task, config.instructions, inputText);
            break;

          case "email":
            const emailConfig = emailConfigSchema.parse(step.config);
            const template = generateEmailTemplate("workflow_completion", results);
            stepResult = await sendEmail({
              to: emailConfig.to,
              subject: emailConfig.subject,
              template: emailConfig.template || template,
              data: results
            });
            break;

          case "file-upload":
            // File upload steps are handled separately via the upload endpoint
            stepResult = { status: "waiting_for_file" };
            break;

          case "text-input":
            // Text input steps are handled by the frontend
            stepResult = { status: "waiting_for_input" };
            break;

          default:
            stepResult = { status: "skipped", message: "Step type not implemented" };
        }

        results[step.id] = stepResult;

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (stepError) {
        results[step.id] = { error: stepError.message };
        
        // Update execution with error
        await storage.updateWorkflowExecution(executionId, {
          status: "failed",
          completedAt: new Date(),
          results
        });
        return;
      }
    }

    // Mark execution as completed
    await storage.updateWorkflowExecution(executionId, {
      status: "completed",
      completedAt: new Date(),
      results
    });

  } catch (error) {
    await storage.updateWorkflowExecution(executionId, {
      status: "failed",
      completedAt: new Date(),
      results: { error: error.message }
    });
  }
}
