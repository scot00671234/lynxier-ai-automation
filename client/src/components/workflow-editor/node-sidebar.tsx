import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  ChevronDown, 
  ChevronRight,
  Play,
  Settings,
  Box,
  Brain,
  ArrowLeftRight,
  GitBranch
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { NodeType, NodeCategory } from "@/lib/types";

interface NodeSidebarProps {
  onNodeSelect: (nodeType: NodeType) => void;
  className?: string;
}

const categoryIcons = {
  trigger: Play,
  action: Settings, 
  core: Box,
  ai: Brain,
  transform: ArrowLeftRight,
  flow: GitBranch,
};

export default function NodeSidebar({ onNodeSelect, className = "" }: NodeSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "trigger", "action", "core"
  ]);

  const { data: nodeData, isLoading } = useQuery<{
    nodeTypes: Record<string, NodeType>;
    categories: Record<string, NodeCategory>;
  }>({
    queryKey: ["/api/node-types"]
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredCategories = Object.entries(nodeData?.categories || {}).map(([id, category]) => {
    const filteredNodes = category.nodes.filter(node =>
      node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return { id, ...category, nodes: filteredNodes };
  }).filter(category => category.nodes.length > 0);

  if (isLoading) {
    return (
      <div className={`bg-white border-r border-gray-200 ${className}`}>
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`glass flex flex-col ${className} border-0`}>
      {/* Header */}
      <div className="p-6 border-b border-neutral-200/50">
        <h2 className="font-medium text-neutral-900 mb-4 text-sm tracking-wide">NODE LIBRARY</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9 border-neutral-200/50 focus:border-neutral-400 focus:ring-0 bg-white/50 text-sm"
          />
        </div>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {filteredCategories.map((category) => {
            const isExpanded = expandedCategories.includes(category.id);
            const CategoryIcon = categoryIcons[category.id as keyof typeof categoryIcons] || Box;

            return (
              <Collapsible key={category.id} open={isExpanded}>
                <CollapsibleTrigger
                  onClick={() => toggleCategory(category.id)}
                  className="flex items-center justify-between w-full p-2 text-left hover:bg-neutral-100/50 rounded-md transition-all duration-150 group"
                >
                  <div className="flex items-center space-x-2">
                    <CategoryIcon className="w-4 h-4 text-neutral-600" />
                    <span className="font-medium text-neutral-700 text-sm">{category.name}</span>
                    <Badge variant="secondary" className="text-xs bg-neutral-100 text-neutral-600 border-0 h-5 px-2">
                      {category.nodes.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-neutral-400 transition-transform duration-150" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-neutral-400 transition-transform duration-150" />
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1">
                  <div className="space-y-1 ml-4">
                    {category.nodes.map((node) => (
                      <div
                        key={node.type}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/reactflow', node.type);
                          e.dataTransfer.setData('application/json', JSON.stringify(node));
                        }}
                        onClick={() => onNodeSelect(node)}
                        className="w-full text-left p-2 rounded-md hover:bg-neutral-100/50 border border-transparent transition-all duration-150 group cursor-grab active:cursor-grabbing"
                      >
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                            style={{ backgroundColor: node.color }}
                          >
                            {node.displayName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {node.displayName}
                            </p>
                            <p className="text-xs text-neutral-500 line-clamp-1">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>

                {category.id !== filteredCategories[filteredCategories.length - 1].id && (
                  <Separator className="my-2" />
                )}
              </Collapsible>
            );
          })}

          {filteredCategories.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No nodes found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}