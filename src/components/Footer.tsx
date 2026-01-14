import { Leaf } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 bg-card border-t border-border">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo and description */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <a href="#" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">PlantGuard AI</span>
            </a>
            <p className="text-sm text-muted-foreground text-center md:text-left max-w-xs">
              AI-powered plant disease detection for modern agriculture
            </p>
          </div>
          
          {/* Links */}
          <nav className="flex items-center gap-8">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
          </nav>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-10 pt-8 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            This project is developed for academic and research purposes. Results should be verified by agricultural professionals.
          </p>
          <p className="text-xs text-muted-foreground text-center mt-2">
            © 2024 PlantGuard AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
