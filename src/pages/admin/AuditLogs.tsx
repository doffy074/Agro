import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  User,
  Shield,
  FileText,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { AuditLog } from '@/types';

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const response = await adminApi.getAuditLogs(currentPage, pageSize);
        if (response.data) {
          setLogs(response.data.logs);
          setTotalPages(Math.ceil(response.data.total / pageSize));
        }
      } catch (error) {
        console.error('Failed to fetch audit logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage]);

  const getActionIcon = (action: string) => {
    if (action.includes('role')) return <Shield className="w-4 h-4 text-early-green" />;
    if (action.includes('user')) return <User className="w-4 h-4 text-calm-green" />;
    if (action.includes('prediction')) return <FileText className="w-4 h-4 text-matcha" />;
    return <Activity className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionBadge = (action: string) => {
    if (action.includes('create') || action.includes('register')) {
      return <Badge className="bg-early-green text-white">Create</Badge>;
    }
    if (action.includes('update') || action.includes('change')) {
      return <Badge className="bg-yellow-500 text-white">Update</Badge>;
    }
    if (action.includes('delete') || action.includes('remove')) {
      return <Badge variant="destructive">Delete</Badge>;
    }
    if (action.includes('login')) {
      return <Badge className="bg-calm-green text-white">Login</Badge>;
    }
    return <Badge variant="secondary">Action</Badge>;
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>

        {/* Info card */}
        <Card className="border-matcha/30 bg-ever-green/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-calm-green">Audit Trail</p>
                <p className="text-sm text-muted-foreground">
                  All critical actions including role changes, user modifications, and system events 
                  are recorded here for security and compliance purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Activity Log
            </CardTitle>
            <CardDescription>Recent system activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-calm-green" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No audit logs available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-pistage flex items-center justify-center flex-shrink-0">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-medium text-calm-green">{log.action}</p>
                        {getActionBadge(log.action)}
                      </div>
                      <p className="text-sm text-muted-foreground">{log.details}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {log.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        {log.ipAddress && (
                          <span className="hidden sm:inline">IP: {log.ipAddress}</span>
                        )}
                      </div>
                    </div>
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

export default AuditLogs;
