import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Play,
  Edit,
  Trash2,
  Search,
  Calendar,
  Clock,
  Settings,
  TrendingUp,
  Workflow as WorkflowIcon
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import type { Workflow } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch workflows
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"]
  });

  // Delete workflow mutation
  const deleteWorkflowMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/workflows/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Workflow Deleted",
        description: "The workflow has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter workflows based on search
  const filteredWorkflows = workflows.filter(workflow =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workflow.description && workflow.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateWorkflow = () => {
    setLocation("/workflows/new");
  };

  const handleEditWorkflow = (id: string) => {
    setLocation(`/workflows/${id}/edit`);
  };

  const handleExecuteWorkflow = (id: string) => {
    setLocation(`/workflows/${id}/execute`);
  };

  const handleDeleteWorkflow = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      deleteWorkflowMutation.mutate(id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      case "inactive": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lynxier Workflows</h1>
              <p className="mt-2 text-gray-600">Create and manage your automation workflows</p>
            </div>
            
            <Button onClick={handleCreateWorkflow} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <WorkflowIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Workflows</p>
                    <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Play className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflows.filter(w => w.status === "active").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Edit className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Draft</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {workflows.filter(w => w.status === "draft").length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Executions</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-12">
            {workflows.length === 0 ? (
              <div>
                <WorkflowIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first automation workflow.</p>
                <Button onClick={handleCreateWorkflow} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Workflow
                </Button>
              </div>
            ) : (
              <div>
                <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-500">Try adjusting your search terms.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-1">
                        {workflow.name}
                      </CardTitle>
                      {workflow.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {workflow.description}
                        </p>
                      )}
                    </div>
                    <Badge className={`ml-2 text-xs border ${getStatusColor(workflow.status)}`}>
                      {workflow.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(workflow.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(workflow.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditWorkflow(workflow.id)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExecuteWorkflow(workflow.id)}
                      className="flex-1"
                      disabled={workflow.status !== "active"}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Run
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}