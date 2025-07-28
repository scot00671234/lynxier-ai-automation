// Workflow execution engine inspired by n8n
import { storage } from "../storage";
import { processText } from "../services/openai";
import { sendEmail } from "../services/emailService";
import { nodeTypes } from "../nodes";
import type { WorkflowNode, NodeConnection, WorkflowExecution } from "@shared/schema";

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  mode: "manual" | "trigger" | "webhook";
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  inputData?: any;
}

export interface NodeExecutionData {
  json: Record<string, any>;
  binary?: Record<string, any>;
  pairedItem?: {
    item: number;
    input?: number;
  };
}

export interface NodeExecutionResult {
  success: boolean;
  data?: NodeExecutionData[];
  error?: string;
  executionTime?: number;
}

export class WorkflowExecutor {
  private context: ExecutionContext;
  private executionData: Map<string, NodeExecutionData[]> = new Map();

  constructor(context: ExecutionContext) {
    this.context = context;
  }

  async execute(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Update execution status to running
      await storage.updateExecution(this.context.executionId, {
        status: "running",
        data: { startedAt: new Date().toISOString() }
      });

      // Find trigger nodes (workflow entry points)
      const triggerNodes = this.context.nodes.filter(node => 
        node.type.includes("trigger") || node.type.includes("Trigger")
      );

      if (triggerNodes.length === 0) {
        throw new Error("No trigger node found in workflow");
      }

      // Execute from each trigger node
      for (const triggerNode of triggerNodes) {
        await this.executeFromNode(triggerNode);
      }

      // Mark execution as successful
      await storage.updateExecution(this.context.executionId, {
        status: "success",
        finished: true,
        stoppedAt: new Date(),
        data: {
          executionTime: Date.now() - startTime,
          nodeExecutions: Object.fromEntries(this.executionData),
        }
      });

    } catch (error) {
      console.error("Workflow execution failed:", error);
      
      await storage.updateExecution(this.context.executionId, {
        status: "error",
        finished: true,
        stoppedAt: new Date(),
        data: {
          error: error instanceof Error ? error.message : "Unknown error",
          executionTime: Date.now() - startTime,
          nodeExecutions: Object.fromEntries(this.executionData),
        }
      });
    }
  }

  private async executeFromNode(node: WorkflowNode): Promise<NodeExecutionData[]> {
    const nodeStartTime = Date.now();
    
    try {
      // Skip disabled nodes
      if (node.disabled) {
        return [];
      }

      // Get input data from connected nodes
      const inputData = await this.getInputDataForNode(node);
      
      // Execute the node
      const result = await this.executeNode(node, inputData);
      
      if (!result.success) {
        throw new Error(result.error || "Node execution failed");
      }

      const outputData = result.data || [];
      
      // Store execution data
      this.executionData.set(node.id, outputData);

      // Execute connected nodes
      await this.executeConnectedNodes(node, outputData);

      return outputData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`Node execution failed for ${node.name}:`, errorMessage);
      
      // Store error data
      this.executionData.set(node.id, [{
        json: { 
          error: errorMessage,
          nodeId: node.id,
          nodeName: node.name 
        }
      }]);

      throw error;
    }
  }

  private async executeNode(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionResult> {
    const nodeType = nodeTypes[node.type];
    
    if (!nodeType) {
      return {
        success: false,
        error: `Node type ${node.type} not found`
      };
    }

    try {
      let outputData: NodeExecutionData[] = [];

      // Execute based on node type
      switch (node.type) {
        case "lynxier-nodes-base.manualTrigger":
          outputData = await this.executeManualTrigger(node, inputData);
          break;

        case "lynxier-nodes-base.httpRequest":
          outputData = await this.executeHttpRequest(node, inputData);
          break;

        case "lynxier-nodes-base.set":
          outputData = await this.executeSet(node, inputData);
          break;

        case "lynxier-nodes-base.if":
          outputData = await this.executeIf(node, inputData);
          break;

        case "lynxier-nodes-base.code":
          outputData = await this.executeCode(node, inputData);
          break;

        case "lynxier-nodes-base.openAI":
          outputData = await this.executeOpenAI(node, inputData);
          break;

        case "lynxier-nodes-base.emailSend":
          outputData = await this.executeEmailSend(node, inputData);
          break;

        default:
          return {
            success: false,
            error: `Execution for node type ${node.type} not implemented`
          };
      }

      return {
        success: true,
        data: outputData
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown execution error"
      };
    }
  }

  private async executeManualTrigger(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const triggerData = node.parameters?.triggerData || this.context.inputData || {};
    
    return [{
      json: {
        timestamp: new Date().toISOString(),
        executionId: this.context.executionId,
        mode: this.context.mode,
        ...triggerData
      }
    }];
  }

  private async executeHttpRequest(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { requestMethod = "GET", url, headers = {}, body, queryParameters = {} } = node.parameters || {};
    
    if (!url) {
      throw new Error("URL is required for HTTP Request node");
    }

    // Build URL with query parameters
    const urlObj = new URL(url);
    Object.entries(queryParameters).forEach(([key, value]) => {
      urlObj.searchParams.append(key, String(value));
    });

    const response = await fetch(urlObj.toString(), {
      method: requestMethod,
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: requestMethod !== "GET" && body ? body : undefined,
    });

    const responseData = await response.text();
    let jsonData;
    
    try {
      jsonData = JSON.parse(responseData);
    } catch {
      jsonData = { data: responseData };
    }

    return [{
      json: {
        ...jsonData,
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries())
      }
    }];
  }

  private async executeSet(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { keepOnlySet = false, values = {} } = node.parameters || {};
    
    return inputData.map(item => ({
      json: keepOnlySet ? values : { ...item.json, ...values },
      binary: item.binary,
      pairedItem: item.pairedItem
    }));
  }

  private async executeIf(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { conditions = {}, combineOperation = "all" } = node.parameters || {};
    
    // For now, return all items (conditional logic would be more complex)
    return inputData;
  }

  private async executeCode(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { mode = "runOnceForAllItems", jsCode = "" } = node.parameters || {};
    
    if (!jsCode) {
      throw new Error("JavaScript code is required for Code node");
    }

    // Create execution context for the code
    const $input = {
      all: () => inputData,
      first: () => inputData[0] || null,
      item: inputData[0] || null
    };

    try {
      // Execute the JavaScript code
      const func = new Function('$input', 'items', jsCode);
      const result = func($input, inputData);
      
      // Ensure result is an array of NodeExecutionData
      if (Array.isArray(result)) {
        return result;
      }
      
      return [{ json: result || {} }];
      
    } catch (error) {
      throw new Error(`Code execution failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private async executeOpenAI(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { model = "gpt-4", prompt, maxTokens = 1000, temperature = 1 } = node.parameters || {};
    
    if (!prompt) {
      throw new Error("Prompt is required for OpenAI node");
    }

    const results: NodeExecutionData[] = [];
    
    for (const item of inputData) {
      // Replace placeholders in prompt with data from current item
      let processedPrompt = prompt;
      Object.entries(item.json).forEach(([key, value]) => {
        processedPrompt = processedPrompt.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(value));
      });

      const result = await processText("chat", processedPrompt, "");
      
      results.push({
        json: {
          ...item.json,
          aiResponse: result.output,
          model,
          tokensUsed: result.tokensUsed || 0
        },
        pairedItem: { item: inputData.indexOf(item) }
      });
    }

    return results;
  }

  private async executeEmailSend(node: WorkflowNode, inputData: NodeExecutionData[]): Promise<NodeExecutionData[]> {
    const { fromEmail, toEmail, subject, message, emailType = "html" } = node.parameters || {};
    
    if (!fromEmail || !toEmail || !subject || !message) {
      throw new Error("All fields are required for Email Send node");
    }

    const results: NodeExecutionData[] = [];
    
    for (const item of inputData) {
      // Replace placeholders in email content
      let processedSubject = subject;
      let processedMessage = message;
      
      Object.entries(item.json).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        processedSubject = processedSubject.replace(placeholder, String(value));
        processedMessage = processedMessage.replace(placeholder, String(value));
      });

      const emailResult = await sendEmail({
        to: toEmail,
        subject: processedSubject,
        template: processedMessage,
        data: item.json
      });

      results.push({
        json: {
          ...item.json,
          emailSent: emailResult.success,
          messageId: emailResult.messageId
        },
        pairedItem: { item: inputData.indexOf(item) }
      });
    }

    return results;
  }

  private async getInputDataForNode(node: WorkflowNode): Promise<NodeExecutionData[]> {
    // Find connections that target this node
    const incomingConnections = this.context.connections.filter(
      conn => conn.targetNodeId === node.id
    );

    if (incomingConnections.length === 0) {
      // No incoming connections, return empty data for trigger nodes
      return [];
    }

    let combinedData: NodeExecutionData[] = [];

    for (const connection of incomingConnections) {
      const sourceData = this.executionData.get(connection.sourceNodeId) || [];
      combinedData = combinedData.concat(sourceData);
    }

    return combinedData;
  }

  private async executeConnectedNodes(sourceNode: WorkflowNode, outputData: NodeExecutionData[]): Promise<void> {
    // Find connections from this node
    const outgoingConnections = this.context.connections.filter(
      conn => conn.sourceNodeId === sourceNode.id
    );

    for (const connection of outgoingConnections) {
      const targetNode = this.context.nodes.find(n => n.id === connection.targetNodeId);
      
      if (targetNode && !this.executionData.has(targetNode.id)) {
        await this.executeFromNode(targetNode);
      }
    }
  }
}

// Factory function to create and execute workflows
export async function executeWorkflow(executionId: string, workflowId: string, inputData?: any): Promise<void> {
  const workflow = await storage.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${workflowId} not found`);
  }

  const nodes = await storage.getWorkflowNodes(workflowId);
  const connections = await storage.getWorkflowConnections(workflowId);

  const context: ExecutionContext = {
    executionId,
    workflowId,
    mode: "manual",
    nodes,
    connections,
    inputData
  };

  const executor = new WorkflowExecutor(context);
  await executor.execute();
}