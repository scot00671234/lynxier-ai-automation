import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ReactFlowProvider } from "reactflow";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import NodeSidebar from "@/components/workflow-editor/node-sidebar";
import WorkflowCanvas from "@/components/workflow-editor/workflow-canvas-clean";
import NodeConfigPanel from "@/components/workflow-editor/node-config-panel";
import Header from "@/components/layout/header";
import { 
  Plus, 
  FileText
} from "lucide-react";
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

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Editor state for current workflow
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [nodes, setNodes] = useState<WorkflowNodeType[]>([]);
  const [edges, setEdges] = useState<WorkflowEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Fetch all workflows
  const { data: allWorkflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  // Get the most recent workflow or create a default one
  useEffect(() => {
    if (allWorkflows.length > 0 && !currentWorkflow) {
      // Sort by updatedAt and get the most recent
      const mostRecent = [...allWorkflows]
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())[0];
      setCurrentWorkflow(mostRecent);
      // Don't navigate - stay on dashboard with workflow loaded
    }
  }, [allWorkflows, currentWorkflow]);

  // Create workflow mutation
  const createWorkflowMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) => 
      apiRequest("POST", "/api/workflows", {
        ...data,
        status: "draft"
      }),
    onSuccess: async (response) => {
      const newWorkflow = await response.json();
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      setCurrentWorkflow(newWorkflow);
      // Stay on dashboard with new workflow loaded
      toast({
        title: "Workflow Created",
        description: `"${newWorkflow.name}" has been created successfully.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: (data: any) => {
      if (currentWorkflow?.id) {
        return apiRequest("PUT", `/api/workflows/${currentWorkflow.id}`, data);
      }
      return Promise.reject("No current workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow Saved",
        description: "Your workflow has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWorkflowSelect = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    // Don't navigate - just switch workflow on dashboard
  };

  const handleCreateWorkflow = () => {
    const name = `Workflow ${allWorkflows.length + 1}`;
    createWorkflowMutation.mutate({
      name,
      description: "A new automation workflow"
    });
  };

  const handleSave = () => {
    if (!currentWorkflow) return;
    
    const workflowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.data.type,
        position: node.position,
        data: node.data
      })),
      connections: edges.map(edge => ({
        id: edge.id,
        sourceNodeId: edge.source,
        targetNodeId: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      }))
    };
    
    saveWorkflowMutation.mutate(workflowData);
  };

  const handleExecute = () => {
    if (!currentWorkflow) return;
    
    setIsExecuting(true);
    toast({
      title: "Workflow Execution Started",
      description: "Your workflow is now running.",
    });
    
    // Simulate execution
    setTimeout(() => {
      setIsExecuting(false);
      toast({
        title: "Workflow Completed",
        description: "Your workflow has finished executing successfully.",
      });
    }, 3000);
  };

  const handleDownload = () => {
    if (!currentWorkflow) return;
    
    const workflowData = {
      workflow: currentWorkflow,
      nodes,
      edges,
      metadata: {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        nodeCount: nodes.length,
        edgeCount: edges.length,
      }
    };
    
    const blob = new Blob([JSON.stringify(workflowData, null, 2)], {
      type: "application/json"
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${currentWorkflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workflow Downloaded",
      description: "Your workflow has been exported successfully.",
    });
  };

  const handleNameChange = (newName: string) => {
    if (!currentWorkflow) return;
    
    setCurrentWorkflow(prev => prev ? { ...prev, name: newName } : null);
    // Auto-save name change
    saveWorkflowMutation.mutate({ name: newName });
  };

  // Canvas controls
  const handleZoomIn = () => {
    // These will be passed to WorkflowCanvas
  };

  const handleZoomOut = () => {
    // These will be passed to WorkflowCanvas
  };

  const handleFitView = () => {
    // These will be passed to WorkflowCanvas
  };

  const handleNodeSelect = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
    setIsConfigPanelOpen(!!nodeId);
  };

  const handleNodeAdd = (nodeType: NodeType) => {
    const position = { x: 250 + Math.random() * 100, y: 150 + Math.random() * 100 };
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
  };

  const selectedNode = selectedNodeId ? nodes.find(node => node.id === selectedNodeId) : null;



  // Show empty state if no workflows exist
  if (!isLoading && allWorkflows.length === 0) {
    return (
      <div className="h-screen flex flex-col bg-neutral-50">
        <Header 
          workflows={[]}
          currentWorkflow={null}
          onWorkflowSelect={() => {}}
          onCreateWorkflow={handleCreateWorkflow}
          showWorkflowControls={false}
        />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-6">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Welcome to Lynxier
            </h2>
            <p className="text-neutral-600 mb-6">
              Create your first AI-powered automation workflow to get started.
            </p>
            <Button 
              onClick={handleCreateWorkflow}
              disabled={createWorkflowMutation.isPending}
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {createWorkflowMutation.isPending ? "Creating..." : "Create First Workflow"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col bg-neutral-50">
        <Header 
          workflows={[]}
          currentWorkflow={null}
          onWorkflowSelect={() => {}}
          onCreateWorkflow={() => {}}
          showWorkflowControls={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-neutral-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen flex flex-col bg-neutral-50">
        {/* Header with Workflow Switcher */}
        <Header
          workflows={allWorkflows}
          currentWorkflow={currentWorkflow}
          onWorkflowSelect={handleWorkflowSelect}
          onCreateWorkflow={handleCreateWorkflow}
          onSave={handleSave}
          onExecute={handleExecute}
          onDownload={handleDownload}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitView={handleFitView}
          onNameChange={handleNameChange}
          isExecuting={isExecuting}
          isSaving={saveWorkflowMutation.isPending}
          showWorkflowControls={true}
        />

        {/* Main Editor */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Node Library Sidebar */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <NodeSidebar 
                className="h-full border-r-0"
                onNodeSelect={handleNodeAdd}
              />
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-neutral-200/50 hover:bg-neutral-300/50 transition-colors" />

            {/* Main Canvas Area */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <WorkflowCanvas
                workflowId={currentWorkflow?.id}
                initialNodes={nodes}
                initialEdges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
                onNodeSelect={handleNodeSelect}
                onExecute={handleExecute}
                isExecuting={isExecuting}
                className="h-full"
              />
            </ResizablePanel>

            {/* Configuration Panel */}
            {isConfigPanelOpen && selectedNode && (
              <>
                <ResizableHandle className="w-1 bg-neutral-200/50 hover:bg-neutral-300/50 transition-colors" />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                  <NodeConfigPanel
                    node={selectedNode}
                    onClose={() => setIsConfigPanelOpen(false)}
                    onUpdate={(nodeId, updates) => {
                      setNodes(prev => prev.map(node => 
                        node.id === nodeId 
                          ? { ...node, data: { ...node.data, ...updates } }
                          : node
                      ));
                    }}
                    className="h-full border-l-0"
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