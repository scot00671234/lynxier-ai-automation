import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Upload, 
  Keyboard, 
  Brain, 
  Mail, 
  GitBranch 
} from "lucide-react";

interface AddStepModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStepTypeSelect: (stepType: string) => void;
}

const stepTypes = [
  {
    type: "file-upload",
    name: "File Upload",
    description: "Allow users to upload PDF or DOCX files for processing",
    icon: Upload,
    iconColor: "text-blue-600",
    bgColor: "bg-blue-100 group-hover:bg-blue-200",
  },
  {
    type: "text-input",
    name: "Text Input",
    description: "Collect text input or instructions from users",
    icon: Keyboard,
    iconColor: "text-green-600",
    bgColor: "bg-green-100 group-hover:bg-green-200",
  },
  {
    type: "ai-processing",
    name: "AI Processing",
    description: "Use AI to summarize, rewrite, or analyze text content",
    icon: Brain,
    iconColor: "text-purple-600",
    bgColor: "bg-purple-100 group-hover:bg-purple-200",
  },
  {
    type: "email",
    name: "Send Email",
    description: "Send email notifications with AI-generated content",
    icon: Mail,
    iconColor: "text-orange-600",
    bgColor: "bg-orange-100 group-hover:bg-orange-200",
  },
  {
    type: "conditional",
    name: "If/Then Logic",
    description: "Add simple conditional logic to skip or execute steps",
    icon: GitBranch,
    iconColor: "text-yellow-600",
    bgColor: "bg-yellow-100 group-hover:bg-yellow-200",
  },
];

export default function AddStepModal({ open, onOpenChange, onStepTypeSelect }: AddStepModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Step</DialogTitle>
          <p className="text-slate-600">Choose the type of step to add to your workflow</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {stepTypes.map((stepType) => {
            const IconComponent = stepType.icon;
            return (
              <Card
                key={stepType.type}
                className="border border-slate-200 hover:border-primary transition-colors cursor-pointer group"
                onClick={() => onStepTypeSelect(stepType.type)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-10 h-10 ${stepType.bgColor} rounded-lg flex items-center justify-center transition-colors`}>
                      <IconComponent className={`${stepType.iconColor} w-5 h-5`} />
                    </div>
                    <h4 className="font-medium text-slate-900">{stepType.name}</h4>
                  </div>
                  <p className="text-sm text-slate-600">{stepType.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
