// ============================================================================
// NOTIFICATION CONTAINER - Mostrar notificaciones globales
// ============================================================================

import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { NotificationType } from '../../types';
import { Z_INDEX } from '../../constants';

const typeStyles = {
  [NotificationType.SUCCESS]: 'bg-green-500 text-white',
  [NotificationType.ERROR]: 'bg-red-500 text-white',
  [NotificationType.WARNING]: 'bg-yellow-500 text-white',
  [NotificationType.INFO]: 'bg-blue-500 text-white',
};

const typeIcons = {
  [NotificationType.SUCCESS]: '✓',
  [NotificationType.ERROR]: '✕',
  [NotificationType.WARNING]: '⚠',
  [NotificationType.INFO]: 'ℹ',
};

export const NotificationContainer: React.FC = () => {
  const { notifications, removeNotification } = useNotification();

  return (
    <div
      className="fixed top-4 right-4 space-y-2 max-w-md pointer-events-none"
      style={{ zIndex: Z_INDEX.NOTIFICATION }}
    >
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${typeStyles[notification.type]} rounded-lg shadow-lg p-4 flex items-start gap-3 animate-slide-in pointer-events-auto`}
        >
          <span className="text-lg flex-shrink-0 mt-1">
            {typeIcons[notification.type]}
          </span>
          <div className="flex-1 min-w-0">
            {notification.title && (
              <p className="font-semibold text-sm">{notification.title}</p>
            )}
            <p className="text-sm">{notification.message}</p>
          </div>
          {notification.action && (
            <button
              onClick={() => {
                notification.action?.onClick();
                removeNotification(notification.id);
              }}
              className="text-sm font-semibold hover:opacity-80 transition-opacity"
            >
              {notification.action.label}
            </button>
          )}
          <button
            onClick={() => removeNotification(notification.id)}
            className="text-lg flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
