import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import FeaturesSection from "@/components/FeaturesSection";
import UsersSection from "@/components/UsersSection";
import ResultPreviewSection from "@/components/ResultPreviewSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <UsersSection />
        <ResultPreviewSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
