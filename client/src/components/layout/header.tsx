import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import lynxierLogo from "@assets/Lynxier_logo-removebg-preview_1753658467509.png";

export default function Header() {
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
          </div>
          <div className="flex items-center space-x-3">
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
