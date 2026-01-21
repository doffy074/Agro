import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3, TrendingUp, Leaf, AlertTriangle } from 'lucide-react';
import { officerApi } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface CropStat {
  crop: string;
  count: number;
  accuracy: number;
}

const OfficerStatistics: React.FC = () => {
  const [stats, setStats] = useState<{
    totalReviewed: number;
    accuracyRate: number;
    byCrop: CropStat[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await officerApi.getStatistics();
        if (response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const COLORS = ['#728A6E', '#8EA48B', '#324D3E', '#2B4336', '#BECFBB'];

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-calm-green" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">Statistics Dashboard</h1>
          <p className="text-muted-foreground">Disease detection trends and AI accuracy metrics</p>
        </div>

        {/* Summary cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="border-matcha/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reviewed</p>
                  <p className="text-3xl font-bold text-calm-green">{stats?.totalReviewed || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-calm-green/10 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-calm-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Accuracy Rate</p>
                  <p className="text-3xl font-bold text-early-green">{stats?.accuracyRate.toFixed(1) || 0}%</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-early-green/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-early-green" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-matcha/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crops Analyzed</p>
                  <p className="text-3xl font-bold text-matcha">{stats?.byCrop.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-matcha/10 flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-matcha" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Bar chart - Predictions by crop */}
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green">Predictions by Crop</CardTitle>
              <CardDescription>Number of disease predictions per crop type</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.byCrop && stats.byCrop.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.byCrop}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#BECFBB" />
                    <XAxis dataKey="crop" tick={{ fill: '#324D3E', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#324D3E', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #8EA48B',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#728A6E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie chart - Accuracy distribution */}
          <Card className="border-matcha/30">
            <CardHeader>
              <CardTitle className="text-calm-green">Accuracy by Crop</CardTitle>
              <CardDescription>AI accuracy rates for different crop types</CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.byCrop && stats.byCrop.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.byCrop}
                      dataKey="count"
                      nameKey="crop"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ crop, count }) => `${crop}: ${count}`}
                    >
                      {stats.byCrop.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Crop details table */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Detailed Crop Statistics</CardTitle>
            <CardDescription>Breakdown of predictions and accuracy by crop type</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.byCrop && stats.byCrop.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-matcha/20">
                      <th className="text-left py-3 px-4 text-sm font-medium text-calm-green">Crop</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-calm-green">Predictions</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-calm-green">AI Accuracy</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-calm-green">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.byCrop.map((crop, index) => (
                      <tr key={index} className="border-b border-matcha/10 hover:bg-pistage">
                        <td className="py-3 px-4 font-medium text-calm-green">{crop.crop}</td>
                        <td className="py-3 px-4 text-right">{crop.count}</td>
                        <td className="py-3 px-4 text-right">{crop.accuracy.toFixed(1)}%</td>
                        <td className="py-3 px-4 text-center">
                          {crop.accuracy >= 80 ? (
                            <span className="inline-flex items-center gap-1 text-early-green text-sm">
                              <TrendingUp className="w-4 h-4" /> Good
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-yellow-600 text-sm">
                              <AlertTriangle className="w-4 h-4" /> Needs Improvement
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No statistics available yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default OfficerStatistics;
