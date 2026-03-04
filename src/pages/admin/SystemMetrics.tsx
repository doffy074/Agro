import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Shield,
  Activity,
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  Leaf,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { SystemMetrics as SystemMetricsType } from '@/types';

const SystemMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetricsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await adminApi.getMetrics();
        if (response.data) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch system metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-calm-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-calm-green">System Metrics</h1>
        <p className="text-muted-foreground mt-1">
          Monitor platform performance and usage statistics
        </p>
      </div>

      {/* User Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-calm-green mb-4">User Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-calm-green">{metrics?.totalUsers || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-calm-green/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-calm-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Farmers</p>
                  <p className="text-2xl font-bold text-early-green">{metrics?.totalFarmers || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-early-green/10 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-early-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Officers</p>
                  <p className="text-2xl font-bold text-matcha">{metrics?.totalOfficers || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-matcha/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-matcha" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold text-resting-green">{metrics?.totalAdmins || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-resting-green/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-resting-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prediction Metrics */}
      <div>
        <h2 className="text-lg font-semibold text-calm-green mb-4">Prediction Analytics</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Predictions</p>
                  <p className="text-2xl font-bold text-calm-green">{metrics?.totalPredictions || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-calm-green/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-calm-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-early-green">{metrics?.verifiedPredictions || 0}</p>
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
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics?.pendingReviews || 0}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Accuracy</p>
                  <p className="text-2xl font-bold text-calm-green">{metrics?.accuracyRate?.toFixed(1) || 0}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-calm-green/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-calm-green" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <Card className="border-matcha/30">
        <CardHeader>
          <CardTitle className="text-calm-green flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health
          </CardTitle>
          <CardDescription>Current platform status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-early-green animate-pulse" />
              <span className="font-medium">API Server</span>
            </div>
            <span className="text-sm text-early-green font-medium">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-early-green animate-pulse" />
              <span className="font-medium">AI Model</span>
            </div>
            <span className="text-sm text-early-green font-medium">Operational</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-early-green animate-pulse" />
              <span className="font-medium">Database</span>
            </div>
            <span className="text-sm text-early-green font-medium">Operational</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMetrics;
