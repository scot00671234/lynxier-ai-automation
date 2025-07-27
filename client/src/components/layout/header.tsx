import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import lynxierLogo from "@assets/Lynxier_logo-removebg-preview_1753658467509.png";

export default function Header() {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src={lynxierLogo} 
                alt="Lynxier Logo" 
                className="w-10 h-10 object-contain"
              />
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
