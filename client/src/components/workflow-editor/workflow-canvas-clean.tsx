import { useState, useCallback, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  Node,
  Edge,
  NodeTypes,
  ConnectionLineType,
  useReactFlow,
} from "reactflow";
import { Play } from "lucide-react";
import "reactflow/dist/style.css";
import WorkflowNode from "./workflow-node";
import type { 
  WorkflowNode as WorkflowNodeType, 
  WorkflowEdge, 
  NodeType,
  WorkflowNodeData 
} from "@/lib/types";

interface WorkflowCanvasProps {
  workflowId?: string;
  initialNodes?: WorkflowNodeType[];
  initialEdges?: WorkflowEdge[];
  onNodesChange?: (nodes: WorkflowNodeType[]) => void;
  onEdgesChange?: (edges: WorkflowEdge[]) => void;
  onNodeSelect?: (nodeId: string | null) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
  className?: string;
}

export default function WorkflowCanvas({
  workflowId,
  initialNodes = [],
  initialEdges = [],
  onNodesChange = () => {},
  onEdgesChange = () => {},
  onNodeSelect = () => {},
  onExecute = () => {},
  isExecuting = false,
  className = "",
}: WorkflowCanvasProps) {
  const [nodes, setNodes] = useState<WorkflowNodeType[]>(initialNodes);
  const [edges, setEdges] = useState<WorkflowEdge[]>(initialEdges);

  // Update local state when props change
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  useMemo(() => {
    setEdges(initialEdges);
  }, [initialEdges]);

  // Node types configuration
  const nodeTypes: NodeTypes = useMemo(
    () => ({
      workflowNode: WorkflowNode,
    }),
    []
  );

  // Handle node changes
  const onNodesChangeHandler = useCallback((changes: any) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        const change = changes.find((c: any) => c.id === node.id);
        if (change) {
          if (change.type === "position" && change.position) {
            return { ...node, position: change.position };
          }
          if (change.type === "remove") {
            return null;
          }
        }
        return node;
      }).filter(Boolean) as WorkflowNodeType[];
      
      onNodesChange(updatedNodes);
      return updatedNodes;
    });
  }, [onNodesChange]);

  // Handle edge changes
  const onEdgesChangeHandler = useCallback((changes: any) => {
    setEdges((eds) => {
      const updatedEdges = eds.map((edge) => {
        const change = changes.find((c: any) => c.id === edge.id);
        if (change && change.type === "remove") {
          return null;
        }
        return edge;
      }).filter(Boolean) as WorkflowEdge[];
      
      onEdgesChange(updatedEdges);
      return updatedEdges;
    });
  }, [onEdgesChange]);

  // Handle new connections
  const onConnect = useCallback((connection: any) => {
    const newEdge: WorkflowEdge = {
      id: `edge-${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: "smoothstep",
      style: { stroke: "#64748b", strokeWidth: 2 },
    };
    
    setEdges((eds) => {
      const updatedEdges = [...eds, newEdge];
      onEdgesChange(updatedEdges);
      return updatedEdges;
    });
  }, [onEdgesChange]);

  // Handle node clicks
  const onNodeClick = useCallback((event: any, node: WorkflowNodeType) => {
    onNodeSelect(node.id);
  }, [onNodeSelect]);

  // Handle canvas clicks
  const onPaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <div className={`w-full h-full ${className}`}>
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
        className="bg-neutral-50"
        connectionLineStyle={{ stroke: "#64748b", strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#64748b", strokeWidth: 2 },
        }}
      >
        <Background color="#e2e8f0" gap={20} />
        
        {/* Main Controls */}
        <Controls 
          className="glass border-neutral-200/50 vercel-shadow"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
        
        {/* Workflow Stats */}
        <Panel position="bottom-left" className="glass border-neutral-200/50 rounded-lg vercel-shadow p-3">
          <div className="flex items-center space-x-4 text-xs text-neutral-600">
            <span>{nodes.length} nodes</span>
            <span>{edges.length} connections</span>
            {workflowId && <span>ID: {workflowId.slice(0, 8)}...</span>}
          </div>
        </Panel>

        {/* MiniMap */}
        <MiniMap
          className="glass border-neutral-200/50 vercel-shadow"
          style={{ backgroundColor: "#f8fafc" }}
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.color || "#64748b";
          }}
        />

        {/* Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-lg border border-neutral-200/50 vercel-shadow">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                <Play className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Start Building Your Workflow</h3>
              <p className="text-neutral-500 max-w-md">
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