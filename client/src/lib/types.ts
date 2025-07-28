// Extended types for n8n-inspired workflow editor
import { Node, Edge } from "reactflow";

// Workflow and node types from backend
export interface NodeType {
  type: string;
  displayName: string;
  name: string;
  category: "trigger" | "action" | "core" | "ai" | "transform" | "flow";
  description: string;
  icon: string;
  color: string;
  version: number;
  properties: NodePropertyDefinition[];
  credentials?: CredentialDefinition[];
}

export interface NodePropertyDefinition {
  displayName: string;
  name: string;
  type: "string" | "number" | "boolean" | "options" | "collection" | "multiOptions" | "json" | "color" | "dateTime";
  default?: any;
  required?: boolean;
  description?: string;
  options?: Array<{ name: string; value: any; description?: string }>;
  placeholder?: string;
  typeOptions?: {
    multipleValues?: boolean;
    loadOptionsMethod?: string;
    rows?: number;
  };
}

export interface CredentialDefinition {
  name: string;
  required: boolean;
}

// ReactFlow node data
export interface WorkflowNodeData {
  label: string;
  type: string;
  category: string;
  description?: string;
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
  notes?: string;
  icon: string;
  color: string;
  isConfigured?: boolean;
  hasErrors?: boolean;
  errorMessage?: string;
}

// Extended ReactFlow types
export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

// Workflow execution data
export interface ExecutionData {
  id: string;
  workflowId: string;
  status: "running" | "success" | "error" | "stopped" | "waiting";
  mode: "manual" | "trigger" | "webhook";
  startedAt: string;
  stoppedAt?: string | null;
  finished: boolean;
  data: Record<string, any>;
  workflowData: Record<string, any>;
}

// Node panel state
export interface NodePanelState {
  isOpen: boolean;
  selectedNodeId: string | null;
  selectedNodeType: string | null;
  mode: "add" | "edit" | "view";
}

// Workflow editor state
export interface WorkflowEditorState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  isExecuting: boolean;
  executionId: string | null;
  nodePanel: NodePanelState;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

// Node categories for sidebar
export interface NodeCategory {
  name: string;
  description: string;
  icon: string;
  nodes: NodeType[];
}

// Workflow metadata
export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "inactive";
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  connectionCount: number;
  lastExecuted?: string;
}

// Execution history
export interface ExecutionHistory {
  executions: ExecutionData[];
  total: number;
  hasMore: boolean;
}

// Node execution results
export interface NodeExecutionResult {
  nodeId: string;
  nodeName: string;
  status: "success" | "error" | "skipped";
  data?: any;
  error?: string;
  startTime: string;
  endTime?: string;
  executionTime?: number;
}

// Export all types for easy import
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  ExecutionData,
  NodePanelState,
  WorkflowEditorState,
  NodeCategory,
  WorkflowMetadata,
  ExecutionHistory,
  NodeExecutionResult
};