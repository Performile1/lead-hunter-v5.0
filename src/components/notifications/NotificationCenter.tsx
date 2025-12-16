import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, User } from 'lucide-react';

interface Notification {
  id: string;
  type: 'lead_assigned' | 'cronjob_complete' | 'customer_update' | 'message' | 'warning';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  link?: string;
}

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);
  const hasFetchedRef = useRef(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Only fetch once on mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchNotifications();
    }
    
    // Poll for new notifications every 30 seconds - only if API is available
    const interval = setInterval(() => {
      if (apiAvailable === true) {
        fetchNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [apiAvailable]);

  const fetchNotifications = async () => {
    // Don't retry if we already know API is unavailable
    if (apiAvailable === false) {
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/notifications`);
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Notifications API not available yet. Polling stopped.');
          setApiAvailable(false);
          setNotifications([]);
          return;
        }
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
      setApiAvailable(true);
    } catch (error) {
      console.warn('Notifications API not available yet. Polling stopped.');
      setApiAvailable(false);
      setNotifications([]);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, { method: 'POST' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'lead_assigned':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'cronjob_complete':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'customer_update':
        return <Info className="w-4 h-4 text-gray-700" />;
      case 'message':
        return <Bell className="w-4 h-4 text-yellow-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-black text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="font-bold text-sm uppercase tracking-wide">Notifikationer</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  Markera alla som lästa
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Inga notifikationer</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => {
                    markAsRead(notification.id);
                    if (notification.link) {
                      window.location.href = notification.link;
                    }
                  }}
                  className={`p-4 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-slate-900">
                          {notification.title}
                        </h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mb-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(notification.timestamp).toLocaleString('sv-SE')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-200 bg-slate-50">
            <a
              href="/notifications"
              className="block text-center text-xs text-blue-600 hover:text-blue-800 font-semibold"
            >
              Se alla notifikationer →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
