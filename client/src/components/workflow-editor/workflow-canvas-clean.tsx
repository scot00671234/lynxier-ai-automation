import { useState, useCallback, useMemo, useRef } from "react";
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
  ReactFlowInstance,
  addEdge,
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
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

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

  // Handle node changes with proper ReactFlow integration
  const onNodesChangeHandler = useCallback((changes: any) => {
    setNodes((nds) => {
      let updatedNodes = [...nds];
      
      changes.forEach((change: any) => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === change.id);
        if (nodeIndex === -1) return;
        
        switch (change.type) {
          case "position":
            if (change.position) {
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                position: change.position
              };
            }
            break;
          case "dimensions":
            if (change.dimensions) {
              updatedNodes[nodeIndex] = {
                ...updatedNodes[nodeIndex],
                width: change.dimensions.width,
                height: change.dimensions.height
              };
            }
            break;
          case "select":
            updatedNodes[nodeIndex] = {
              ...updatedNodes[nodeIndex],
              selected: change.selected
            };
            break;
          case "remove":
            updatedNodes = updatedNodes.filter(n => n.id !== change.id);
            break;
        }
      });
      
      onNodesChange(updatedNodes);
      return updatedNodes;
    });
  }, [onNodesChange]);

  // Handle edge changes with proper ReactFlow integration
  const onEdgesChangeHandler = useCallback((changes: any) => {
    setEdges((eds) => {
      let updatedEdges = [...eds];
      
      changes.forEach((change: any) => {
        const edgeIndex = updatedEdges.findIndex(e => e.id === change.id);
        if (edgeIndex === -1) return;
        
        switch (change.type) {
          case "select":
            updatedEdges[edgeIndex] = {
              ...updatedEdges[edgeIndex],
              selected: change.selected
            };
            break;
          case "remove":
            updatedEdges = updatedEdges.filter(e => e.id !== change.id);
            break;
        }
      });
      
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

  // Handle drop from sidebar
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    const nodeData = event.dataTransfer.getData('application/json');
    
    if (!nodeData || !reactFlowInstance || !reactFlowBounds) return;

    try {
      const nodeType = JSON.parse(nodeData);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

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

      setNodes((nds) => {
        const updatedNodes = [...nds, newNode];
        onNodesChange(updatedNodes);
        return updatedNodes;
      });
    } catch (error) {
      console.error("Failed to parse dropped node data:", error);
    }
  }, [reactFlowInstance, onNodesChange]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onInit = useCallback((reactFlowInstance: ReactFlowInstance) => {
    setReactFlowInstance(reactFlowInstance);
  }, []);

  return (
    <div className={`w-full h-full ${className}`} ref={reactFlowWrapper}>
      <ReactFlow
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
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
        className="bg-white"
        panOnScroll
        selectionOnDrag
        panOnDrag={[1, 2]}
        selectionMode="partial"
        snapToGrid={true}
        snapGrid={[15, 15]}
        connectionLineStyle={{ stroke: "#64748b", strokeWidth: 2 }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "#64748b", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color="#f1f5f9" 
          gap={20} 
          size={1}
          variant="dots"
        />
        
        {/* Enhanced Controls */}
        <Controls 
          className="bg-white/90 border border-neutral-200/50 shadow-lg rounded-lg"
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
        
        {/* Clean Stats Panel */}
        <Panel position="bottom-left" className="bg-white/90 border border-neutral-200/50 shadow-lg rounded-lg p-3">
          <div className="flex items-center space-x-4 text-xs text-neutral-600">
            <span className="font-medium">{nodes.length} nodes</span>
            <span className="text-neutral-400">•</span>
            <span className="font-medium">{edges.length} connections</span>
          </div>
        </Panel>

        {/* Clean MiniMap */}
        <MiniMap
          className="bg-white/90 border border-neutral-200/50 shadow-lg rounded-lg overflow-hidden"
          style={{ backgroundColor: "#ffffff" }}
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.color || "#64748b";
          }}
          maskColor="rgba(100, 116, 139, 0.1)"
        />

        {/* Clean Empty State */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-12 bg-white/95 backdrop-blur-sm rounded-2xl border border-neutral-200/50 shadow-xl max-w-lg">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-2xl flex items-center justify-center">
                <Play className="w-10 h-10 text-neutral-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-3">Start Building</h3>
              <p className="text-neutral-600 leading-relaxed">
                Drag nodes from the left sidebar to create your automation workflow. 
                Connect them together to define how data flows between steps.
              </p>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}