import { Upload, Brain, BarChart3, Leaf } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Leaf Image",
    description: "Take a photo of the affected leaf and upload it to our system.",
    step: "01",
  },
  {
    icon: Brain,
    title: "AI Disease Analysis",
    description: "Our neural network analyzes the image for disease patterns.",
    step: "02",
  },
  {
    icon: BarChart3,
    title: "View Results",
    description: "Get detailed diagnosis with confidence scores instantly.",
    step: "03",
  },
  {
    icon: Leaf,
    title: "Treatment Guidance",
    description: "Receive expert agricultural recommendations for treatment.",
    step: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-20 lg:py-32 bg-card">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium text-foreground mb-4">
            Simple Process
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground">
            Get accurate plant disease diagnosis in four simple steps
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div 
              key={step.title}
              className="relative group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-4" />
              )}
              
              <div className="relative bg-background rounded-2xl p-6 shadow-soft border border-border hover:shadow-card hover:-translate-y-1 transition-all duration-300">
                <span className="absolute top-4 right-4 text-4xl font-bold text-muted/30">
                  {step.step}
                </span>
                
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-matcha transition-colors">
                  <step.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
