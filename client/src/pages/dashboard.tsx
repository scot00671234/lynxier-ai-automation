import { useCallback, useState, useRef, DragEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Trash2,
  Settings,
  Copy,
  Delete,
  ZoomIn,
  ZoomOut,
  Maximize
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StepConfigModal from "@/components/step-config-modal";
import type { Workflow, WorkflowStep } from "@shared/schema";

// Professional workflow node component with proper handles
function WorkflowNode({ data, selected, id }: { data: any; selected?: boolean; id: string }) {
  const [isHovered, setIsHovered] = useState(false);

  const getNodeIcon = (type: string) => {
    switch (type) {
      case "file_upload": return <FileUp className="w-4 h-4" />;
      case "text_input": return <Type className="w-4 h-4" />;
      case "ai_process": return <Brain className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "conditional": return <GitBranch className="w-4 h-4" />;
      case "start": return <Play className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "file_upload": return { bg: "bg-blue-500", text: "text-white", border: "border-blue-500" };
      case "text_input": return { bg: "bg-green-500", text: "text-white", border: "border-green-500" };
      case "ai_process": return { bg: "bg-purple-500", text: "text-white", border: "border-purple-500" };
      case "email": return { bg: "bg-orange-500", text: "text-white", border: "border-orange-500" };
      case "conditional": return { bg: "bg-yellow-500", text: "text-white", border: "border-yellow-500" };
      case "start": return { bg: "bg-lynxier-blue", text: "text-white", border: "border-lynxier-blue" };
      default: return { bg: "bg-gray-500", text: "text-white", border: "border-gray-500" };
    }
  };

  const colors = getNodeColor(data.type);
  const showControls = isHovered || selected;

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      {data.type !== "start" && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 !bg-gray-400 !border-2 !border-white hover:!bg-gray-600 transition-colors"
          style={{ left: -6 }}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-gray-400 !border-2 !border-white hover:!bg-gray-600 transition-colors"
        style={{ right: -6 }}
      />

      {/* Node Body */}
      <div className={`
        relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200
        ${selected ? colors.border + ' shadow-lg' : 'border-gray-200 hover:border-gray-300'}
        ${showControls ? 'shadow-lg' : ''}
        min-w-[180px] cursor-pointer
      `}>
        {/* Node Header */}
        <div className={`
          ${colors.bg} ${colors.text} px-3 py-2 rounded-t-md flex items-center space-x-2
        `}>
          {getNodeIcon(data.type)}
          <span className="font-medium text-sm truncate">{data.label}</span>
        </div>

        {/* Node Content */}
        <div className="px-3 py-2 bg-white rounded-b-md">
          {data.description && (
            <p className="text-xs text-gray-600 mb-2">{data.description}</p>
          )}
          
          {/* Status indicator */}
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-xs text-gray-500">Ready</span>
          </div>
        </div>

        {/* Node Controls (show on hover/select) */}
        {showControls && data.type !== "start" && (
          <div className="absolute -top-8 right-0 flex space-x-1 bg-white rounded-md shadow-md border p-1">
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                data.onConfigure?.(id);
              }}
            >
              <Settings className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                data.onCopy?.(id);
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-6 h-6 p-0 hover:bg-red-100 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                data.onDelete?.(id);
              }}
            >
              <Delete className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// Node palette item for drag and drop
function NodePaletteItem({ type, label, icon: Icon, color }: { 
  type: string; 
  label: string; 
  icon: any; 
  color: string; 
}) {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`
        ${color} text-white px-3 py-2 rounded-md flex items-center space-x-2 
        cursor-grab active:cursor-grabbing hover:opacity-90 transition-opacity
        text-sm whitespace-nowrap select-none
      `}
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  workflowNode: WorkflowNode,
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'workflowNode',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start',
      type: 'start',
      description: 'Workflow begins here'
    },
  },
];

const initialEdges: Edge[] = [];

// Define node palette configuration
const NODE_PALETTE = [
  { type: "file_upload", label: "File Upload", icon: FileUp, color: "bg-blue-500" },
  { type: "text_input", label: "Text Input", icon: Type, color: "bg-green-500" },
  { type: "ai_process", label: "AI Process", icon: Brain, color: "bg-purple-500" },
  { type: "email", label: "Send Email", icon: Mail, color: "bg-orange-500" },
  { type: "conditional", label: "Conditional", icon: GitBranch, color: "bg-yellow-500" },
];

