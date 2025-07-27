import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import type { WorkflowExecution, WorkflowStep } from "@shared/schema";

interface ExecutionProgressProps {
  execution: WorkflowExecution;
  workflowId: string;
}

export default function ExecutionProgress({ execution, workflowId }: ExecutionProgressProps) {
  const { data: steps = [] } = useQuery<WorkflowStep[]>({
    queryKey: ["/api/workflows", workflowId, "steps"],
  });

  const results = execution.results as any || {};
  const currentStepIndex = (results.currentStep || 1) - 1;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) {
      return "completed";
    } else if (stepIndex === currentStepIndex && execution.status === "running") {
      return "running";
    } else if (execution.status === "failed" && stepIndex === currentStepIndex) {
      return "failed";
    } else {
      return "pending";
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "running":
        return <Loader2 className="w-5 h-5 text-warning animate-spin" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
      case "running":
        return <Badge className="bg-yellow-100 text-yellow-700">Processing</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-700">Pending</Badge>;
    }
  };

  const getStepResult = (step: WorkflowStep) => {
    const stepResult = results[step.id];
    if (!stepResult) return null;

    if (stepResult.error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800 font-medium">❌ Error occurred</p>
          <p className="text-sm text-red-700">{stepResult.error}</p>
        </div>
      );
    }

    if (stepResult.output) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800 font-medium">✓ Step completed successfully</p>
          <p className="text-sm text-green-700 mt-1">
            {typeof stepResult.output === 'string' 
              ? stepResult.output.substring(0, 200) + (stepResult.output.length > 200 ? '...' : '')
              : JSON.stringify(stepResult.output)
            }
          </p>
        </div>
      );
    }

    if (stepResult.status === "waiting_for_file") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 font-medium">⏳ Waiting for file upload</p>
        </div>
      );
    }

    if (stepResult.status === "waiting_for_input") {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 font-medium">⏳ Waiting for user input</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900">Progress</h3>
            <span className="text-sm text-slate-500">
              Step {Math.min(currentStepIndex + 1, steps.length)} of {steps.length}
            </span>
          </div>
          <Progress 
            value={(currentStepIndex / Math.max(steps.length, 1)) * 100} 
            className="h-2"
          />
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const stepResult = getStepResult(step);
            
            return (
              <div
                key={step.id}
                className={`flex items-start space-x-4 ${
                  status === "pending" ? "opacity-50" : ""
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {getStepIcon(status)}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-slate-900">{step.name}</h4>
                    {getStatusBadge(status)}
                    {status === "completed" && (
                      <span className="text-xs text-slate-500">~2.3s</span>
                    )}
                  </div>
                  
                  {stepResult && (
                    <div className="mb-3">
                      {stepResult}
                    </div>
                  )}
                  
                  {status === "running" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-800 font-medium">⚡ Processing step...</p>
                      <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                        <div className="bg-warning h-2 rounded-full transition-all duration-1000 animate-pulse" style={{width: "65%"}}></div>
                      </div>
                    </div>
                  )}
                  
                  {status === "pending" && (
                    <p className="text-sm text-slate-600">Waiting for previous step to complete</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
