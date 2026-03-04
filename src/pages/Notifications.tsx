import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { notificationApi } from '@/services/api';
import { Notification as NotificationType } from '@/types';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      setError('');
      const response = await notificationApi.getNotifications(1, 50);
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      // Silently fail, user can retry
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      // Silently fail
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationApi.deleteNotification(id);
      const removed = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (removed && !removed.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      // Silently fail
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'prediction_ready':
        return <CheckCircle2 className="w-5 h-5 text-early-green" />;
      case 'review_request':
        return <Info className="w-5 h-5 text-calm-green" />;
      case 'role_change':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'system_alert':
      default:
        return <Info className="w-5 h-5 text-calm-green" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-calm-green flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-white">{unreadCount}</Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated with your plant health alerts</p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="border-matcha text-calm-green hover:bg-pistage"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <Card className="border-matcha/30">
        <CardHeader>
          <CardTitle className="text-calm-green">All Notifications</CardTitle>
          <CardDescription>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 mx-auto text-calm-green animate-spin mb-4" />
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">{error}</p>
              <Button variant="outline" size="sm" onClick={() => { setIsLoading(true); fetchNotifications(); }}>
                Try again
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground">No notifications</p>
              <p className="text-sm text-muted-foreground mt-1">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 hover:bg-pistage/50 transition-colors cursor-pointer",
                    !notification.isRead && "bg-ever-green/10"
                  )}
                  onClick={() => {
                    if (!notification.isRead) markAsRead(notification.id);
                    if (notification.link) {
                      navigate(notification.link);
                    }
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={cn(
                            "font-medium",
                            !notification.isRead ? "text-calm-green" : "text-muted-foreground"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-calm-green" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
