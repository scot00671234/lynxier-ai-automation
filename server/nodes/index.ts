// Node type definitions and registry
import { z } from "zod";

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
  execute?: (parameters: any, inputData: any[]) => Promise<any[]>;
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

// Core node definitions based on n8n architecture
export const nodeTypes: Record<string, NodeType> = {
  // Trigger Nodes
  "lynxier-nodes-base.manualTrigger": {
    type: "lynxier-nodes-base.manualTrigger",
    displayName: "Manual Trigger",
    name: "Manual Trigger",
    category: "trigger",
    description: "Triggers the workflow when executed manually",
    icon: "fa:play",
    color: "#909298",
    version: 1,
    properties: [
      {
        displayName: "Trigger Data",
        name: "triggerData",
        type: "json",
        default: "{}",
        description: "Optional data to pass when triggering manually",
      },
    ],
  },

  "lynxier-nodes-base.webhookTrigger": {
    type: "lynxier-nodes-base.webhookTrigger",
    displayName: "Webhook",
    name: "Webhook",
    category: "trigger",
    description: "Listens for HTTP requests",
    icon: "fa:satellite-dish",
    color: "#FF6D5A",
    version: 1,
    properties: [
      {
        displayName: "HTTP Method",
        name: "httpMethod",
        type: "options",
        options: [
          { name: "GET", value: "GET" },
          { name: "POST", value: "POST" },
          { name: "PUT", value: "PUT" },
          { name: "DELETE", value: "DELETE" },
        ],
        default: "POST",
        required: true,
      },
      {
        displayName: "Path",
        name: "path",
        type: "string",
        default: "",
        placeholder: "webhook-path",
        description: "The path to listen for requests on",
      },
    ],
  },

  "lynxier-nodes-base.scheduleTrigger": {
    type: "lynxier-nodes-base.scheduleTrigger",
    displayName: "Schedule Trigger",
    name: "Schedule Trigger",
    category: "trigger",
    description: "Triggers the workflow on a schedule",
    icon: "fa:clock",
    color: "#31C12F",
    version: 1,
    properties: [
      {
        displayName: "Trigger Interval",
        name: "triggerInterval",
        type: "options",
        options: [
          { name: "Seconds", value: "seconds" },
          { name: "Minutes", value: "minutes" },
          { name: "Hours", value: "hours" },
          { name: "Days", value: "days" },
          { name: "Weeks", value: "weeks" },
          { name: "Cron Expression", value: "cron" },
        ],
        default: "minutes",
        required: true,
      },
      {
        displayName: "Seconds Between Triggers",
        name: "secondsInterval",
        type: "number",
        default: 30,
        description: "Number of seconds between triggers",
      },
      {
        displayName: "Cron Expression",
        name: "cronExpression",
        type: "string",
        default: "0 * * * * *",
        placeholder: "0 * * * * *",
        description: "Cron expression defining when to trigger",
      },
    ],
  },

  // Core Action Nodes
  "lynxier-nodes-base.httpRequest": {
    type: "lynxier-nodes-base.httpRequest",
    displayName: "HTTP Request",
    name: "HTTP Request",
    category: "action",
    description: "Make HTTP requests to any URL",
    icon: "fa:at",
    color: "#2196F3",
    version: 1,
    properties: [
      {
        displayName: "Request Method",
        name: "requestMethod",
        type: "options",
        options: [
          { name: "GET", value: "GET" },
          { name: "POST", value: "POST" },
          { name: "PUT", value: "PUT" },
          { name: "DELETE", value: "DELETE" },
          { name: "PATCH", value: "PATCH" },
          { name: "HEAD", value: "HEAD" },
          { name: "OPTIONS", value: "OPTIONS" },
        ],
        default: "GET",
        required: true,
      },
      {
        displayName: "URL",
        name: "url",
        type: "string",
        default: "",
        placeholder: "https://httpbin.org/get",
        required: true,
        description: "The URL to make the request to",
      },
      {
        displayName: "Query Parameters",
        name: "queryParameters",
        type: "collection",
        default: {},
        description: "Query parameters to append to the URL",
      },
      {
        displayName: "Headers",
        name: "headers",
        type: "collection",
        default: {},
        description: "Headers to send with the request",
      },
      {
        displayName: "Body",
        name: "body",
        type: "string",
        default: "",
        description: "Body content to send with the request",
        typeOptions: {
          rows: 4,
        },
      },
    ],
  },

  "lynxier-nodes-base.set": {
    type: "lynxier-nodes-base.set",
    displayName: "Set",
    name: "Set",
    category: "transform",
    description: "Set values on items and optionally remove other values",
    icon: "fa:pen",
    color: "#0000FF",
    version: 1,
    properties: [
      {
        displayName: "Keep Only Set",
        name: "keepOnlySet",
        type: "boolean",
        default: false,
        description: "If only the values set on this node should be kept and all others removed",
      },
      {
        displayName: "Values to Set",
        name: "values",
        type: "collection",
        default: {},
        description: "The values to set",
      },
    ],
  },

  "lynxier-nodes-base.if": {
    type: "lynxier-nodes-base.if",
    displayName: "IF",
    name: "IF",
    category: "flow",
    description: "Split a workflow conditionally based on comparison operations",
    icon: "fa:map-signs",
    color: "#408000",
    version: 1,
    properties: [
      {
        displayName: "Conditions",
        name: "conditions",
        type: "collection",
        default: {},
        description: "The conditions to check",
      },
      {
        displayName: "Combine",
        name: "combineOperation",
        type: "options",
        options: [
          { name: "ALL", value: "all", description: "All conditions must be true" },
          { name: "ANY", value: "any", description: "At least one condition must be true" },
        ],
        default: "all",
        description: "How to combine multiple conditions",
      },
    ],
  },

  "lynxier-nodes-base.code": {
    type: "lynxier-nodes-base.code",
    displayName: "Code",
    name: "Code",
    category: "transform",
    description: "Execute custom JavaScript code",
    icon: "fa:code",
    color: "#FF6600",
    version: 1,
    properties: [
      {
        displayName: "Mode",
        name: "mode",
        type: "options",
        options: [
          { name: "Run Once for All Items", value: "runOnceForAllItems" },
          { name: "Run Once for Each Item", value: "runOnceForEachItem" },
        ],
        default: "runOnceForAllItems",
        description: "How often the code should be executed",
      },
      {
        displayName: "JavaScript Code",
        name: "jsCode",
        type: "string",
        default: "// Access input data\nconst items = $input.all();\n\n// Process data\nconst outputItems = items.map(item => ({\n  json: {\n    ...item.json,\n    processed: true\n  }\n}));\n\nreturn outputItems;",
        description: "JavaScript code to execute",
        typeOptions: {
          rows: 10,
        },
      },
    ],
  },

  // AI Nodes
  "lynxier-nodes-base.openAI": {
    type: "lynxier-nodes-base.openAI",
    displayName: "OpenAI",
    name: "OpenAI",
    category: "ai",
    description: "Use OpenAI's GPT models for text processing",
    icon: "file:openai.png",
    color: "#10A37F",
    version: 1,
    properties: [
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        options: [
          { name: "Chat", value: "chat" },
          { name: "Text", value: "text" },
          { name: "Image", value: "image" },
        ],
        default: "chat",
        required: true,
      },
      {
        displayName: "Model",
        name: "model",
        type: "options",
        options: [
          { name: "GPT-4", value: "gpt-4" },
          { name: "GPT-4 Turbo", value: "gpt-4-turbo" },
          { name: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
        ],
        default: "gpt-4",
        required: true,
      },
      {
        displayName: "Prompt",
        name: "prompt",
        type: "string",
        default: "",
        placeholder: "What is the meaning of life?",
        required: true,
        typeOptions: {
          rows: 4,
        },
      },
      {
        displayName: "Max Tokens",
        name: "maxTokens",
        type: "number",
        default: 1000,
        description: "Maximum number of tokens to generate",
      },
      {
        displayName: "Temperature",
        name: "temperature",
        type: "number",
        default: 1,
        description: "Sampling temperature (0-2)",
      },
    ],
    credentials: [
      {
        name: "openAiApi",
        required: true,
      },
    ],
  },

  // Email Node
  "lynxier-nodes-base.emailSend": {
    type: "lynxier-nodes-base.emailSend",
    displayName: "Send Email",
    name: "Send Email",
    category: "action",
    description: "Send emails via SMTP",
    icon: "fa:envelope",
    color: "#FF6600",
    version: 1,
    properties: [
      {
        displayName: "From Email",
        name: "fromEmail",
        type: "string",
        default: "",
        placeholder: "sender@example.com",
        required: true,
      },
      {
        displayName: "To Email",
        name: "toEmail",
        type: "string",
        default: "",
        placeholder: "recipient@example.com",
        required: true,
      },
      {
        displayName: "Subject",
        name: "subject",
        type: "string",
        default: "",
        placeholder: "Subject line",
        required: true,
      },
      {
        displayName: "Email Type",
        name: "emailType",
        type: "options",
        options: [
          { name: "Text", value: "text" },
          { name: "HTML", value: "html" },
        ],
        default: "html",
      },
      {
        displayName: "Message",
        name: "message",
        type: "string",
        default: "",
        placeholder: "Email content",
        required: true,
        typeOptions: {
          rows: 6,
        },
      },
    ],
    credentials: [
      {
        name: "smtp",
        required: true,
      },
    ],
  },
};

