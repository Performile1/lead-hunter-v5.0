import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

interface DHLNotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

export const DHLNotification: React.FC<DHLNotificationProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-500',
          icon: <CheckCircle className="w-6 h-6 text-green-600" />,
          titleColor: 'text-green-900',
          messageColor: 'text-green-700'
        };
      case 'error':
        return {
          bg: 'bg-red-50',
          border: 'border-[#D40511]',
          icon: <XCircle className="w-6 h-6 text-[#D40511]" />,
          titleColor: 'text-[#D40511]',
          messageColor: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-[#FFCC00]',
          icon: <AlertTriangle className="w-6 h-6 text-yellow-600" />,
          titleColor: 'text-yellow-900',
          messageColor: 'text-yellow-700'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          icon: <Info className="w-6 h-6 text-blue-600" />,
          titleColor: 'text-blue-900',
          messageColor: 'text-blue-700'
        };
    }
  };

  const styles = getStyles();

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-[9999] ${styles.bg} border-l-4 ${styles.border} shadow-xl rounded-lg p-4 max-w-md animate-slideInRight`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{styles.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-sm uppercase tracking-wide ${styles.titleColor} mb-1`}>
            {title}
          </h3>
          <p className={`text-sm ${styles.messageColor}`}>{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Global notification manager
let notificationId = 0;
const notifications: Map<number, () => void> = new Map();

export const showDHLNotification = (
  type: 'success' | 'error' | 'warning' | 'info',
  title: string,
  message: string,
  duration = 5000
) => {
  const id = notificationId++;
  const container = document.createElement('div');
  document.body.appendChild(container);

  const root = (window as any).ReactDOM?.createRoot?.(container) || (window as any).ReactDOM?.render;
  
  const cleanup = () => {
    notifications.delete(id);
    if ((window as any).ReactDOM?.createRoot) {
      setTimeout(() => {
        root?.unmount?.();
        document.body.removeChild(container);
      }, 300);
    } else {
      (window as any).ReactDOM?.unmountComponentAtNode(container);
      document.body.removeChild(container);
    }
  };

  notifications.set(id, cleanup);

  const NotificationWrapper = () => (
    <DHLNotification
      type={type}
      title={title}
      message={message}
      duration={duration}
      onClose={cleanup}
    />
  );

  if ((window as any).ReactDOM?.createRoot) {
    const reactRoot = (window as any).ReactDOM.createRoot(container);
    reactRoot.render(<NotificationWrapper />);
  } else {
    (window as any).ReactDOM?.render(<NotificationWrapper />, container);
  }

  return cleanup;
};

// Helper functions
export const showSuccess = (title: string, message: string, duration?: number) =>
  showDHLNotification('success', title, message, duration);

export const showError = (title: string, message: string, duration?: number) =>
  showDHLNotification('error', title, message, duration);

export const showWarning = (title: string, message: string, duration?: number) =>
  showDHLNotification('warning', title, message, duration);

export const showInfo = (title: string, message: string, duration?: number) =>
  showDHLNotification('info', title, message, duration);
