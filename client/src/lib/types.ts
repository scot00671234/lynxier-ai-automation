export interface StepConfig {
  fileUpload?: {
    allowedTypes: string[];
    maxSize: number;
  };
  textInput?: {
    placeholder?: string;
    required: boolean;
  };
  aiProcessing?: {
    task: "summarize" | "rewrite" | "analyze" | "extract" | "generate";
    instructions: string;
    inputSource: string;
  };
  email?: {
    to: string;
    subject: string;
    template: string;
  };
  conditional?: {
    condition: string;
    skipStepIds: string[];
  };
}

export interface WorkflowStats {
  totalWorkflows: number;
  runsThisMonth: number;
  timesSaved: number;
}

export interface ExecutionProgress {
  currentStep: number;
  totalSteps: number;
  stepResults: Record<string, any>;
}
