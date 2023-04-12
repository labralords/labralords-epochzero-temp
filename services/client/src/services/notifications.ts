import { v4 as uuidV4 } from 'uuid';
import type { SvelteComponent } from 'svelte';
import { notifications } from '../store';

export interface Notification {
  id: string;
  timestamp: number;
  timeout?: number;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string | SvelteComponent;
  link?: {
    text: string;
    href: string;
    target: string;
  };
}

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
  notifications.update((currentNotifications) => {
    currentNotifications.push({ timeout: 5000, ...notification, timestamp: Date.now(), id: uuidV4() });
    return currentNotifications;
  });
};

export const removeNotification = (id: string) => {
  notifications.update((currentNotifications) => {
    return currentNotifications.filter((notification) => notification.id !== id);
  });
};

export const clearNotifications = () => {
  notifications.set([]);
};

export const getNotifications = () => {
  return notifications;
};
