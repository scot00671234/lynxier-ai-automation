import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  PenTool, 
  Mail, 
  Play, 
  MoreHorizontal,
  Edit
} from "lucide-react";
import type { Workflow } from "@shared/schema";

interface WorkflowCardProps {
  workflow: Workflow;
}

const getWorkflowIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("resume") || lowerName.includes("screening")) {
    return FileText;
  }
  if (lowerName.includes("content") || lowerName.includes("writing")) {
    return PenTool;
  }
  if (lowerName.includes("email") || lowerName.includes("outreach")) {
    return Mail;
  }
  return FileText;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-gray-100 text-gray-700";
    case "inactive":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function WorkflowCard({ workflow }: WorkflowCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const IconComponent = getWorkflowIcon(workflow.name);

  const executeWorkflowMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/workflows/${workflow.id}/execute`),
    onSuccess: (response) => {
      const execution = response.json();
      toast({
        title: "Workflow Started",
        description: "Your workflow is now running.",
      });
      // Navigate to execution page
      window.location.href = `/workflows/${workflow.id}/execute`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to start workflow execution.",
        variant: "destructive",
      });
    },
  });

  const handleRunWorkflow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (workflow.status !== "active") {
      toast({
        title: "Cannot Run Workflow",
        description: "Only active workflows can be executed.",
        variant: "destructive",
      });
      return;
    }
    executeWorkflowMutation.mutate();
  };

  return (
    <Link href={`/workflows/${workflow.id}/edit`}>
      <Card className="border border-slate-200 hover:shadow-lg transition-shadow cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <IconComponent className="text-primary w-6 h-6" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(workflow.status)}>
                {workflow.status === "active" ? "Active" : workflow.status === "draft" ? "Draft" : "Inactive"}
              </Badge>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{workflow.name}</h3>
          <p className="text-slate-600 text-sm mb-4 line-clamp-2">
            {workflow.description || "No description provided"}
          </p>
          
          <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
            <span>Created {workflow.createdAt ? new Date(workflow.createdAt).toLocaleDateString() : "N/A"}</span>
            <span>Updated {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : "N/A"}</span>
          </div>
        </CardContent>
        
        <div className="border-t border-slate-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {workflow.status === "active" ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary-hover font-medium"
                onClick={handleRunWorkflow}
                disabled={executeWorkflowMutation.isPending}
              >
                <Play className="w-4 h-4 mr-1" />
                {executeWorkflowMutation.isPending ? "Starting..." : "Run Now"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 font-medium"
                asChild
              >
                <Link href={`/workflows/${workflow.id}/edit`}>
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-600">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}
