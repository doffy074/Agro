import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Leaf,
  History,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { predictionApi } from '@/services/api';
import { Prediction } from '@/types';

const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    healthy: 0,
    diseased: 0,
    verified: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch predictions for display and stats separately
        const [predictionsResponse, statsResponse] = await Promise.all([
          predictionApi.getPredictions(1, 5),
          predictionApi.getStats()
        ]);
        
        if (predictionsResponse.data) {
          setRecentPredictions(predictionsResponse.data.predictions);
        }
        
        if (statsResponse.data) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusIcon = (status: string, isVerified: boolean) => {
    if (status === 'healthy') {
      return <CheckCircle2 className="w-5 h-5 text-early-green" />;
    }
    if (!isVerified) {
      return <Clock className="w-5 h-5 text-yellow-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-calm-green to-resting-green rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-white/80 mb-4">
          Upload a plant leaf image to detect diseases instantly with AI
        </p>
        <Button asChild className="bg-white text-calm-green hover:bg-pistage">
          <Link to="/upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload New Image
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Scans</p>
                <p className="text-2xl font-bold text-calm-green">{stats.total}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-calm-green/10 flex items-center justify-center">
                <Leaf className="w-5 h-5 text-calm-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Healthy</p>
                <p className="text-2xl font-bold text-early-green">{stats.healthy}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-early-green/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-early-green" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Diseased</p>
                <p className="text-2xl font-bold text-destructive">{stats.diseased}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-matcha">{stats.verified}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-matcha/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-matcha" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent predictions */}
      <Card className="border-matcha/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-calm-green">Recent Predictions</CardTitle>
            <CardDescription>Your latest plant disease scans</CardDescription>
          </div>
          <Button variant="ghost" asChild className="text-early-green">
            <Link to="/predictions">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-calm-green"></div>
            </div>
          ) : recentPredictions.length === 0 ? (
            <div className="text-center py-8">
              <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No predictions yet</p>
              <Button asChild className="mt-4 bg-calm-green hover:bg-resting-green">
                <Link to="/upload">Upload Your First Image</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPredictions.map((prediction) => (
                <Link
                  key={prediction.id}
                  to={`/predictions/${prediction.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-pistage transition-colors"
                >
                  <img
                    src={getImageUrl(prediction.imageUrl)}
                    alt={prediction.cropName}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-calm-green truncate">
                        {prediction.cropName}
                      </p>
                      {prediction.isVerified && (
                        <Badge className="bg-early-green text-white text-xs">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {prediction.diseaseName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={prediction.confidence} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {prediction.confidence.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  {getStatusIcon(prediction.status, prediction.isVerified)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick tips */}
      <Card className="border-matcha/30 bg-ever-green/20">
        <CardHeader>
          <CardTitle className="text-calm-green flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Quick Tips for Better Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="grid md:grid-cols-2 gap-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-early-green mt-1 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Take photos in good lighting conditions
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-early-green mt-1 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Focus on the affected area of the leaf
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-early-green mt-1 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Ensure the leaf fills most of the frame
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-early-green mt-1 flex-shrink-0" />
              <span className="text-sm text-muted-foreground">
                Avoid blurry or out-of-focus images
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerDashboard;
