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
    <div className={`bg-white border-r border-gray-100 flex flex-col ${className} shadow-sm`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 mb-3 text-lg">Node Library</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20"
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
                  className="flex items-center justify-between w-full p-3 text-left hover:bg-primary/5 rounded-lg transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <CategoryIcon className="w-5 h-5 text-primary group-hover:text-primary/80" />
                    <span className="font-semibold text-gray-800 group-hover:text-primary">{category.name}</span>
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      {category.nodes.length}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-1">
                  <div className="space-y-1 ml-6">
                    {category.nodes.map((node) => (
                      <button
                        key={node.type}
                        onClick={() => onNodeSelect(node)}
                        className="w-full text-left p-3 rounded-lg hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-200 group hover:shadow-sm"
                      >
                        <div className="flex items-start space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: node.color }}
                          >
                            {node.displayName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary">
                              {node.displayName}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2 mt-1 leading-relaxed">
                              {node.description}
                            </p>
                          </div>
                        </div>
                      </button>
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