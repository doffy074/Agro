import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Shield,
  BarChart3,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { SystemMetrics } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await adminApi.getMetrics();
        if (response.data) {
          setMetrics(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
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
      {/* Welcome section */}
      <div className="bg-gradient-to-r from-calm-green to-resting-green rounded-2xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          Admin Dashboard 🛡️
        </h1>
        <p className="text-white/80 mb-4">
          Welcome, {user?.name}. Manage users, monitor system performance, and control AI models.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="bg-white dark:bg-card text-calm-green hover:bg-pistage">
            <Link to="/admin/users">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-white text-white hover:bg-white/10">
            <Link to="/admin/roles">
              <Shield className="w-4 h-4 mr-2" />
              Assign Roles
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats cards */}
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
                <Activity className="w-5 h-5 text-early-green" />
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

      {/* System overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Prediction Stats</CardTitle>
            <CardDescription>Overview of AI prediction activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-calm-green" />
                <span>Total Predictions</span>
              </div>
              <span className="font-bold text-calm-green">{metrics?.totalPredictions || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-early-green" />
                <span>Verified Predictions</span>
              </div>
              <span className="font-bold text-early-green">{metrics?.verifiedPredictions || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-pistage rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span>Pending Reviews</span>
              </div>
              <span className="font-bold text-yellow-600">{metrics?.pendingReviews || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              to="/admin/users"
              className="flex items-center justify-between p-3 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-calm-green" />
                <div>
                  <p className="font-medium text-calm-green">User Management</p>
                  <p className="text-xs text-muted-foreground">View and manage all users</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            
            <Link
              to="/admin/roles"
              className="flex items-center justify-between p-3 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-early-green" />
                <div>
                  <p className="font-medium text-calm-green">Role Assignment</p>
                  <p className="text-xs text-muted-foreground">Promote farmers to officers</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            
            <Link
              to="/admin/logs"
              className="flex items-center justify-between p-3 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-matcha" />
                <div>
                  <p className="font-medium text-calm-green">Audit Logs</p>
                  <p className="text-xs text-muted-foreground">View system activity</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Security notice */}
      <Card className="border-matcha/30 bg-ever-green/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-calm-green">Role Management Security</p>
              <p className="text-sm text-muted-foreground">
                All new users are assigned the "farmer" role by default. Only administrators can 
                promote users to "officer" or "admin" roles. Role changes are logged in the audit trail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
