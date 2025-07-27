import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Keyboard, 
  Brain, 
  Mail, 
  GitBranch,
  Edit,
  Trash2,
  ListEnd
} from "lucide-react";
import type { WorkflowStep } from "@shared/schema";

interface StepListProps {
  steps: WorkflowStep[];
  onEditStep: (step: WorkflowStep) => void;
  workflowId: string;
}

const getStepIcon = (type: string) => {
  switch (type) {
    case "file-upload":
      return Upload;
    case "text-input":
      return Keyboard;
    case "ai-processing":
      return Brain;
    case "email":
      return Mail;
    case "conditional":
      return GitBranch;
    default:
      return ListEnd;
  }
};

const getStepTypeColor = (type: string) => {
  switch (type) {
    case "file-upload":
      return "bg-blue-100 text-blue-700";
    case "text-input":
      return "bg-green-100 text-green-700";
    case "ai-processing":
      return "bg-purple-100 text-purple-700";
    case "email":
      return "bg-orange-100 text-orange-700";
    case "conditional":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStepTypeName = (type: string) => {
  switch (type) {
    case "file-upload":
      return "File Upload";
    case "text-input":
      return "Text Input";
    case "ai-processing":
      return "AI Processing";
    case "email":
      return "Email";
    case "conditional":
      return "If/Then Logic";
    default:
      return type;
  }
};

export default function StepList({ steps, onEditStep, workflowId }: StepListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) => apiRequest("DELETE", `/api/steps/${stepId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Step deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "steps"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete step.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteStep = (stepId: string) => {
    if (confirm("Are you sure you want to delete this step?")) {
      deleteStepMutation.mutate(stepId);
    }
  };

  if (steps.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ListEnd className="text-slate-400 w-8 h-8" />
        </div>
        <h4 className="text-lg font-medium text-slate-900 mb-2">No steps added yet</h4>
        <p className="text-slate-600 mb-6">Start building your workflow by adding the first step</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {steps.map((step) => {
        const IconComponent = getStepIcon(step.type);
        return (
          <div
            key={step.id}
            className="flex items-center space-x-4 p-4 border border-slate-200 rounded-lg"
          >
            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium">
              <span>{step.order}</span>
            </div>
            <div className="flex-grow">
              <div className="flex items-center space-x-3 mb-1">
                <h4 className="font-medium text-slate-900">{step.name}</h4>
                <Badge className={getStepTypeColor(step.type)}>
                  {getStepTypeName(step.type)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {step.config && typeof step.config === 'object' 
                  ? (step.config as any).instructions || "Step configuration" 
                  : "Step configuration"
                }
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditStep(step)}
                className="text-slate-400 hover:text-slate-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteStep(step.id)}
                disabled={deleteStepMutation.isPending}
                className="text-slate-400 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
