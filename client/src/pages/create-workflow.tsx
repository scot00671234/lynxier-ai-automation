import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StepList from "@/components/step-list";
import AddStepModal from "@/components/add-step-modal";
import StepConfigModal from "@/components/step-config-modal";
import { ArrowLeft, Plus, Save } from "lucide-react";
import type { Workflow, WorkflowStep } from "@shared/schema";

const workflowFormSchema = z.object({
  name: z.string().min(1, "Workflow name is required"),
  description: z.string().optional(),
});

type WorkflowFormData = z.infer<typeof workflowFormSchema>;

export default function CreateWorkflow() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const workflowId = params.id;
  const isEditing = !!workflowId;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showAddStepModal, setShowAddStepModal] = useState(false);
  const [showStepConfigModal, setShowStepConfigModal] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<string>("");
  const [editingStep, setEditingStep] = useState<WorkflowStep | null>(null);

  // Fetch workflow data if editing
  const { data: workflow } = useQuery<Workflow>({
    queryKey: ["/api/workflows", workflowId],
    enabled: isEditing,
  });

  // Fetch workflow steps
  const { data: steps = [] } = useQuery<WorkflowStep[]>({
    queryKey: ["/api/workflows", workflowId, "steps"],
    enabled: isEditing,
  });

  const form = useForm<WorkflowFormData>({
    resolver: zodResolver(workflowFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when workflow data loads
  useEffect(() => {
    if (workflow) {
      form.reset({
        name: workflow.name,
        description: workflow.description || "",
      });
    }
  }, [workflow, form]);

  const createWorkflowMutation = useMutation({
    mutationFn: (data: WorkflowFormData) => 
      apiRequest("POST", "/api/workflows", data),
    onSuccess: async (response) => {
      const newWorkflow = await response.json();
      toast({
        title: "Success",
        description: "Workflow created successfully.",
      });
      setLocation(`/workflows/${newWorkflow.id}/edit`);
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow.",
        variant: "destructive",
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: (data: WorkflowFormData) => 
      apiRequest("PUT", `/api/workflows/${workflowId}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workflow updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workflow.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WorkflowFormData) => {
    if (isEditing) {
      updateWorkflowMutation.mutate(data);
    } else {
      createWorkflowMutation.mutate(data);
    }
  };

  const handleStepTypeSelect = (stepType: string) => {
    setSelectedStepType(stepType);
    setShowAddStepModal(false);
    setEditingStep(null);
    setShowStepConfigModal(true);
  };

  const handleEditStep = (step: WorkflowStep) => {
    setEditingStep(step);
    setSelectedStepType(step.type);
    setShowStepConfigModal(true);
  };

  const handleStepSaved = () => {
    setShowStepConfigModal(false);
    setEditingStep(null);
    setSelectedStepType("");
    if (workflowId) {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows", workflowId, "steps"] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
              {isEditing ? "Edit Workflow" : "Create New Workflow"}
            </h2>
            <p className="text-slate-600">Build your AI automation step by step</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => setLocation("/")}
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={createWorkflowMutation.isPending || updateWorkflowMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {createWorkflowMutation.isPending || updateWorkflowMutation.isPending 
              ? "Saving..." 
              : "Save Workflow"
            }
          </Button>
        </div>
      </div>

      {/* Workflow Name */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Workflow Name
              </Label>
              <Input
                id="name"
                placeholder="Enter a descriptive name for your workflow"
                {...form.register("name")}
                className="w-full"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                Description (Optional)
              </Label>
              <Input
                id="description"
                placeholder="Brief description of what this workflow does"
                {...form.register("description")}
                className="w-full"
              />
            </div>
          </form>
          <p className="text-sm text-slate-500 mt-2">
            Choose a clear name that describes what this workflow does
          </p>
        </CardContent>
      </Card>

      {/* Steps Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-900">Workflow Steps</h3>
            <Button
              onClick={() => setShowAddStepModal(true)}
              disabled={!workflowId}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Step
            </Button>
          </div>

          {workflowId ? (
            <StepList 
              steps={steps} 
              onEditStep={handleEditStep}
              workflowId={workflowId}
            />
          ) : (
            <div className="text-center py-8 text-slate-500">
              Save the workflow first to add steps
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStepModal
        open={showAddStepModal}
        onOpenChange={setShowAddStepModal}
        onStepTypeSelect={handleStepTypeSelect}
      />

      <StepConfigModal
        open={showStepConfigModal}
        onOpenChange={setShowStepConfigModal}
        stepType={selectedStepType}
        workflowId={workflowId || ""}
        editingStep={editingStep}
        onStepSaved={handleStepSaved}
      />
    </div>
  );
}
