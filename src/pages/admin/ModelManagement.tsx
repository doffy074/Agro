import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Cpu,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Power,
  BarChart3,
  Clock,
  Database,
} from 'lucide-react';
import { adminApi } from '@/services/api';

interface ModelInfo {
  name: string;
  displayName: string;
  type: string;
  version: string;
  accuracy: number;
  lastTrained: string;
  isActive: boolean;
  isLoaded: boolean;
}

const ModelManagement: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [globalActive, setGlobalActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    fetchModelInfo();
  }, []);

  const fetchModelInfo = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getModelInfo();
      if (response.data) {
        setModels(response.data.models);
        setGlobalActive(response.data.isActive);
      }
    } catch (error) {
      console.error('Failed to fetch model info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleModel = async (isActive: boolean) => {
    setIsToggling(true);
    try {
      await adminApi.toggleModel(isActive);
      setGlobalActive(isActive);
      setModels((prev) => prev.map((m) => ({ ...m, isActive: isActive && m.isLoaded })));
    } catch (error) {
      console.error('Failed to toggle model:', error);
    } finally {
      setIsToggling(false);
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

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">AI Model Management</h1>
          <p className="text-muted-foreground">Monitor and control the plant disease detection model</p>
        </div>

        {/* Model status cards */}
        {models.map((m) => (
          <Card key={m.name} className="border-matcha/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    m.isActive ? 'bg-early-green/10' : 'bg-destructive/10'
                  }`}>
                    <Cpu className={`w-6 h-6 ${m.isActive ? 'text-early-green' : 'text-destructive'}`} />
                  </div>
                  <div>
                    <CardTitle className="text-calm-green">{m.displayName}</CardTitle>
                    <CardDescription>{m.type} based classifier</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!m.isLoaded && (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                      Not Loaded
                    </Badge>
                  )}
                  <Badge className={m.isActive ? 'bg-early-green text-white' : 'bg-destructive'}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-pistage rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-calm-green" />
                    <span className="text-sm text-muted-foreground">Model Name</span>
                  </div>
                  <p className="font-semibold text-calm-green">{m.name}</p>
                </div>
                <div className="p-4 bg-pistage rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-calm-green" />
                    <span className="text-sm text-muted-foreground">Version</span>
                  </div>
                  <p className="font-semibold text-calm-green">{m.version}</p>
                </div>
                <div className="p-4 bg-pistage rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-calm-green" />
                    <span className="text-sm text-muted-foreground">Last Trained</span>
                  </div>
                  <p className="font-semibold text-calm-green">
                    {m.lastTrained ? new Date(m.lastTrained).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Accuracy */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-calm-green" />
                    <span className="font-medium text-calm-green">Model Accuracy</span>
                  </div>
                  <span className="text-xl font-bold text-early-green">
                    {m.accuracy?.toFixed(1) || 0}%
                  </span>
                </div>
                <Progress value={m.accuracy || 0} className="h-3" />
                <p className="text-xs text-muted-foreground mt-2">
                  Based on validation dataset performance
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Global Model Status Toggle */}
        <Card className="border-matcha/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Power className={globalActive ? 'w-5 h-5 text-early-green' : 'w-5 h-5 text-destructive'} />
                <div>
                  <Label htmlFor="model-toggle" className="text-base font-medium">Model Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {globalActive ? 'Models are accepting predictions' : 'Models are currently disabled'}
                  </p>
                </div>
              </div>
              <Switch
                id="model-toggle"
                checked={globalActive}
                onCheckedChange={handleToggleModel}
                disabled={isToggling}
              />
            </div>
          </CardContent>
        </Card>

        {/* Model capabilities */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Model Capabilities</CardTitle>
            <CardDescription>Supported crops and disease detection features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium text-calm-green">Supported Crops</h4>
                <div className="flex flex-wrap gap-2">
                  {['Tomato', 'Potato', 'Corn', 'Apple', 'Grape', 'Pepper', 'Strawberry', 'Cherry', 'Peach'].map(
                    (crop) => (
                      <Badge key={crop} variant="outline" className="border-matcha text-calm-green">
                        {crop}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-calm-green">Features</h4>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-early-green" />
                    Multi-class disease classification
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-early-green" />
                    Confidence score estimation
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-early-green" />
                    Treatment recommendations
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-early-green" />
                    Healthy plant detection
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green">Model Actions</CardTitle>
            <CardDescription>Administrative operations for the AI model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-matcha text-calm-green hover:bg-pistage"
                onClick={fetchModelInfo}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </Button>
              <Button
                variant="outline"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                disabled
              >
                <Activity className="w-4 h-4 mr-2" />
                Trigger Retraining
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              Retraining requires manual approval and sufficient training data.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ModelManagement;
