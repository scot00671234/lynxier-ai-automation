import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ExecutionProgress from "@/components/execution-progress";
import { ArrowLeft, Square } from "lucide-react";
import type { Workflow, WorkflowExecution } from "@shared/schema";

export default function ExecuteWorkflow() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const workflowId = params.id;
  const [executionId, setExecutionId] = useState<string>("");

  // Get execution ID from URL or start new execution
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const execId = urlParams.get("execution");
    if (execId) {
      setExecutionId(execId);
    }
  }, []);

  const { data: workflow } = useQuery<Workflow>({
    queryKey: ["/api/workflows", workflowId],
    enabled: !!workflowId,
  });

  const { data: execution, refetch: refetchExecution } = useQuery<WorkflowExecution>({
    queryKey: ["/api/executions", executionId],
    enabled: !!executionId,
    refetchInterval: (data) => data?.status === "running" ? 2000 : false,
  });

  const handleStopExecution = async () => {
    if (!executionId) return;
    
    try {
      const response = await fetch(`/api/executions/${executionId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        refetchExecution();
      }
    } catch (error) {
      console.error("Failed to stop execution:", error);
    }
  };

  const getStatusInfo = () => {
    if (!execution) return { text: "Loading...", color: "text-slate-500" };
    
    switch (execution.status) {
      case "running":
        return { text: "Running...", color: "text-warning" };
      case "completed":
        return { text: "Completed", color: "text-success" };
      case "failed":
        return { text: "Failed", color: "text-error" };
      case "stopped":
        return { text: "Stopped", color: "text-slate-500" };
      default:
        return { text: execution.status, color: "text-slate-500" };
    }
  };

  const statusInfo = getStatusInfo();

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
              {workflow?.name || "Workflow Execution"}
            </h2>
            <p className="text-slate-600">Running workflow execution</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 ${statusInfo.color}`}>
            {execution?.status === "running" && (
              <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
            )}
            <span className="text-sm font-medium">{statusInfo.text}</span>
          </div>
          {execution?.status === "running" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStopExecution}
              className="text-red-600 hover:text-red-700 border-red-200"
            >
              <Square className="w-4 h-4 mr-1" />
              Stop
            </Button>
          )}
        </div>
      </div>

      {/* Execution Progress */}
      {execution && workflowId && (
        <ExecutionProgress
          execution={execution}
          workflowId={workflowId}
        />
      )}

      {/* Live Results Panel */}
      <Card className="mt-6">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-slate-900 mb-4">Live Results</h3>
          <div className="space-y-4">
            {execution?.results ? (
              <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm">
                <pre className="whitespace-pre-wrap text-slate-700">
                  {JSON.stringify(execution.results, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>Waiting for execution results...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
