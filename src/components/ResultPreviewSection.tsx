import { CheckCircle, AlertTriangle, Pill } from "lucide-react";
import sampleLeaf from "@/assets/sample-leaf.jpg";

const ResultPreviewSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium text-foreground mb-4">
            Sample Output
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            See Results in Action
          </h2>
          <p className="text-lg text-muted-foreground">
            Here's what you can expect from our AI disease detection
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          {/* Sample Image */}
          <div className="animate-fade-in-left" style={{ animationDelay: "0.1s" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-matcha/30 to-early-green/30 rounded-2xl blur-xl transform scale-95" />
              <img 
                src={sampleLeaf}
                alt="Sample diseased tomato leaf"
                className="relative rounded-2xl shadow-card w-full object-cover aspect-square"
              />
              <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <span className="text-sm font-medium text-foreground">Uploaded Image</span>
              </div>
            </div>
          </div>
          
          {/* Result Card */}
          <div className="animate-fade-in-right" style={{ animationDelay: "0.3s" }}>
            <div className="bg-card rounded-2xl p-6 lg:p-8 shadow-card border border-border">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-destructive">Disease Detected</span>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plant Identified</p>
                  <p className="text-xl font-bold text-foreground">Tomato (Solanum lycopersicum)</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Disease Detected</p>
                  <p className="text-xl font-bold text-foreground">Early Blight</p>
                  <p className="text-sm text-muted-foreground">(Alternaria solani)</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-2">Confidence Level</p>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-early-green rounded-full" style={{ width: "94%" }} />
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-foreground">94%</span>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Pill className="h-4 w-4 text-early-green" />
                    <p className="text-sm font-semibold text-foreground">Treatment Summary</p>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-early-green mt-0.5 shrink-0" />
                      Apply copper-based fungicide
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-early-green mt-0.5 shrink-0" />
                      Remove affected leaves immediately
                    </li>
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-early-green mt-0.5 shrink-0" />
                      Improve air circulation between plants
                    </li>
                  </ul>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-pistage/50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-calm-green shrink-0" />
                  <p className="text-xs text-calm-green">
                    Consult an agricultural expert for severe cases
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultPreviewSection;
