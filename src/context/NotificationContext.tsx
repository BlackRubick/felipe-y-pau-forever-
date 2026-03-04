import React, { createContext, useContext, useCallback, useState } from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = () => `notification-${Date.now()}-${Math.random()}`;

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const fullNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 4000,
    };

    setNotifications((prev) => [...prev, fullNotification]);

    if (fullNotification.duration && fullNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, fullNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: NotificationType.SUCCESS,
        message,
        duration: duration ?? 4000,
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: NotificationType.ERROR,
        message,
        duration: duration ?? 6000,
      });
    },
    [addNotification]
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: NotificationType.WARNING,
        message,
        duration: duration ?? 5000,
      });
    },
    [addNotification]
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      return addNotification({
        type: NotificationType.INFO,
        message,
        duration: duration ?? 4000,
      });
    },
    [addNotification]
  );

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info,
  };

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};