// Node category groupings for the UI
export const nodeCategories = {
  trigger: {
    name: "Trigger",
    description: "Nodes that start workflows",
    icon: "fa:play",
    nodes: Object.values(nodeTypes).filter(n => n.category === "trigger"),
  },
  action: {
    name: "Actions",
    description: "Nodes that perform actions",
    icon: "fa:cogs",
    nodes: Object.values(nodeTypes).filter(n => n.category === "action"),
  },
  core: {
    name: "Core",
    description: "Essential workflow nodes",
    icon: "fa:cube",
    nodes: Object.values(nodeTypes).filter(n => n.category === "core"),
  },
  ai: {
    name: "AI",
    description: "Artificial intelligence nodes",
    icon: "fa:brain",
    nodes: Object.values(nodeTypes).filter(n => n.category === "ai"),
  },
  transform: {
    name: "Transform",
    description: "Data transformation nodes",
    icon: "fa:exchange-alt",
    nodes: Object.values(nodeTypes).filter(n => n.category === "transform"),
  },
  flow: {
    name: "Flow",
    description: "Control workflow flow",
    icon: "fa:code-branch",
    nodes: Object.values(nodeTypes).filter(n => n.category === "flow"),
  },
};

// Helper function to get node type by identifier
export function getNodeType(type: string): NodeType | undefined {
  return nodeTypes[type];
}

// Helper function to get all node types for a category
export function getNodesByCategory(category: string) {
  return Object.values(nodeTypes).filter(node => node.category === category);
}