function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedNodeForConfig, setSelectedNodeForConfig] = useState<Node | null>(null);
  const { screenToFlowPosition } = useReactFlow();

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

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Node interaction handlers
  const handleNodeConfigure = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Create a temporary workflow if none exists for configuration
      if (!currentWorkflow) {
        const tempWorkflow = {
          id: 'temp-workflow',
          name: 'Temporary Workflow',
          description: 'Temporary workflow for node configuration',
          status: 'draft' as const,
        };
        setCurrentWorkflow(tempWorkflow);
      }
      setSelectedNodeForConfig(node);
      setConfigModalOpen(true);
    }
  }, [nodes, currentWorkflow]);

  const handleNodeCopy = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      const newNode: Node = {
        ...node,
        id: `${node.data.type}_${Date.now()}`,
        position: {
          x: node.position.x + 50,
          y: node.position.y + 50,
        },
        data: {
          ...node.data,
          label: `${node.data.label} (Copy)`,
        },
      };
      setNodes((nds) => nds.concat(newNode));
      toast({
        title: "Node copied",
        description: "The node has been duplicated successfully.",
      });
    }
  }, [nodes, setNodes, toast]);

  const handleNodeDelete = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    toast({
      title: "Node deleted",
      description: "The node and its connections have been removed.",
    });
  }, [setNodes, setEdges, toast]);

  const onNodesChangeHandler: OnNodesChange = useCallback(
    (changes) => onNodesChange(changes),
    [onNodesChange]
  );

  const onEdgesChangeHandler: OnEdgesChange = useCallback(
    (changes) => onEdgesChange(changes),
    [onEdgesChange]
  );

  // Handle drag and drop from palette
  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}_${Date.now()}`,
        type: 'workflowNode',
        position,
        data: {
          label: getStepLabel(type),
          type,
          description: getStepDescription(type),
          onConfigure: handleNodeConfigure,
          onCopy: handleNodeCopy,
          onDelete: handleNodeDelete,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

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

  const fitView = () => {
    // Implementation will be handled by ReactFlow's fitView function
  };

  return (
    <div className="h-full flex">
      {/* Left Sidebar - Node Palette */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-1">Add Nodes</h3>
          <p className="text-xs text-slate-500">Drag nodes to canvas to build your workflow</p>
        </div>

        {/* Node Palette */}
        <div className="p-4 space-y-3 flex-1 overflow-y-auto">
          {NODE_PALETTE.map((nodeConfig) => (
            <NodePaletteItem
              key={nodeConfig.type}
              type={nodeConfig.type}
              label={nodeConfig.label}
              icon={nodeConfig.icon}
              color={nodeConfig.color}
            />
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Nodes</span>
            <Badge variant="outline" className="text-xs">
              {nodes.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Connections</span>
            <Badge variant="outline" className="text-xs">
              {edges.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-slate-200 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-slate-900">Workflow Canvas</h1>
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

        {/* Canvas */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChangeHandler}
            onEdgesChange={onEdgesChangeHandler}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{
              padding: 0.2,
              maxZoom: 1.5,
            }}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            minZoom={0.1}
            maxZoom={2}
            attributionPosition="bottom-left"
            className="bg-slate-50"
            connectionLineStyle={{ strokeWidth: 2, stroke: '#94a3b8' }}
            defaultEdgeOptions={{
              style: { strokeWidth: 2, stroke: '#64748b' },
              type: 'smoothstep',
            }}
          >
            {/* Enhanced Controls */}
            <Controls 
              className="bg-white border border-slate-200 rounded-lg shadow-sm"
              showInteractive={false}
            />
            
            {/* Professional Background */}
            <Background 
              color="#cbd5e1" 
              gap={20} 
              size={1}
            />
            
            {/* Enhanced MiniMap */}
            <MiniMap 
              className="bg-white border border-slate-200 rounded-lg shadow-sm"
              nodeColor={(node) => {
                switch (node.data.type) {
                  case 'start': return '#5A6B7D';
                  case 'file_upload': return '#3b82f6';
                  case 'text_input': return '#10b981';
                  case 'ai_process': return '#8b5cf6';
                  case 'email': return '#f59e0b';
                  case 'conditional': return '#eab308';
                  default: return '#6b7280';
                }
              }}
              maskColor="rgba(100, 116, 139, 0.1)"
              nodeStrokeWidth={2}
              zoomable
              pannable
            />
          </ReactFlow>
        </div>
      </div>

      {/* Node Configuration Modal */}
      {selectedNodeForConfig && (
        <StepConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          stepType={selectedNodeForConfig.data.type}
          workflowId={currentWorkflow?.id || 'temp-workflow'}
          onStepSaved={() => {
            setConfigModalOpen(false);
            setSelectedNodeForConfig(null);
            toast({
              title: "Node configured",
              description: "Your node settings have been saved.",
            });
          }}
        />
      )}
    </div>
  );
}

// Wrapper component with ReactFlowProvider
export default function DashboardWithProvider() {
  return (
    <ReactFlowProvider>
      <Dashboard />
    </ReactFlowProvider>
  );
}
