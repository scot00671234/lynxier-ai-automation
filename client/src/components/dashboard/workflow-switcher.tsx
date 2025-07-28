import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  ChevronDown, 
  Search, 
  Plus,
  Clock,
  Play,
  Edit,
  FileText
} from "lucide-react";
import { Workflow } from "@/shared/schema";

interface WorkflowSwitcherProps {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  onWorkflowSelect: (workflow: Workflow) => void;
  onCreateNew: () => void;
  className?: string;
}

export function WorkflowSwitcher({
  workflows,
  currentWorkflow,
  onWorkflowSelect,
  onCreateNew,
  className = ""
}: WorkflowSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`justify-between h-10 min-w-[240px] glass border-neutral-200/50 hover:bg-neutral-100/50 ${className}`}
        >
          <div className="flex items-center space-x-2 flex-1">
            <FileText className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-medium truncate">
              {currentWorkflow?.name || "Select Workflow"}
            </span>
            {currentWorkflow && (
              <Badge 
                variant="secondary" 
                className={`text-xs h-5 ${getStatusColor(currentWorkflow.status)}`}
              >
                {currentWorkflow.status}
              </Badge>
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-neutral-400" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0 glass border-neutral-200/50" align="start">
        {/* Header */}
        <div className="p-3 border-b border-neutral-200/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm text-neutral-900">Workflows</h4>
            <Button
              size="sm"
              onClick={() => {
                onCreateNew();
                setOpen(false);
              }}
              className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              New
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 border-neutral-200/50 focus:border-neutral-400 focus:ring-0 bg-white/50 text-sm"
            />
          </div>
        </div>

        {/* Workflow List */}
        <div className="max-h-64 overflow-y-auto">
          {filteredWorkflows.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 text-sm">
              {searchTerm ? "No workflows found" : "No workflows yet"}
            </div>
          ) : (
            <div className="p-1">
              {filteredWorkflows.map((workflow) => (
                <button
                  key={workflow.id}
                  onClick={() => {
                    onWorkflowSelect(workflow);
                    setOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md hover:bg-neutral-100/50 transition-colors ${
                    currentWorkflow?.id === workflow.id ? 'bg-neutral-100/50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-sm text-neutral-900 truncate">
                          {workflow.name}
                        </span>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs h-4 px-1.5 ${getStatusColor(workflow.status)}`}
                        >
                          {workflow.status}
                        </Badge>
                      </div>
                      
                      {workflow.description && (
                        <p className="text-xs text-neutral-500 line-clamp-2 mb-1">
                          {workflow.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-3 text-xs text-neutral-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {workflow.updatedAt 
                              ? new Date(workflow.updatedAt).toLocaleDateString()
                              : 'Never'
                            }
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Edit className="w-3 h-3" />
                          <span>0 nodes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}