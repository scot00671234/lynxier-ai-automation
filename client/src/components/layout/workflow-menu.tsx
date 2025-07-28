import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Save,
  Download,
  Play,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit3,
  MoreHorizontal,
  Square
} from "lucide-react";
import { Workflow } from "@shared/schema";

interface WorkflowMenuProps {
  workflow: Workflow | null;
  onSave: () => void;
  onExecute: () => void;
  onDownload: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onNameChange: (name: string) => void;
  isExecuting?: boolean;
  isSaving?: boolean;
}

export function WorkflowMenu({
  workflow,
  onSave,
  onExecute,
  onDownload,
  onZoomIn,
  onZoomOut,
  onFitView,
  onNameChange,
  isExecuting = false,
  isSaving = false
}: WorkflowMenuProps) {
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [newName, setNewName] = useState(workflow?.name || "");

  const handleNameSave = () => {
    if (newName.trim()) {
      onNameChange(newName.trim());
      setShowNameDialog(false);
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Primary Execute Button */}
        <Button
          onClick={onExecute}
          disabled={isExecuting}
          size="sm"
          className={`h-8 ${
            isExecuting 
              ? "bg-red-500 hover:bg-red-600" 
              : "bg-green-500 hover:bg-green-600"
          } text-white`}
        >
          {isExecuting ? (
            <>
              <Square className="w-3.5 h-3.5 mr-1.5" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Execute
            </>
          )}
        </Button>

        {/* Actions Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 glass border-neutral-200/50 hover:bg-neutral-100/50">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 glass border-neutral-200/50" align="end">
            <div className="space-y-1">
              {/* Save */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <Save className="w-3.5 h-3.5 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>

              {/* Download */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                Download
              </Button>

              {/* Edit Name */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewName(workflow?.name || "");
                  setShowNameDialog(true);
                }}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <Edit3 className="w-3.5 h-3.5 mr-2" />
                Edit Name
              </Button>

              <div className="h-px bg-neutral-200/50 my-1" />

              {/* View Controls */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onFitView}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <Maximize2 className="w-3.5 h-3.5 mr-2" />
                Fit View
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomIn}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <ZoomIn className="w-3.5 h-3.5 mr-2" />
                Zoom In
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onZoomOut}
                className="w-full justify-start h-8 hover:bg-neutral-100/50"
              >
                <ZoomOut className="w-3.5 h-3.5 mr-2" />
                Zoom Out
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Edit Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md glass border-neutral-200/50">
          <DialogHeader>
            <DialogTitle>Edit Workflow Name</DialogTitle>
            <DialogDescription>
              Enter a new name for your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="workflow-name">Workflow Name</Label>
            <Input
              id="workflow-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter workflow name..."
              className="border-neutral-200/50 focus:border-neutral-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleNameSave();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleNameSave} disabled={!newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}