import { 
  type Workflow, 
  type InsertWorkflow,
  type WorkflowStep,
  type InsertWorkflowStep,
  type WorkflowExecution,
  type InsertWorkflowExecution
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Workflow Steps
  getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]>;
  createWorkflowStep(step: InsertWorkflowStep): Promise<WorkflowStep>;
  updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep | undefined>;
  deleteWorkflowStep(id: string): Promise<boolean>;
  
  // Workflow Executions
  createWorkflowExecution(execution: InsertWorkflowExecution): Promise<WorkflowExecution>;
  getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined>;
  updateWorkflowExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined>;
  
  // Users (existing)
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private workflowSteps: Map<string, WorkflowStep>;
  private workflowExecutions: Map<string, WorkflowExecution>;
  private users: Map<string, any>;

  constructor() {
    this.workflows = new Map();
    this.workflowSteps = new Map();
    this.workflowExecutions = new Map();
    this.users = new Map();
  }

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const now = new Date();
    const workflow: Workflow = { 
      ...insertWorkflow, 
      id, 
      description: insertWorkflow.description || null,
      createdAt: now,
      updatedAt: now
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { 
      ...workflow, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Workflow Steps
  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return Array.from(this.workflowSteps.values())
      .filter(step => step.workflowId === workflowId)
      .sort((a, b) => a.order - b.order);
  }

  async createWorkflowStep(insertStep: InsertWorkflowStep): Promise<WorkflowStep> {
    const id = randomUUID();
    const step: WorkflowStep = { 
      ...insertStep, 
      id, 
      createdAt: new Date()
    };
    this.workflowSteps.set(id, step);
    return step;
  }

  async updateWorkflowStep(id: string, updates: Partial<WorkflowStep>): Promise<WorkflowStep | undefined> {
    const step = this.workflowSteps.get(id);
    if (!step) return undefined;
    
    const updatedStep = { ...step, ...updates };
    this.workflowSteps.set(id, updatedStep);
    return updatedStep;
  }

  async deleteWorkflowStep(id: string): Promise<boolean> {
    return this.workflowSteps.delete(id);
  }

  // Workflow Executions
  async createWorkflowExecution(insertExecution: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const id = randomUUID();
    const execution: WorkflowExecution = { 
      ...insertExecution, 
      id,
      status: insertExecution.status || "running",
      startedAt: new Date(),
      completedAt: null
    };
    this.workflowExecutions.set(id, execution);
    return execution;
  }

  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> {
    return this.workflowExecutions.get(id);
  }

  async updateWorkflowExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined> {
    const execution = this.workflowExecutions.get(id);
    if (!execution) return undefined;
    
    const updatedExecution = { ...execution, ...updates };
    this.workflowExecutions.set(id, updatedExecution);
    return updatedExecution;
  }

  // Users (existing methods)
  async getUser(id: string): Promise<any> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
