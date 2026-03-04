import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Leaf, MessageCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';

const ONBOARDING_KEY = 'plantwise_onboarding_complete';

const steps = [
  {
    icon: Sparkles,
    title: 'Welcome to PlantWise AI!',
    description:
      'Your AI-powered plant disease detection assistant. Let us show you around in 3 quick steps.',
    image: null,
  },
  {
    icon: Upload,
    title: 'Upload a Leaf Image',
    description:
      'Take a clear photo of a plant leaf and upload it. Our dual AI models (ResNet50 + TensorFlow) will analyze it in seconds.',
    action: '/upload',
    actionLabel: 'Try Uploading',
  },
  {
    icon: Leaf,
    title: 'Get Instant Results',
    description:
      'You\'ll receive a disease diagnosis with confidence score, along with organic, chemical, and preventive treatment recommendations.',
    action: '/predictions',
    actionLabel: 'View Predictions',
  },
  {
    icon: MessageCircle,
    title: 'Chat with AI Assistant',
    description:
      'Have questions about plant care? Use the floating chat button (bottom-right) to talk to our agricultural AI assistant anytime.',
    action: null,
    actionLabel: null,
  },
];

const OnboardingDialog: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Only show for farmers who haven't completed onboarding
    const completed = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`);
    if (!completed && user.role === 'farmer') {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, 'true');
    }
    setOpen(false);
  };

  const handleAction = (path: string) => {
    handleFinish();
    navigate(path);
  };

  const current = steps[step];
  const Icon = current.icon;
  const progress = ((step + 1) / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleFinish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Step {step + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleFinish}>
              Skip tour
            </Button>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-calm-green/10 flex items-center justify-center">
              <Icon className="w-8 h-8 text-calm-green" />
            </div>
          </div>

          <DialogTitle className="text-center text-xl text-calm-green">{current.title}</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {'action' in current && current.action && (
            <Button
              variant="outline"
              className="border-calm-green text-calm-green hover:bg-pistage"
              onClick={() => handleAction(current.action!)}
            >
              {current.actionLabel}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          <Button
            className="bg-calm-green hover:bg-resting-green text-white"
            onClick={handleNext}
          >
            {step < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Get Started
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
