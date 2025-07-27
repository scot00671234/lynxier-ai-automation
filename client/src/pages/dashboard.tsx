import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import WorkflowCard from "@/components/workflow-card";
import { Plus, Workflow as WorkflowIcon, Play, Clock } from "lucide-react";
import type { Workflow } from "@shared/schema";
import type { WorkflowStats } from "@/lib/types";

export default function Dashboard() {
  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/workflows"],
  });

  // Mock stats for demo - in production these would come from the API
  const stats: WorkflowStats = {
    totalWorkflows: workflows.length,
    runsThisMonth: 248,
    timesSaved: 47,
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Your Workflows</h2>
          <p className="text-slate-600">Create and manage your AI-powered automation workflows</p>
        </div>
        <Link href="/create">
          <Button className="bg-lynxier-blue hover:bg-lynxier-blue/90 text-white flex items-center space-x-2 rounded-xl shadow-sm">
            <Plus className="w-4 h-4" />
            <span>Create Workflow</span>
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-lynxier-blue/10 rounded-xl flex items-center justify-center">
                <WorkflowIcon className="text-lynxier-blue w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.totalWorkflows}</h3>
                <p className="text-slate-600">Total Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <Play className="text-success w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.runsThisMonth}</h3>
                <p className="text-slate-600">Runs This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200/60 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-lynxier-blue-light/10 rounded-xl flex items-center justify-center">
                <Clock className="text-lynxier-blue-light w-5 h-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stats.timesSaved}</h3>
                <p className="text-slate-600">Hours Saved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows Grid */}
      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>
      ) : (
        <Card className="border-slate-200/60 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-lynxier-blue/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <WorkflowIcon className="text-lynxier-blue w-8 h-8" />
            </div>
            <h4 className="text-lg font-medium text-slate-900 mb-2">No workflows yet</h4>
            <p className="text-slate-600 mb-6">Create your first AI workflow to get started</p>
            <Link href="/create">
              <Button className="bg-lynxier-blue hover:bg-lynxier-blue/90 text-white rounded-xl shadow-sm">
                Create First Workflow
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
