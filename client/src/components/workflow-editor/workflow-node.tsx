import { memo, useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  AlertCircle, 
  CheckCircle2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/types";

interface WorkflowNodeProps extends NodeProps<WorkflowNodeData> {
  onConfigure?: (nodeId: string) => void;
  onDuplicate?: (nodeId: string) => void;
  onDelete?: (nodeId: string) => void;
  onToggleDisabled?: (nodeId: string) => void;
}

const WorkflowNode = memo(({ 
  id, 
  data, 
  selected, 
  dragging,
  onConfigure,
  onDuplicate,
  onDelete,
  onToggleDisabled
}: WorkflowNodeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const showControls = (isHovered || selected) && !dragging;
  const isConfigured = data.isConfigured || Object.keys(data.parameters || {}).length > 0;
  const hasErrors = data.hasErrors;
  const isDisabled = data.disabled;

  // Get status indicator
  const getStatusIcon = () => {
    if (hasErrors) {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
    if (isConfigured) {
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    }
    return <div className="w-3 h-3 rounded-full bg-gray-300" />;
  };

  // Get node border style
  const getBorderStyle = () => {
    if (selected) return "border-blue-500 shadow-lg ring-2 ring-blue-500/20";
    if (hasErrors) return "border-red-500 hover:border-red-600";
    if (isDisabled) return "border-gray-300 bg-gray-50";
    return "border-gray-200 hover:border-gray-300";
  };

  return (
    <div 
      className={cn(
        "relative bg-white rounded-lg shadow-sm border-2 transition-all duration-200",
        "min-w-[200px] max-w-[280px] cursor-pointer group",
        getBorderStyle(),
        isDisabled && "opacity-60",
        dragging && "rotate-3 scale-105"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Connection Handles */}
      {data.category !== "trigger" && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            "w-3 h-3 !bg-white !border-2 transition-colors",
            selected ? "!border-blue-500" : "!border-gray-400 hover:!border-gray-600"
          )}
          style={{ left: -6 }}
        />
      )}
      
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "w-3 h-3 !bg-white !border-2 transition-colors",
          selected ? "!border-blue-500" : "!border-gray-400 hover:!border-gray-600"
        )}
        style={{ right: -6 }}
      />

      {/* Node Header */}
      <div 
        className="px-3 py-2 rounded-t-lg flex items-center space-x-2 text-white"
        style={{ backgroundColor: data.color }}
      >
        <div className="w-5 h-5 rounded-sm bg-white/20 flex items-center justify-center">
          <span className="text-xs font-bold">{data.label.charAt(0)}</span>
        </div>
        <span className="font-medium text-sm truncate flex-1">{data.label}</span>
        {getStatusIcon()}
      </div>

      {/* Node Body */}
      <div className="px-3 py-3 rounded-b-lg bg-white">
        {/* Description */}
        {data.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {data.description}
          </p>
        )}

        {/* Parameters Preview */}
        {isConfigured && (
          <div className="flex flex-wrap gap-1 mb-2">
            {Object.entries(data.parameters || {}).slice(0, 3).map(([key, value]) => (
              <Badge key={key} variant="secondary" className="text-xs px-1.5 py-0.5">
                {String(value).substring(0, 15)}
                {String(value).length > 15 && "..."}
              </Badge>
            ))}
            {Object.keys(data.parameters || {}).length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                +{Object.keys(data.parameters || {}).length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Error Message */}
        {hasErrors && data.errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded p-2 mb-2">
            <p className="text-xs text-red-600">{data.errorMessage}</p>
          </div>
        )}

        {/* Notes Preview */}
        {data.notes && (
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <StickyNote className="w-3 h-3" />
            <span className="truncate">{data.notes}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="flex items-center justify-between mt-2">
          <Badge 
            variant="outline" 
            className="text-xs capitalize"
          >
            {data.category}
          </Badge>
          
          {isDisabled && (
            <Badge variant="secondary" className="text-xs">
              Disabled
            </Badge>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      {showControls && (
        <div className="absolute -top-2 -right-2 flex space-x-1 z-10">
          <div className="bg-white border border-gray-200 rounded-md shadow-sm p-1 flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-blue-50"
              onClick={(e) => {
                e.stopPropagation();
                onConfigure?.(id);
              }}
            >
              <Settings className="w-3 h-3 text-gray-600 hover:text-blue-600" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisabled?.(id);
              }}
            >
              {isDisabled ? (
                <Eye className="w-3 h-3 text-gray-600" />
              ) : (
                <EyeOff className="w-3 h-3 text-gray-600" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-50"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate?.(id);
              }}
            >
              <Copy className="w-3 h-3 text-gray-600" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(id);
              }}
            >
              <Trash2 className="w-3 h-3 text-gray-600 hover:text-red-600" />
            </Button>
          </div>
        </div>
      )}

      {/* Execution Status Overlay */}
      {/* This would be populated during workflow execution */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Success overlay */}
        {/* <div className="absolute inset-0 bg-green-500/10 rounded-lg animate-pulse" /> */}
        
        {/* Error overlay */}
        {/* <div className="absolute inset-0 bg-red-500/10 rounded-lg" /> */}
        
        {/* Running overlay */}
        {/* <div className="absolute inset-0 bg-blue-500/10 rounded-lg animate-pulse" /> */}
      </div>
    </div>
  );
});

WorkflowNode.displayName = "WorkflowNode";

export default WorkflowNode;