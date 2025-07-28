import { 
  type Workflow, 
  type InsertWorkflow,
  type WorkflowNode,
  type InsertNode,
  type WorkflowExecution,
  type InsertExecution,
  type NodeConnection,
  type InsertConnection
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Workflows
  getWorkflows(): Promise<Workflow[]>;
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, updates: Partial<Workflow>): Promise<Workflow | undefined>;
  deleteWorkflow(id: string): Promise<boolean>;
  
  // Nodes
  getWorkflowNodes(workflowId: string): Promise<WorkflowNode[]>;
  createNode(node: InsertNode): Promise<WorkflowNode>;
  updateNode(id: string, updates: Partial<WorkflowNode>): Promise<WorkflowNode | undefined>;
  deleteNode(id: string): Promise<boolean>;
  
  // Connections
  getWorkflowConnections(workflowId: string): Promise<NodeConnection[]>;
  createConnection(connection: InsertConnection): Promise<NodeConnection>;
  deleteConnection(id: string): Promise<boolean>;
  
  // Executions
  createExecution(execution: InsertExecution): Promise<WorkflowExecution>;
  getExecution(id: string): Promise<WorkflowExecution | undefined>;
  updateExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined>;
  getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]>;
  
  // Users (existing)
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private workflows: Map<string, Workflow>;
  private nodes: Map<string, WorkflowNode>;
  private connections: Map<string, NodeConnection>;
  private executions: Map<string, WorkflowExecution>;
  private users: Map<string, any>;

  constructor() {
    this.workflows = new Map();
    this.nodes = new Map();
    this.connections = new Map();
    this.executions = new Map();
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
      nodes: insertWorkflow.nodes || [],
      connections: insertWorkflow.connections || [],
      settings: insertWorkflow.settings || {},
      tags: insertWorkflow.tags || null,
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

  // Nodes
  async getWorkflowNodes(workflowId: string): Promise<WorkflowNode[]> {
    return Array.from(this.nodes.values())
      .filter(node => node.workflowId === workflowId);
  }

  async createNode(insertNode: InsertNode): Promise<WorkflowNode> {
    const id = randomUUID();
    const node: WorkflowNode = { 
      ...insertNode, 
      id,
      parameters: insertNode.parameters || {},
      credentials: insertNode.credentials || {},
      disabled: insertNode.disabled || false,
      notes: insertNode.notes || null,
      typeVersion: insertNode.typeVersion || 1,
      createdAt: new Date()
    };
    this.nodes.set(id, node);
    return node;
  }

  async updateNode(id: string, updates: Partial<WorkflowNode>): Promise<WorkflowNode | undefined> {
    const node = this.nodes.get(id);
    if (!node) return undefined;
    
    const updatedNode = { ...node, ...updates };
    this.nodes.set(id, updatedNode);
    return updatedNode;
  }

  async deleteNode(id: string): Promise<boolean> {
    return this.nodes.delete(id);
  }

  // Connections
  async getWorkflowConnections(workflowId: string): Promise<NodeConnection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.workflowId === workflowId);
  }

  async createConnection(insertConnection: InsertConnection): Promise<NodeConnection> {
    const id = randomUUID();
    const connection: NodeConnection = { 
      ...insertConnection, 
      id,
      sourceOutput: insertConnection.sourceOutput || "main",
      targetInput: insertConnection.targetInput || "main",
      createdAt: new Date()
    };
    this.connections.set(id, connection);
    return connection;
  }

  async deleteConnection(id: string): Promise<boolean> {
    return this.connections.delete(id);
  }

  // Executions
  async createExecution(insertExecution: InsertExecution): Promise<WorkflowExecution> {
    const id = randomUUID();
    const execution: WorkflowExecution = { 
      ...insertExecution, 
      id,
      status: insertExecution.status || "running",
      mode: insertExecution.mode || "manual",
      finished: insertExecution.finished || false,
      data: insertExecution.data || {},
      startedAt: new Date(),
      stoppedAt: null
    };
    this.executions.set(id, execution);
    return execution;
  }

  async getExecution(id: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(id);
  }

  async updateExecution(id: string, updates: Partial<WorkflowExecution>): Promise<WorkflowExecution | undefined> {
    const execution = this.executions.get(id);
    if (!execution) return undefined;
    
    const updatedExecution = { ...execution, ...updates };
    this.executions.set(id, updatedExecution);
    return updatedExecution;
  }

  async getWorkflowExecutions(workflowId: string): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
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
