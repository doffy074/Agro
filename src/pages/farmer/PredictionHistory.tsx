import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getImageUrl } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Leaf,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
} from 'lucide-react';
import { predictionApi } from '@/services/api';
import { Prediction } from '@/types';

const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const fetchPredictions = async () => {
      setIsLoading(true);
      try {
        const response = await predictionApi.getPredictions(currentPage, pageSize);
        if (response.data) {
          setPredictions(response.data.predictions);
          setTotalPages(Math.ceil(response.data.total / pageSize));
        }
      } catch (error) {
        console.error('Failed to fetch predictions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPredictions();
  }, [currentPage]);

  const filteredPredictions = predictions.filter((prediction) => {
    const matchesSearch =
      prediction.cropName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prediction.diseaseName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'healthy' && prediction.status === 'healthy') ||
      (statusFilter === 'diseased' && prediction.status === 'diseased') ||
      (statusFilter === 'verified' && prediction.isVerified) ||
      (statusFilter === 'pending' && !prediction.isVerified);
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (prediction: Prediction) => {
    if (prediction.status === 'healthy') {
      return (
        <Badge className="bg-early-green text-white">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Healthy
        </Badge>
      );
    }
    if (prediction.isVerified) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Diseased
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-calm-green">Prediction History</h1>
            <p className="text-muted-foreground">View all your plant disease predictions</p>
          </div>
          <Button asChild className="bg-calm-green hover:bg-resting-green text-white">
            <Link to="/upload">
              <Upload className="w-4 h-4 mr-2" />
              New Scan
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by crop or disease name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Results</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="diseased">Diseased</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Predictions list */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Your Scans</CardTitle>
            <CardDescription>
              {filteredPredictions.length} prediction{filteredPredictions.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-calm-green" />
              </div>
            ) : filteredPredictions.length === 0 ? (
              <div className="text-center py-12">
                <Leaf className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No predictions found</p>
                <Button asChild className="bg-calm-green hover:bg-resting-green">
                  <Link to="/upload">Upload Your First Image</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPredictions.map((prediction) => (
                  <Link
                    key={prediction.id}
                    to={`/predictions/${prediction.id}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
                  >
                    <img
                      src={getImageUrl(prediction.imageUrl)}
                      alt={prediction.cropName}
                      className="w-16 h-16 rounded-lg object-cover bg-pistage"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-calm-green">{prediction.cropName}</p>
                        {getStatusBadge(prediction)}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {prediction.status === 'healthy' ? 'No disease detected' : prediction.diseaseName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(prediction.createdAt).toLocaleDateString()} •{' '}
                        Confidence: {prediction.confidence.toFixed(1)}%
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </Link>
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

export default PredictionHistory;
