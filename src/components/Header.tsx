import { Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex items-center justify-between h-16">
        <a href="#" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-primary group-hover:bg-calm-green transition-colors">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">PlantGuard AI</span>
        </a>
        
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#users" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Who Can Use
          </a>
        </nav>
        
        <Button variant="hero" size="sm">
          Get Started
        </Button>
      </div>
    </header>
  );
};

export default Header;
