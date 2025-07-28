import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import lynxierLogo from "@assets/Lynxier_logo-removebg-preview_1753658467509.png";

export default function Header() {
  return (
    <header className="bg-white/98 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <img 
                src={lynxierLogo} 
                alt="Lynxier Logo" 
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-primary">Lynxier</h1>
                <span className="text-xs text-gray-600 hidden sm:block">
                  AI Workflow Builder
                </span>
              </div>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="hover:bg-primary/5">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20">
              <span className="text-sm font-semibold text-primary">JD</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
