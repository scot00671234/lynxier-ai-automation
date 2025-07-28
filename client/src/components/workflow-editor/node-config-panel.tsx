import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, 
  Save, 
  Settings, 
  Info, 
  AlertCircle,
  Code,
  Key,
  FileText
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { NodeType, NodePropertyDefinition, WorkflowNodeData } from "@/lib/types";

interface NodeConfigPanelProps {
  nodeId: string | null;
  nodeData: WorkflowNodeData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  className?: string;
}

export default function NodeConfigPanel({
  nodeId,
  nodeData,
  isOpen,
  onClose,
  onSave,
  className = ""
}: NodeConfigPanelProps) {
  const [activeTab, setActiveTab] = useState("parameters");
  const { toast } = useToast();

  // Fetch node type definition
  const { data: nodeType, isLoading } = useQuery<NodeType>({
    queryKey: ["/api/node-types", nodeData?.type],
    enabled: !!nodeData?.type,
  });

  // Create dynamic form schema based on node properties
  const createFormSchema = (properties: NodePropertyDefinition[]) => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    
    properties?.forEach((prop) => {
      let fieldSchema: z.ZodTypeAny;
      
      switch (prop.type) {
        case "string":
          fieldSchema = z.string();
          if (prop.required) fieldSchema = fieldSchema.min(1, `${prop.displayName} is required`);
          break;
        case "number":
          fieldSchema = z.coerce.number();
          if (prop.required) fieldSchema = fieldSchema.min(0);
          break;
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "options":
          const validOptions = prop.options?.map(opt => opt.value) || [];
          fieldSchema = z.enum(validOptions as [string, ...string[]]);
          break;
        case "json":
          fieldSchema = z.string().refine((val) => {
            try {
              JSON.parse(val);
              return true;
            } catch {
              return false;
            }
          }, "Must be valid JSON");
          break;
        default:
          fieldSchema = z.string();
      }
      
      if (!prop.required) {
        fieldSchema = fieldSchema.optional();
      }
      
      schemaFields[prop.name] = fieldSchema;
    });
    
    return z.object(schemaFields);
  };

  const formSchema = nodeType ? createFormSchema(nodeType.properties) : z.object({});
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: nodeData?.parameters || {},
  });

  // Update form when node data changes
  useEffect(() => {
    if (nodeData?.parameters) {
      form.reset(nodeData.parameters);
    }
  }, [nodeData, form]);

  const onSubmit = (data: any) => {
    if (!nodeId) return;
    
    onSave(nodeId, {
      parameters: data,
      isConfigured: true,
      hasErrors: false,
      errorMessage: undefined,
    });
    
    toast({
      title: "Node Updated",
      description: "Node configuration has been saved successfully.",
    });
  };

  const handleNotesChange = (notes: string) => {
    if (!nodeId) return;
    onSave(nodeId, { notes });
  };

  if (!isOpen || !nodeId || !nodeData) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-white border-l border-gray-200 ${className}`}>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border-l border-gray-200 flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: nodeData.color }}
          >
            {nodeData.label.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{nodeData.label}</h3>
            <p className="text-xs text-gray-500">{nodeType?.type}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 grid w-full grid-cols-3">
          <TabsTrigger value="parameters" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Parameters
          </TabsTrigger>
          <TabsTrigger value="credentials" className="text-xs">
            <Key className="w-3 h-3 mr-1" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {nodeType?.description && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-blue-700">{nodeType.description}</p>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {nodeType?.properties?.map((property) => (
                    <FormField
                      key={property.name}
                      control={form.control}
                      name={property.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-1">
                            <span>{property.displayName}</span>
                            {property.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </FormLabel>
                          
                          <FormControl>
                            {property.type === "string" && (
                              property.typeOptions?.rows ? (
                                <Textarea
                                  {...field}
                                  placeholder={property.placeholder}
                                  rows={property.typeOptions.rows}
                                  className="resize-none"
                                />
                              ) : (
                                <Input
                                  {...field}
                                  placeholder={property.placeholder}
                                />
                              )
                            )}
                            
                            {property.type === "number" && (
                              <Input
                                {...field}
                                type="number"
                                placeholder={property.placeholder}
                              />
                            )}
                            
                            {property.type === "boolean" && (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                                <Label>{field.value ? "Enabled" : "Disabled"}</Label>
                              </div>
                            )}
                            
                            {property.type === "options" && (
                              <Select value={field.value} onValueChange={field.onChange}>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${property.displayName.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {property.options?.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div>
                                        <div className="font-medium">{option.name}</div>
                                        {option.description && (
                                          <div className="text-xs text-gray-500">{option.description}</div>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {property.type === "json" && (
                              <div className="space-y-2">
                                <Textarea
                                  {...field}
                                  placeholder='{"key": "value"}'
                                  className="font-mono text-sm"
                                  rows={4}
                                />
                                <div className="flex items-center space-x-1 text-xs text-gray-500">
                                  <Code className="w-3 h-3" />
                                  <span>Must be valid JSON</span>
                                </div>
                              </div>
                            )}
                          </FormControl>
                          
                          {property.description && (
                            <FormDescription className="text-xs">
                              {property.description}
                            </FormDescription>
                          )}
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}

                  {nodeType?.properties?.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No configuration required for this node.</p>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4">
                    <Button type="submit" className="flex-1">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              {nodeType?.credentials && nodeType.credentials.length > 0 ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-amber-700 font-medium">
                          Credentials Required
                        </p>
                        <p className="text-xs text-amber-600 mt-1">
                          This node requires credentials to function properly.
                        </p>
                      </div>
                    </div>
                  </div>

                  {nodeType.credentials.map((credential) => (
                    <div key={credential.name} className="space-y-2">
                      <Label className="flex items-center space-x-1">
                        <span>{credential.name}</span>
                        {credential.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </Label>
                      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <p className="text-sm text-gray-600 mb-2">
                          Configure {credential.name} credentials in the credentials manager.
                        </p>
                        <Button variant="outline" size="sm">
                          <Key className="w-3 h-3 mr-1" />
                          Set Credentials
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Key className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No credentials required for this node.</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="flex-1 mt-0">
          <div className="p-4 h-full flex flex-col">
            <Label className="mb-2">Node Notes</Label>
            <Textarea
              value={nodeData.notes || ""}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Add notes about this node..."
              className="flex-1 resize-none"
              rows={10}
            />
            <p className="text-xs text-gray-500 mt-2">
              Notes are visible in the workflow editor and help document your workflow.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}