import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Beaker,
  Shield,
  Clock,
  User,
  FileText,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import { predictionApi } from '@/services/api';
import { Prediction } from '@/types';

const PredictionResult: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (!id) return;
      
      try {
        const response = await predictionApi.getPrediction(id);
        if (response.data) {
          setPrediction(response.data);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load prediction');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchFeedback = async () => {
      if (!id) return;
      try {
        const response = await predictionApi.getFeedback(id);
        if (response.data) {
          setFeedbackGiven(response.data.correct);
        }
      } catch {
        // No feedback yet, that's fine
      }
    };

    fetchPrediction();
    fetchFeedback();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!id) return;
    
    setIsDownloading(true);
    try {
      const blob = await predictionApi.downloadPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prediction-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download PDF:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFeedback = async (correct: boolean) => {
    if (!id) return;
    setFeedbackLoading(true);
    try {
      await predictionApi.submitFeedback(id, correct);
      setFeedbackGiven(correct);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await predictionApi.deletePrediction(id);
      navigate('/predictions');
    } catch (err) {
      console.error('Failed to delete prediction:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-calm-green mx-auto mb-4" />
            <p className="text-muted-foreground">Loading prediction...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !prediction) {
    return (
      <>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-calm-green mb-2">
            {error || 'Prediction not found'}
          </h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </>
    );
  }

  const isHealthy = prediction.status === 'healthy';
  const confidenceColor = prediction.confidence >= 80 ? 'text-early-green' : prediction.confidence >= 60 ? 'text-yellow-500' : 'text-destructive';

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-calm-green">Prediction Result</h1>
              <p className="text-sm text-muted-foreground">
                {new Date(prediction.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="border-matcha text-calm-green hover:bg-pistage"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download PDF
          </Button>
        </div>

        {/* Main result card */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <img
                src={getImageUrl(prediction.imageUrl)}
                alt={prediction.cropName}
                className="w-full h-64 object-contain rounded-lg bg-pistage"
              />
            </CardContent>
          </Card>

          {/* Result summary */}
          <Card className="border-matcha/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-calm-green">Analysis Result</CardTitle>
                {prediction.isVerified ? (
                  <Badge className="bg-early-green text-white">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  isHealthy ? 'bg-early-green/10' : 'bg-destructive/10'
                }`}>
                  {isHealthy ? (
                    <CheckCircle2 className="w-8 h-8 text-early-green" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-calm-green">
                    {isHealthy ? 'Healthy Plant' : prediction.diseaseName}
                  </p>
                  <p className="text-muted-foreground">{prediction.cropName}</p>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Confidence Score</span>
                  <span className={`font-semibold ${confidenceColor}`}>
                    {prediction.confidence.toFixed(1)}%
                  </span>
                </div>
                <Progress value={prediction.confidence} className="h-2" />
              </div>

              {prediction.isVerified && prediction.verifiedBy && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-pistage p-3 rounded-lg">
                  <User className="w-4 h-4" />
                  <span>Verified by Agricultural Officer</span>
                </div>
              )}

              {prediction.officerComments && (
                <div className="bg-ever-green/30 p-3 rounded-lg">
                  <p className="text-sm font-medium text-calm-green mb-1">Officer Comments</p>
                  <p className="text-sm text-muted-foreground">{prediction.officerComments}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Treatment recommendations */}
        {!isHealthy && prediction.treatments && (
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Treatment Recommendations
              </CardTitle>
              <CardDescription>
                Expert-recommended treatments for {prediction.diseaseName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="organic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="organic" className="flex items-center gap-2">
                    <Leaf className="w-4 h-4" />
                    Organic
                  </TabsTrigger>
                  <TabsTrigger value="chemical" className="flex items-center gap-2">
                    <Beaker className="w-4 h-4" />
                    Chemical
                  </TabsTrigger>
                  <TabsTrigger value="preventive" className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Preventive
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="organic" className="space-y-2">
                  {prediction.treatments.organic.length > 0 ? (
                    prediction.treatments.organic.map((treatment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-pistage rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-early-green/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-early-green">{index + 1}</span>
                        </div>
                        <p className="text-sm text-calm-green">{treatment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No organic treatments available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="chemical" className="space-y-2">
                  {prediction.treatments.chemical.length > 0 ? (
                    prediction.treatments.chemical.map((treatment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-pistage rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-early-green/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-early-green">{index + 1}</span>
                        </div>
                        <p className="text-sm text-calm-green">{treatment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No chemical treatments available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="preventive" className="space-y-2">
                  {prediction.treatments.preventive.length > 0 ? (
                    prediction.treatments.preventive.map((treatment, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-pistage rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-early-green/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium text-early-green">{index + 1}</span>
                        </div>
                        <p className="text-sm text-calm-green">{treatment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No preventive measures available</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Feedback section */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green flex items-center gap-2">
              <ThumbsUp className="w-5 h-5" />
              Help Improve Our AI
            </CardTitle>
            <CardDescription>
              Was this prediction accurate? Your feedback helps us improve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackGiven !== null ? (
              <div className="flex items-center gap-3 bg-pistage p-4 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-early-green" />
                <p className="text-sm text-calm-green">
                  Thank you! You marked this prediction as{' '}
                  <span className="font-semibold">{feedbackGiven ? 'Correct' : 'Incorrect'}</span>.
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleFeedback(true)}
                  disabled={feedbackLoading}
                  className="flex-1 bg-early-green hover:bg-early-green/90 text-white"
                >
                  {feedbackLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsUp className="w-4 h-4 mr-2" />
                  )}
                  Correct
                </Button>
                <Button
                  onClick={() => handleFeedback(false)}
                  disabled={feedbackLoading}
                  variant="outline"
                  className="flex-1 border-destructive text-destructive hover:bg-destructive/10"
                >
                  {feedbackLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 mr-2" />
                  )}
                  Incorrect
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="border-matcha text-calm-green hover:bg-pistage">
            <Link to="/predictions">
              View All Predictions
            </Link>
          </Button>
          <Button asChild className="bg-calm-green hover:bg-resting-green text-white">
            <Link to="/upload">
              Upload Another Image
            </Link>
          </Button>
          <AlertDialog>
          <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete
          </Button>
          </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Prediction</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this prediction? This action cannot be undone and all associated data will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </>
  );
};

export default PredictionResult;
