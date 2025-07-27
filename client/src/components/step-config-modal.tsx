import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowStep } from "@shared/schema";

interface StepConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepType: string;
  workflowId: string;
  editingStep?: WorkflowStep | null;
  onStepSaved: () => void;
}

const baseStepSchema = z.object({
  name: z.string().min(1, "Step name is required"),
  order: z.number().min(1),
});

const fileUploadConfigSchema = baseStepSchema.extend({
  config: z.object({
    allowedTypes: z.array(z.string()).default(["pdf", "docx"]),
    maxSize: z.number().default(5000000),
  }),
});

const textInputConfigSchema = baseStepSchema.extend({
  config: z.object({
    placeholder: z.string().optional(),
    required: z.boolean().default(true),
  }),
});

const aiProcessingConfigSchema = baseStepSchema.extend({
  config: z.object({
    task: z.enum(["summarize", "rewrite", "analyze", "extract", "generate"]),
    instructions: z.string().min(1, "Instructions are required"),
    inputSource: z.string().min(1, "Input source is required"),
  }),
});

const emailConfigSchema = baseStepSchema.extend({
  config: z.object({
    to: z.string().email("Valid email is required"),
    subject: z.string().min(1, "Subject is required"),
    template: z.string().min(1, "Template is required"),
  }),
});

const conditionalConfigSchema = baseStepSchema.extend({
  config: z.object({
    condition: z.string().min(1, "Condition is required"),
    skipStepIds: z.array(z.string()).default([]),
  }),
});

type StepFormData = z.infer<typeof baseStepSchema> & {
  config: any;
};

export default function StepConfigModal({ 
  open, 
  onOpenChange, 
  stepType, 
  workflowId, 
  editingStep,
  onStepSaved 
}: StepConfigModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const getSchema = () => {
    switch (stepType) {
      case "file-upload":
        return fileUploadConfigSchema;
      case "text-input":
        return textInputConfigSchema;
      case "ai-processing":
        return aiProcessingConfigSchema;
      case "email":
        return emailConfigSchema;
      case "conditional":
        return conditionalConfigSchema;
      default:
        return baseStepSchema.extend({
          config: z.object({}),
        });
    }
  };

  const form = useForm<StepFormData>({
    resolver: zodResolver(getSchema()),
    defaultValues: {
      name: "",
      order: 1,
      config: {},
    },
  });

  // Reset form when modal opens or step changes
  useEffect(() => {
    if (open) {
      if (editingStep) {
        form.reset({
          name: editingStep.name,
          order: editingStep.order,
          config: editingStep.config as any,
        });
      } else {
        // Get next order number
        const steps = queryClient.getQueryData(["/api/workflows", workflowId, "steps"]) as WorkflowStep[] || [];
        const nextOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) + 1 : 1;
        form.reset({
          name: getDefaultStepName(stepType),
          order: nextOrder,
          config: getDefaultConfig(stepType),
        });
      }
    }
  }, [open, editingStep, stepType, form, queryClient, workflowId]);

  const createStepMutation = useMutation({
    mutationFn: (data: StepFormData) => 
      apiRequest("POST", `/api/workflows/${workflowId}/steps`, {
        ...data,
        type: stepType,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Step added successfully.",
      });
      onStepSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add step.",
        variant: "destructive",
      });
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: (data: StepFormData) => 
      apiRequest("PUT", `/api/steps/${editingStep?.id}`, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Step updated successfully.",
      });
      onStepSaved();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update step.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StepFormData) => {
    if (editingStep) {
      updateStepMutation.mutate(data);
    } else {
      createStepMutation.mutate(data);
    }
  };

  const getDefaultStepName = (type: string) => {
    switch (type) {
      case "file-upload":
        return "Upload File";
      case "text-input":
        return "Text Input";
      case "ai-processing":
        return "AI Processing";
      case "email":
        return "Send Email";
      case "conditional":
        return "If/Then Logic";
      default:
        return "New Step";
    }
  };

  const getDefaultConfig = (type: string) => {
    switch (type) {
      case "file-upload":
        return { allowedTypes: ["pdf", "docx"], maxSize: 5000000 };
      case "text-input":
        return { placeholder: "", required: true };
      case "ai-processing":
        return { task: "summarize", instructions: "", inputSource: "" };
      case "email":
        return { to: "", subject: "", template: "" };
      case "conditional":
        return { condition: "", skipStepIds: [] };
      default:
        return {};
    }
  };

  const renderConfigFields = () => {
    switch (stepType) {
      case "ai-processing":
        return (
          <>
            <div>
              <Label htmlFor="task">AI Task</Label>
              <Select
                value={form.watch("config.task")}
                onValueChange={(value) => form.setValue("config.task", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose AI task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summarize">Summarize text</SelectItem>
                  <SelectItem value="rewrite">Rewrite content</SelectItem>
                  <SelectItem value="analyze">Analyze sentiment</SelectItem>
                  <SelectItem value="extract">Extract key information</SelectItem>
                  <SelectItem value="generate">Generate response</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Provide specific instructions for the AI..."
                {...form.register("config.instructions")}
                rows={4}
              />
              <p className="text-sm text-slate-500 mt-1">
                Be specific about what you want the AI to do with the input
              </p>
            </div>
            <div>
              <Label htmlFor="inputSource">Input Source</Label>
              <Select
                value={form.watch("config.inputSource")}
                onValueChange={(value) => form.setValue("config.inputSource", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose input source..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="previous-step">Previous step output</SelectItem>
                  <SelectItem value="user-input">User input</SelectItem>
                  <SelectItem value="uploaded-file">Uploaded file content</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case "email":
        return (
          <>
            <div>
              <Label htmlFor="to">Email Address</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                {...form.register("config.to")}
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email subject line"
                {...form.register("config.subject")}
              />
            </div>
            <div>
              <Label htmlFor="template">Email Template</Label>
              <Textarea
                id="template"
                placeholder="Email content with {{variables}} for dynamic content..."
                {...form.register("config.template")}
                rows={6}
              />
              <p className="text-sm text-slate-500 mt-1">
                Use {{variable}} syntax to include dynamic content from previous steps
              </p>
            </div>
          </>
        );

      case "text-input":
        return (
          <div>
            <Label htmlFor="placeholder">Placeholder Text</Label>
            <Input
              id="placeholder"
              placeholder="Enter placeholder text for the input field"
              {...form.register("config.placeholder")}
            />
          </div>
        );

      case "conditional":
        return (
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Input
              id="condition"
              placeholder="e.g., previous_step_result.score > 5"
              {...form.register("config.condition")}
            />
            <p className="text-sm text-slate-500 mt-1">
              Define the condition that determines whether to skip subsequent steps
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingStep ? "Edit Step" : "Configure Step"}
          </DialogTitle>
          <p className="text-slate-600">
            Set up your {stepType.replace("-", " ")} step
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Step Name</Label>
            <Input
              id="name"
              placeholder="Enter a descriptive name for this step"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {renderConfigFields()}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStepMutation.isPending || updateStepMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white"
            >
              {createStepMutation.isPending || updateStepMutation.isPending
                ? "Saving..."
                : "Save Step"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
