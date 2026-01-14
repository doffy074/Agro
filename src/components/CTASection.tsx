import { ArrowRight, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 gradient-cta relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-matcha/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-early-green/10 rounded-full blur-3xl" />
      </div>
      
      <div className="container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pistage/20 rounded-2xl mb-8">
            <Leaf className="h-8 w-8 text-pistage" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">
            Protect Your Crops with AI-Powered Insights
          </h2>
          
          <p className="text-lg text-pistage/80 mb-10 max-w-2xl mx-auto">
            Join thousands of farmers who are already using PlantGuard AI to detect diseases early and protect their harvests.
          </p>
          
          <Button variant="cta" size="xl" className="group">
            Start Disease Detection
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
