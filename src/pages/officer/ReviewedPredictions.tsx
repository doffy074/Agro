import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Leaf,
} from 'lucide-react';
import { officerApi } from '@/services/api';
import { Prediction } from '@/types';

const ReviewedPredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchReviewed = async () => {
      setIsLoading(true);
      try {
        const response = await officerApi.getReviewedPredictions(page, limit);
        if (response.data) {
          setPredictions(response.data.predictions);
          setTotal(response.data.total);
        }
      } catch (error) {
        console.error('Failed to fetch reviewed predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewed();
  }, [page]);

  const filteredPredictions = predictions.filter(
    (p) =>
      p.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.diseaseName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-calm-green">Reviewed Predictions</h1>
        <p className="text-muted-foreground">View predictions you have already reviewed</p>
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
          <CardTitle className="text-calm-green flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Reviewed
          </CardTitle>
          <CardDescription>
            {filteredPredictions.length} prediction{filteredPredictions.length !== 1 ? 's' : ''} reviewed
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
              <p className="text-muted-foreground">No reviewed predictions yet</p>
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
                      <Badge variant="secondary" className="bg-early-green/20 text-early-green">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Reviewed
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Disease: <span className="font-medium">{prediction.diseaseName}</span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: <span className="font-medium">{prediction.confidence.toFixed(1)}%</span>
                    </p>
                    {prediction.officerComments && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        Your comment: {prediction.officerComments}
                      </p>
                    )}
                  </div>
                  <Button asChild variant="outline" className="border-matcha text-calm-green hover:bg-pistage">
                    <Link to={`/officer/reviews/${prediction.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewedPredictions;
