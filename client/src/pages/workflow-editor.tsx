import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { ReactFlowProvider } from "reactflow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NodeSidebar from "@/components/workflow-editor/node-sidebar";
import WorkflowCanvas from "@/components/workflow-editor/workflow-canvas";
import NodeConfigPanel from "@/components/workflow-editor/node-config-panel";
import { ArrowLeft, Save, Play, Square, Settings } from "lucide-react";
import type { 
  Workflow
} from "@shared/schema";
import type { 
  WorkflowNode as WorkflowNodeType, 
  WorkflowEdge, 
  NodeType,
  WorkflowNodeData,
  ExecutionData 
} from "@/lib/types";

export default function WorkflowEditor() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const workflowId = params.id;
  const isNewWorkflow = !workflowId;

  // Editor state
  const [nodes, setNodes] = useState<WorkflowNodeType[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);

  // Fetch workflow data
  const { data: workflow, isLoading } = useQuery<Workflow & { nodes: any[], connections: any[] }>({
    queryKey: ["/api/workflows", workflowId],
    enabled: !!workflowId,
  });

  // Fetch execution status
  const { data: execution } = useQuery<ExecutionData>({
    queryKey: ["/api/executions", executionId],
    enabled: !!executionId,
    refetchInterval: isExecuting ? 1000 : false,
  });

  // Workflow mutations
  const saveWorkflowMutation = useMutation({
    mutationFn: (data: any) => {
      if (workflowId) {
        return apiRequest("PUT", `/api/workflows/${workflowId}`, data);
      } else {
        return apiRequest("POST", "/api/workflows", data);
      }
    },
    onSuccess: async (response) => {
      const savedWorkflow = await response.json();
      if (!workflowId) {
        setLocation(`/workflows/${savedWorkflow.id}/edit`);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow Saved",
        description: "Your workflow has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Save Failed",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const executeWorkflowMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", `/api/workflows/${workflowId}/execute`, data),
    onSuccess: async (response) => {
      const execution = await response.json();
      setExecutionId(execution.id);
      setIsExecuting(true);
      toast({
        title: "Execution Started",
        description: "Workflow execution has begun.",
      });
    },
    onError: () => {
      toast({
        title: "Execution Failed",
        description: "Failed to start workflow execution.",
        variant: "destructive",
      });
    },
  });

  // Initialize workflow data
  useEffect(() => {
    if (workflow) {
      // Convert backend nodes to ReactFlow format
      const reactFlowNodes: WorkflowNodeType[] = workflow.nodes?.map((node: any) => ({
        id: node.id,
        type: "workflowNode",
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.name,
          type: node.type,
          category: "action", // This should come from node type definition
          description: "",
          parameters: node.parameters || {},
          credentials: node.credentials || {},
          disabled: node.disabled || false,
          notes: node.notes,
          icon: "fa:cog",
          color: "#6366f1",
          isConfigured: Object.keys(node.parameters || {}).length > 0,
          hasErrors: false,
        },
      })) || [];

      const reactFlowEdges: WorkflowEdge[] = workflow.connections?.map((conn: any) => ({
        id: conn.id,
        source: conn.sourceNodeId,
        target: conn.targetNodeId,
        type: "smoothstep",
        animated: false,
        style: { stroke: "#64748b", strokeWidth: 2 },
      })) || [];

      setNodes(reactFlowNodes);
      setEdges(reactFlowEdges);
    }
  }, [workflow]);

  // Handle node selection from sidebar
  const handleNodeSelect = useCallback((nodeType: NodeType) => {
    const position = { x: Math.random() * 300, y: Math.random() * 300 };
    
    const newNode: WorkflowNodeType = {
      id: `node-${Date.now()}`,
      type: "workflowNode",
      position,
      data: {
        label: nodeType.displayName,
        type: nodeType.type,
        category: nodeType.category,
        description: nodeType.description,
        parameters: {},
        credentials: {},
        disabled: false,
        icon: nodeType.icon,
        color: nodeType.color,
        isConfigured: false,
        hasErrors: false,
      },
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setIsConfigPanelOpen(true);
  }, []);

  // Handle node configuration
  const handleNodeConfigure = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsConfigPanelOpen(true);
  }, []);

  // Handle node updates
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<WorkflowNodeData>) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
  }, []);

  // Handle node selection
  const handleNodeSelection = useCallback((nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    if (nodeId) {
      setIsConfigPanelOpen(true);
    }
  }, []);

  // Handle workflow save
  const handleSave = useCallback(() => {
    if (!workflow?.name && isNewWorkflow) {
      toast({
        title: "Name Required",
        description: "Please enter a workflow name before saving.",
        variant: "destructive",
      });
      return;
    }

    const workflowData = {
      name: workflow?.name || "Untitled Workflow",
      description: workflow?.description || "",
      status: "draft",
      nodes: nodes.map(node => ({
        name: node.data.label,
        type: node.data.type,
        position: node.position,
        parameters: node.data.parameters || {},
        credentials: node.data.credentials || {},
        disabled: node.data.disabled || false,
        notes: node.data.notes,
      })),
      connections: edges.map(edge => ({
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceOutput: "main",
        targetInput: "main",
      })),
    };

    saveWorkflowMutation.mutate(workflowData);
  }, [workflow, nodes, edges, isNewWorkflow, saveWorkflowMutation, toast]);

  // Handle workflow execution
  const handleExecute = useCallback(() => {
    if (!workflowId) {
      toast({
        title: "Save Required",
        description: "Please save the workflow before executing.",
        variant: "destructive",
      });
      return;
    }

    if (nodes.length === 0) {
      toast({
        title: "No Nodes",
        description: "Add nodes to your workflow before executing.",
        variant: "destructive",
      });
      return;
    }

    executeWorkflowMutation.mutate({});
  }, [workflowId, nodes, executeWorkflowMutation, toast]);

  // Handle execution stop
  const handleStop = useCallback(() => {
    if (executionId) {
      apiRequest("POST", `/api/executions/${executionId}/stop`, {})
        .then(() => {
          setIsExecuting(false);
          toast({
            title: "Execution Stopped",
            description: "Workflow execution has been stopped.",
          });
        });
    }
  }, [executionId, toast]);

  // Monitor execution status
  useEffect(() => {
    if (execution) {
      if (execution.finished) {
        setIsExecuting(false);
        if (execution.status === "success") {
          toast({
            title: "Execution Complete",
            description: "Workflow executed successfully.",
          });
        } else if (execution.status === "error") {
          toast({
            title: "Execution Failed",
            description: "Workflow execution encountered an error.",
            variant: "destructive",
          });
        }
      }
    }
  }, [execution, toast]);

  const selectedNode = nodes.find(node => node.id === selectedNodeId);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {workflow?.name || "Untitled Workflow"}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>{nodes.length} nodes</span>
                <span>•</span>
                <span>{edges.length} connections</span>
                {execution && (
                  <>
                    <span>•</span>
                    <Badge 
                      variant={execution.status === "success" ? "default" : 
                              execution.status === "error" ? "destructive" : 
                              "secondary"}
                      className="text-xs"
                    >
                      {execution.status}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSave}
              disabled={saveWorkflowMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            
            <Button
              onClick={isExecuting ? handleStop : handleExecute}
              size="sm"
              className={isExecuting ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              disabled={executeWorkflowMutation.isPending}
            >
              {isExecuting ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          <ResizablePanelGroup direction="horizontal">
            {/* Node Sidebar */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <NodeSidebar
                onNodeSelect={handleNodeSelect}
                className="h-full"
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* Canvas */}
            <ResizablePanel defaultSize={isConfigPanelOpen ? 55 : 80} minSize={40}>
              <WorkflowCanvas
                workflowId={workflowId}
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onNodeSelect={handleNodeSelection}
                onExecute={handleExecute}
                isExecuting={isExecuting}
                executionStatus={execution?.status}
                className="h-full"
              />
            </ResizablePanel>

            {/* Configuration Panel */}
            {isConfigPanelOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                  <NodeConfigPanel
                    nodeId={selectedNodeId}
                    nodeData={selectedNode?.data || null}
                    isOpen={isConfigPanelOpen}
                    onClose={() => setIsConfigPanelOpen(false)}
                    onSave={handleNodeUpdate}
                    className="h-full"
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
      </div>
    </ReactFlowProvider>
  );
}