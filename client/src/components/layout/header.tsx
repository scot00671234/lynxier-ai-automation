import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpCircle, Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="text-white w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Lynxier</h1>
            </Link>
            <span className="text-sm text-slate-500 hidden md:block">
              Simple AI Workflow Builder
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
            <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-slate-700">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
