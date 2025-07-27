import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  FileUp, 
  Type, 
  Brain, 
  Mail, 
  GitBranch,
  Play,
  Save,
  Trash2
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Workflow, WorkflowStep } from "@shared/schema";

// Custom node component for workflow steps
function WorkflowNode({ data }: { data: any }) {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case "file_upload": return <FileUp className="w-4 h-4" />;
      case "text_input": return <Type className="w-4 h-4" />;
      case "ai_process": return <Brain className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "conditional": return <GitBranch className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "file_upload": return "bg-blue-50 border-blue-200 text-blue-700";
      case "text_input": return "bg-green-50 border-green-200 text-green-700";
      case "ai_process": return "bg-purple-50 border-purple-200 text-purple-700";
      case "email": return "bg-orange-50 border-orange-200 text-orange-700";
      case "conditional": return "bg-yellow-50 border-yellow-200 text-yellow-700";
      default: return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <Card className={`min-w-[200px] border-2 ${getNodeColor(data.type)} cursor-pointer hover:shadow-md transition-shadow`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          {getNodeIcon(data.type)}
          <span className="font-medium text-sm">{data.label}</span>
        </div>
        {data.description && (
          <p className="text-xs opacity-70">{data.description}</p>
        )}
      </CardContent>
    </Card>
  );
}

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'workflowNode',
    position: { x: 100, y: 100 },
    data: { 
      label: 'Start',
      type: 'start',
      description: 'Workflow begins here'
    },
  },
];

const initialEdges: Edge[] = [];

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);

  const { data: workflows = [] } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  const saveWorkflowMutation = useMutation({
    mutationFn: async (workflow: Partial<Workflow>) => {
      return await apiRequest("/api/workflows", "POST", workflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow saved",
        description: "Your workflow has been saved successfully.",
      });
    },
  });

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `${type}_${Date.now()}`,
      type: 'workflowNode',
      position: { x: Math.random() * 400 + 200, y: Math.random() * 300 + 200 },
      data: {
        label: getStepLabel(type),
        type,
        description: getStepDescription(type),
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getStepLabel = (type: string) => {
    switch (type) {
      case "file_upload": return "File Upload";
      case "text_input": return "Text Input";
      case "ai_process": return "AI Process";
      case "email": return "Send Email";
      case "conditional": return "Conditional";
      default: return "Unknown";
    }
  };

  const getStepDescription = (type: string) => {
    switch (type) {
      case "file_upload": return "Upload and process files";
      case "text_input": return "Collect text input";
      case "ai_process": return "Process with AI";
      case "email": return "Send email notification";
      case "conditional": return "Branch workflow logic";
      default: return "";
    }
  };

  const saveWorkflow = () => {
    if (nodes.length === 0) return;

    const workflow = {
      name: "New Workflow",
      description: "Created with visual editor",
      status: "draft" as const,
    };

    saveWorkflowMutation.mutate(workflow);
  };

  const clearWorkflow = () => {
    setNodes([initialNodes[0]]);
    setEdges([]);
    setCurrentWorkflow(null);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-slate-900">Visual Workflow Builder</h1>
          <Badge variant="secondary" className="text-xs">
            {nodes.length - 1} steps
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={saveWorkflow}
            className="bg-lynxier-blue hover:bg-lynxier-blue/90 text-white"
            disabled={saveWorkflowMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Workflow
          </Button>
          <Button
            onClick={clearWorkflow}
            variant="outline"
            className="text-slate-600 hover:text-slate-900"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>
      </div>

      {/* Node Palette */}
      <div className="bg-slate-50 border-b border-slate-200 p-4">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">Add Step:</span>
          
          <Button
            onClick={() => addNode("file_upload")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            <FileUp className="w-3 h-3" />
            <span>File Upload</span>
          </Button>

          <Button
            onClick={() => addNode("text_input")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            <Type className="w-3 h-3" />
            <span>Text Input</span>
          </Button>

          <Button
            onClick={() => addNode("ai_process")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            <Brain className="w-3 h-3" />
            <span>AI Process</span>
          </Button>

          <Button
            onClick={() => addNode("email")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            <Mail className="w-3 h-3" />
            <span>Send Email</span>
          </Button>

          <Button
            onClick={() => addNode("conditional")}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1 whitespace-nowrap"
          >
            <GitBranch className="w-3 h-3" />
            <span>Conditional</span>
          </Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div className="flex-1 bg-slate-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-slate-50"
        >
          <Controls className="bg-white border border-slate-200 rounded-lg shadow-sm" />
          <MiniMap 
            className="bg-white border border-slate-200 rounded-lg" 
            nodeColor="#5A6B7D"
            maskColor="rgba(90, 107, 125, 0.1)"
          />
          <Background color="#e2e8f0" gap={20} />
        </ReactFlow>
      </div>
    </div>
  );
}
