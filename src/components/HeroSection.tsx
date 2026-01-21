import { Upload, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-16 gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-matcha/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-ever-green/30 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12 py-20 lg:py-32">
        {/* Left Column - Content */}
        <div className="flex-1 max-w-xl animate-fade-in-left" style={{ animationDelay: "0.1s" }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary rounded-full mb-6">
            <span className="w-2 h-2 bg-early-green rounded-full animate-pulse-soft" />
            <span className="text-sm font-medium text-foreground">AI-Powered Crop Protection</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            AI-Powered Plant Disease Detection
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Upload a leaf image and get instant disease diagnosis with treatment recommendations. Protect your crops with cutting-edge artificial intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/register">
              <Button variant="hero" size="xl" className="group">
                <Upload className="h-5 w-5" />
                Analyze Leaf Image
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <a href="#how-it-works">
              <Button variant="hero-outline" size="xl">
                How It Works
              </Button>
            </a>
          </div>
          
          <div className="flex items-center gap-6 mt-10 pt-8 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">50+</p>
              <p className="text-sm text-muted-foreground">Crops Supported</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">Instant</p>
              <p className="text-sm text-muted-foreground">Results</p>
            </div>
          </div>
        </div>
        
        {/* Right Column - Visual */}
        <div className="flex-1 max-w-2xl animate-fade-in-right" style={{ animationDelay: "0.3s" }}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-matcha/40 to-early-green/40 rounded-3xl blur-2xl transform scale-95" />
            <img 
              src={heroImage} 
              alt="AI scanning crop leaves for disease detection" 
              className="relative rounded-3xl shadow-card w-full object-cover"
            />
            
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-card p-4 rounded-2xl shadow-card border border-border animate-scale-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-pistage rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🌿</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Disease Detected</p>
                  <p className="text-xs text-muted-foreground">Early Blight · 94% confidence</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
