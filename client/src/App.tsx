import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import WorkflowEditor from "@/pages/workflow-editor";
import ExecuteWorkflow from "@/pages/execute-workflow";
import Header from "@/components/layout/header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/workflows/new" component={WorkflowEditor} />
      <Route path="/workflows/:id/edit" component={WorkflowEditor} />
      <Route path="/workflows/:id/execute" component={ExecuteWorkflow} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="h-screen bg-white flex flex-col">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
