import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Leaf,
} from 'lucide-react';
import { officerApi } from '@/services/api';
import { Prediction } from '@/types';

const PendingReviews: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        const response = await officerApi.getPendingReviews(currentPage, pageSize);
        if (response.data) {
          setPredictions(response.data.predictions);
          setTotalPages(Math.ceil(response.data.total / pageSize));
        }
      } catch (error) {
        console.error('Failed to fetch pending reviews:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [currentPage]);

  const filteredPredictions = predictions.filter(
    (prediction) =>
      prediction.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prediction.diseaseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">Pending Reviews</h1>
          <p className="text-muted-foreground">Verify AI predictions submitted by farmers</p>
        </div>

        {/* Search */}
        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by crop or disease name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Predictions list */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Awaiting Verification</CardTitle>
            <CardDescription>
              {filteredPredictions.length} prediction{filteredPredictions.length !== 1 ? 's' : ''} pending review
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-calm-green" />
              </div>
            ) : filteredPredictions.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-12 h-12 mx-auto text-early-green mb-4" />
                <p className="text-muted-foreground">No pending reviews at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPredictions.map((prediction) => (
                  <div
                    key={prediction.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
                  >
                    <img
                      src={getImageUrl(prediction.imageUrl)}
                      alt={prediction.cropName}
                      className="w-20 h-20 rounded-lg object-cover bg-pistage"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-calm-green">{prediction.cropName}</p>
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        AI Detection: <span className="font-medium">{prediction.diseaseName}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: <span className="font-medium">{prediction.confidence.toFixed(1)}%</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(prediction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button asChild className="bg-calm-green hover:bg-resting-green text-white">
                      <Link to={`/officer/reviews/${prediction.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-matcha"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-matcha"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default PendingReviews;
