import { Scan, Wheat, Target, BookOpen, Smartphone, Shield } from "lucide-react";

const features = [
  {
    icon: Scan,
    title: "AI-Based Disease Detection",
    description: "Advanced machine learning models trained on thousands of plant disease images for accurate diagnosis.",
  },
  {
    icon: Wheat,
    title: "Supports Multiple Crops",
    description: "Compatible with over 50 different crop types including tomatoes, potatoes, corn, rice, and more.",
  },
  {
    icon: Target,
    title: "High Accuracy Predictions",
    description: "Achieving 98% accuracy rate with continuous model improvements and updates.",
  },
  {
    icon: BookOpen,
    title: "Expert Agricultural Guidance",
    description: "Comprehensive treatment recommendations backed by agricultural research and best practices.",
  },
  {
    icon: Smartphone,
    title: "Farmer-Friendly Interface",
    description: "Simple, intuitive design accessible to users of all technical backgrounds.",
  },
  {
    icon: Shield,
    title: "Secure & Fast Processing",
    description: "Your data is protected with encryption and results are delivered in seconds.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 lg:py-32 bg-background">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-2 bg-secondary rounded-full text-sm font-medium text-foreground mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose PlantGuard AI?
          </h2>
          <p className="text-lg text-muted-foreground">
            Empowering farmers with cutting-edge technology for healthier crops
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group bg-card rounded-2xl p-6 shadow-soft border border-border hover:shadow-card hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
                <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
              </div>
              
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
