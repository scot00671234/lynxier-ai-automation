import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import lynxierLogo from "@assets/Lynxier_logo-removebg-preview_1753658467509.png";
import { WorkflowSwitcher } from "@/components/dashboard/workflow-switcher";
import { WorkflowMenu } from "@/components/layout/workflow-menu";
import { Workflow } from "@/shared/schema";

interface HeaderProps {
  workflows?: Workflow[];
  currentWorkflow?: Workflow | null;
  onWorkflowSelect?: (workflow: Workflow) => void;
  onCreateWorkflow?: () => void;
  onSave?: () => void;
  onExecute?: () => void;
  onDownload?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onNameChange?: (name: string) => void;
  isExecuting?: boolean;
  isSaving?: boolean;
  showWorkflowControls?: boolean;
}

export default function Header({
  workflows = [],
  currentWorkflow = null,
  onWorkflowSelect = () => {},
  onCreateWorkflow = () => {},
  onSave = () => {},
  onExecute = () => {},
  onDownload = () => {},
  onZoomIn = () => {},
  onZoomOut = () => {},
  onFitView = () => {},
  onNameChange = () => {},
  isExecuting = false,
  isSaving = false,
  showWorkflowControls = false
}: HeaderProps) {
  return (
    <header className="glass border-b border-neutral-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src={lynxierLogo} 
                alt="Lynxier Logo" 
                className="w-8 h-8 object-contain"
              />
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Lynxier</h1>
                <span className="text-xs text-neutral-500 hidden sm:block">
                  AI Workflow Builder
                </span>
              </div>
            </Link>
            
            {/* Workflow Switcher */}
            {showWorkflowControls && (
              <WorkflowSwitcher
                workflows={workflows}
                currentWorkflow={currentWorkflow}
                onWorkflowSelect={onWorkflowSelect}
                onCreateNew={onCreateWorkflow}
                className="ml-6"
              />
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Clean Workflow Menu */}
            {showWorkflowControls && currentWorkflow && (
              <WorkflowMenu
                workflow={currentWorkflow}
                onSave={onSave}
                onExecute={onExecute}
                onDownload={onDownload}
                onZoomIn={onZoomIn}
                onZoomOut={onZoomOut}
                onFitView={onFitView}
                onNameChange={onNameChange}
                isExecuting={isExecuting}
                isSaving={isSaving}
              />
            )}
            
            <Button variant="ghost" size="sm" className="h-8 hover:bg-neutral-100/50">
              <HelpCircle className="w-4 h-4 text-neutral-600" />
            </Button>
            <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center border border-neutral-200">
              <span className="text-xs font-medium text-neutral-700">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
