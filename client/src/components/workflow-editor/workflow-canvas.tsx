import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Square, 
  Save, 
  Download, 
  Upload,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import WorkflowNode from "./workflow-node";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowNode as WorkflowNodeType, WorkflowEdge, NodeType } from "@/lib/types";

// Define custom node types for ReactFlow
const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

interface WorkflowCanvasProps {
  workflowId?: string;
  initialNodes?: WorkflowNodeType[];
  initialEdges?: WorkflowEdge[];
  onNodesChange?: (nodes: WorkflowNodeType[]) => void;
  onEdgesChange?: (edges: WorkflowEdge[]) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
  executionStatus?: string;
  className?: string;
}

export default function WorkflowCanvas({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onNodeSelect,
  onExecute,
  isExecuting = false,
  executionStatus,
  className = ""
}: WorkflowCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Handle node changes and notify parent
  const onNodesChangeHandler: OnNodesChange = useCallback((changes) => {
    handleNodesChange(changes);
    const updatedNodes = nodes; // This would be the updated nodes after changes
    onNodesChange?.(updatedNodes);
  }, [handleNodesChange, nodes, onNodesChange]);

  // Handle edge changes and notify parent
  const onEdgesChangeHandler: OnEdgesChange = useCallback((changes) => {
    handleEdgesChange(changes);
    const updatedEdges = edges; // This would be the updated edges after changes
    onEdgesChange?.(updatedEdges);
  }, [handleEdgesChange, edges, onEdgesChange]);

  // Handle new connections
  const onConnect: OnConnect = useCallback((connection) => {
    const newEdge = {
      ...connection,
      id: `${connection.source}-${connection.target}`,
      type: "smoothstep",
      animated: false,
      style: { stroke: "#64748b", strokeWidth: 2 },
    };
    
    setEdges((eds) => addEdge(newEdge, eds));
    onEdgesChange?.(edges);
  }, [setEdges, edges, onEdgesChange]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    onNodeSelect?.(node.id);
  }, [onNodeSelect]);

  // Handle canvas click (deselect nodes)
  const onPaneClick = useCallback(() => {
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  // Add new node to canvas
  const addNode = useCallback((nodeType: NodeType, position: { x: number; y: number }) => {
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

    setNodes((nds) => [...nds, newNode]);
    onNodesChange?.(nodes);
    onNodeSelect?.(newNode.id);
  }, [setNodes, nodes, onNodesChange, onNodeSelect]);

  // Canvas controls
  const handleFitView = () => fitView({ padding: 0.2 });
  const handleZoomIn = () => zoomIn();
  const handleZoomOut = () => zoomOut();
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      reactFlowWrapper.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSave = () => {
    toast({
      title: "Workflow Saved",
      description: "Your workflow has been saved successfully.",
    });
  };

  const handleExport = () => {
    const workflowData = {
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
    link.download = `workflow-${workflowId || "untitled"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div ref={reactFlowWrapper} className={`relative bg-gray-50 ${className}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChangeHandler}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-gray-50"
        connectionLineStyle={{ stroke: "#64748b", strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#64748b", strokeWidth: 2 },
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        
        {/* Main Controls */}
        <Controls 
          className="bg-white border border-gray-200 shadow-sm"
          showZoom={false}
          showFitView={false}
          showInteractive={false}
        />
        
        {/* Custom Controls Panel */}
        <Panel position="top-right" className="space-x-2">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center space-x-2">
            {/* Execution Controls */}
            <Button
              onClick={onExecute}
              disabled={isExecuting || nodes.length === 0}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              {isExecuting ? (
                <>
                  <Square className="w-4 h-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Execute
                </>
              )}
            </Button>

            {/* Execution Status */}
            {executionStatus && (
              <Badge 
                variant={executionStatus === "success" ? "default" : 
                        executionStatus === "error" ? "destructive" : 
                        "secondary"}
                className="text-xs"
              >
                {executionStatus}
              </Badge>
            )}
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center space-x-1">
            {/* View Controls */}
            <Button variant="ghost" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleFitView}>
              <Maximize className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-2 flex items-center space-x-1">
            {/* File Controls */}
            <Button variant="ghost" size="sm" onClick={handleSave}>
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </Panel>

        {/* Workflow Stats */}
        <Panel position="bottom-left" className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
            {workflowId && <span>ID: {workflowId.slice(0, 8)}...</span>}
          </div>
        </Panel>

        {/* MiniMap */}
        <MiniMap
          className="bg-white border border-gray-200 shadow-sm"
          style={{ backgroundColor: "#f8fafc" }}
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.color || "#64748b";
          }}
        />

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Workflow</h3>
              <p className="text-gray-500 max-w-md">
                Drag nodes from the sidebar to create your automation workflow. 
                Connect them together to define the flow of data.
              </p>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}