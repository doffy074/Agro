import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Flag,
  Send,
} from 'lucide-react';
import { predictionApi, officerApi } from '@/services/api';
import { Prediction } from '@/types';

const ReviewPrediction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isCorrect, setIsCorrect] = useState<string>('correct');
  const [correctedDisease, setCorrectedDisease] = useState('');
  const [comments, setComments] = useState('');
  
  // Flag modal state
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!id) return;
      
      try {
        const response = await predictionApi.getPrediction(id);
        if (response.data) {
          setPrediction(response.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load prediction');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrediction();
  }, [id]);

  const handleSubmit = async () => {
    if (!id || !comments.trim()) {
      setError('Please provide your comments');
      return;
    }

    if (isCorrect === 'incorrect' && !correctedDisease.trim()) {
      setError('Please provide the correct disease name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await officerApi.verifyPrediction(
        id,
        isCorrect === 'correct',
        comments,
        isCorrect === 'incorrect' ? correctedDisease : undefined
      );
      navigate('/officer/reviews');
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFlag = async () => {
    if (!id || !flagReason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await officerApi.flagPrediction(id, flagReason);
      setFlagModalOpen(false);
      navigate('/officer/reviews');
    } catch (err: any) {
      setError(err.message || 'Failed to flag prediction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-calm-green" />
        </div>
      </>
    );
  }

  if (!prediction) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-calm-green mb-2">Prediction not found</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-calm-green">Review Prediction</h1>
            <p className="text-sm text-muted-foreground">
              Verify the AI prediction and provide expert feedback
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image and AI Result */}
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green">AI Analysis</CardTitle>
              <CardDescription>Machine learning prediction result</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <img
                src={getImageUrl(prediction.imageUrl)}
                alt={prediction.cropName}
                className="w-full h-48 object-contain rounded-lg bg-pistage"
              />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Crop Type</span>
                  <span className="font-medium text-calm-green">{prediction.cropName}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Detected Disease</span>
                  <Badge className={prediction.status === 'healthy' ? 'bg-early-green' : 'bg-destructive'}>
                    {prediction.diseaseName}
                  </Badge>
                </div>
                
                <Separator />
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Confidence</span>
                    <span className="font-medium text-calm-green">{prediction.confidence.toFixed(1)}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Submitted</span>
                  <span className="text-sm">{new Date(prediction.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Review Form */}
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green">Your Review</CardTitle>
              <CardDescription>Verify or correct the AI prediction</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Is the AI prediction correct?</Label>
                <RadioGroup value={isCorrect} onValueChange={setIsCorrect}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-matcha/20 hover:bg-pistage cursor-pointer">
                    <RadioGroupItem value="correct" id="correct" />
                    <Label htmlFor="correct" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CheckCircle2 className="w-5 h-5 text-early-green" />
                      <div>
                        <p className="font-medium">Correct</p>
                        <p className="text-xs text-muted-foreground">AI prediction is accurate</p>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-matcha/20 hover:bg-pistage cursor-pointer">
                    <RadioGroupItem value="incorrect" id="incorrect" />
                    <Label htmlFor="incorrect" className="flex items-center gap-2 cursor-pointer flex-1">
                      <XCircle className="w-5 h-5 text-destructive" />
                      <div>
                        <p className="font-medium">Incorrect</p>
                        <p className="text-xs text-muted-foreground">AI prediction needs correction</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {isCorrect === 'incorrect' && (
                <div className="space-y-2">
                  <Label htmlFor="correctedDisease">Correct Disease Name *</Label>
                  <Input
                    id="correctedDisease"
                    placeholder="Enter the correct disease name"
                    value={correctedDisease}
                    onChange={(e) => setCorrectedDisease(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="comments">Expert Comments *</Label>
                <Textarea
                  id="comments"
                  placeholder="Provide your expert analysis and any additional recommendations..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Your comments will be visible to the farmer
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  className="w-full bg-calm-green hover:bg-resting-green text-white"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Submit Review
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  onClick={() => setFlagModalOpen(true)}
                  disabled={isSubmitting}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Flag as Problematic
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Treatment suggestions */}
        {prediction.treatments && (
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green">Current Treatment Recommendations</CardTitle>
              <CardDescription>Review and suggest improvements if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-pistage rounded-lg">
                  <p className="font-medium text-calm-green mb-2">Organic</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {prediction.treatments.organic.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-pistage rounded-lg">
                  <p className="font-medium text-calm-green mb-2">Chemical</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {prediction.treatments.chemical.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-pistage rounded-lg">
                  <p className="font-medium text-calm-green mb-2">Preventive</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {prediction.treatments.preventive.map((t, i) => (
                      <li key={i}>• {t}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Flag Modal */}
      <Dialog open={flagModalOpen} onOpenChange={setFlagModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Flag className="w-5 h-5" />
              Flag Prediction
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for flagging this prediction as problematic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Reason for flagging *</Label>
              <Textarea
                id="flag-reason"
                placeholder="Describe why this prediction is problematic..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setFlagModalOpen(false);
                setFlagReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlag}
              disabled={!flagReason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Flag className="w-4 h-4 mr-2" />
              )}
              Flag Prediction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReviewPrediction;
