import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { officerApi } from '@/services/api';
import { Prediction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const OfficerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<Prediction[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    reviewed: 0,
    accuracy: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reviewsResponse, statsResponse] = await Promise.all([
          officerApi.getPendingReviews(1, 5),
          officerApi.getStatistics(),
        ]);
        
        if (reviewsResponse.data) {
          setPendingReviews(reviewsResponse.data.predictions);
          setStats((prev) => ({ ...prev, pending: reviewsResponse.data!.total }));
        }
        
        if (statsResponse.data) {
          setStats((prev) => ({
            ...prev,
            reviewed: statsResponse.data!.totalReviewed,
            accuracy: statsResponse.data!.accuracyRate,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-calm-green to-resting-green rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Welcome, Officer {user?.name?.split(' ')[0]}! 👨‍🔬
        </h1>
        <p className="text-white/80 mb-4">
          Review and verify AI predictions submitted by farmers
        </p>
        <Button asChild className="bg-white text-calm-green hover:bg-pistage">
          <Link to="/officer/reviews">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Start Reviewing
          </Link>
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reviewed</p>
                <p className="text-2xl font-bold text-early-green">{stats.reviewed}</p>
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
                <p className="text-sm text-muted-foreground">AI Accuracy</p>
                <p className="text-2xl font-bold text-calm-green">{stats.accuracy.toFixed(1)}%</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-calm-green/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-calm-green" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending reviews */}
      <Card className="border-matcha/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-calm-green">Pending Reviews</CardTitle>
            <CardDescription>Farmer submissions awaiting your verification</CardDescription>
          </div>
          <Button variant="ghost" asChild className="text-early-green">
            <Link to="/officer/reviews">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-calm-green" />
            </div>
          ) : pendingReviews.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 mx-auto text-early-green mb-4" />
              <p className="text-muted-foreground">All caught up! No pending reviews.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map((prediction) => (
                <Link
                  key={prediction.id}
                  to={`/officer/reviews/${prediction.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-pistage transition-colors"
                >
                  <img
                    src={getImageUrl(prediction.imageUrl)}
                    alt={prediction.cropName}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-calm-green">{prediction.cropName}</p>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                        Pending
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      AI detected: {prediction.diseaseName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {prediction.confidence.toFixed(1)}%
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-matcha/30 hover:bg-pistage/50 transition-colors cursor-pointer">
          <Link to="/officer/statistics">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-calm-green/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-calm-green" />
              </div>
              <div>
                <p className="font-medium text-calm-green">View Statistics</p>
                <p className="text-sm text-muted-foreground">Disease trends by crop</p>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="border-matcha/30 hover:bg-pistage/50 transition-colors cursor-pointer">
          <Link to="/officer/reviewed">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-early-green/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-early-green" />
              </div>
              <div>
                <p className="font-medium text-calm-green">Reviewed History</p>
                <p className="text-sm text-muted-foreground">Your past verifications</p>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default OfficerDashboard;
